package com.student.backend.controller;

import com.student.backend.entity.Student;
import com.student.backend.entity.DeletedStudent;
import com.student.backend.entity.Payment;
import com.student.backend.repository.StudentRepository;
import com.student.backend.repository.DeletedStudentRepository;
import com.student.backend.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.transaction.Transactional;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5173", "http://localhost:3000"})
public class StudentController {

    private static final BigDecimal REGISTRATION_FEE = BigDecimal.valueOf(500);

    @Autowired
    private StudentRepository repository;

    @Autowired
    private DeletedStudentRepository deletedRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // BRAND NEW ENDPOINT: Processes front-end transaction requests and writes payload items directly into MySQL
    @PostMapping("/process")
    public ResponseEntity<?> processStudentPayment(@RequestBody Payment payment) {
        try {
            if (payment.getStudentId() == null) {
                return ResponseEntity.badRequest().body("{\"message\": \"Student ID reference validation criteria missed!\"}");
            }
            // Check if student identity actually exists inside backend references
            if (!repository.existsByStudentId(payment.getStudentId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("{\"message\": \"Target mapping fail: No registered Student found matching ID: " + payment.getStudentId() + "\"}");
            }
            if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("{\"message\": \"Payment amount must be greater than zero\"}");
            }

            BigDecimal alreadyPaid = paymentRepository.sumPaidAmountByStudentId(payment.getStudentId());
            if (alreadyPaid == null) alreadyPaid = BigDecimal.ZERO;
            BigDecimal remainingAmount = REGISTRATION_FEE.subtract(alreadyPaid);
            if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("{\"message\": \"Total registration fee is already paid\"}");
            }
            if (payment.getAmount().compareTo(remainingAmount) > 0) {
                return ResponseEntity.badRequest().body("{\"message\": \"Payment amount cannot be greater than remaining fee: Rs. " + remainingAmount + "\"}");
            }

            // Decorate transaction fields before executing save write instructions
            payment.setPaymentDate(LocalDateTime.now());
            if (payment.getPaymentStatus() == null) {
                payment.setPaymentStatus("Paid");
            }

            Payment contextSaved = paymentRepository.save(payment);
            return new ResponseEntity<>(contextSaved, HttpStatus.CREATED);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Internal transactional engine runtime failure: " + ex.getMessage() + "\"}");
        }
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @Transactional
    public ResponseEntity<?> saveStudent(
            @RequestParam(value = "file", required = false) MultipartFile file, 
            @RequestParam(value = "paymentAmount", required = false) BigDecimal paymentAmount,
            @RequestParam(value = "paymentMethod", required = false) String paymentMethod,
            @RequestParam(value = "transactionId", required = false) String transactionId,
            @RequestParam(value = "loginPassword", required = false) String loginPassword,
            @ModelAttribute Student student) {
        try {
            if (file != null && !file.isEmpty()) {
                String uploadDir = "uploads/";
                new File(uploadDir).mkdirs(); 
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), Paths.get(uploadDir + fileName));
                student.setProfileImage(fileName);
            }

            if (student.getEmail() == null || student.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("{\"message\": \"Email is required\"}");
            }
            if (student.getFullName() == null || student.getFullName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("{\"message\": \"Full name is required\"}");
            }

            if (repository.existsByStudentId(student.getStudentId())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("{\"message\": \"Student ID '" + student.getStudentId() + "' is already registered!\"}");
            }
            if (repository.existsByFullName(student.getFullName())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("{\"message\": \"This Name is already registered!\"}");
            }
            if (repository.existsByEmail(student.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("{\"message\": \"Email address already exists!\"}");
            }

            if (paymentAmount != null) {
                if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    return ResponseEntity.badRequest().body("{\"message\": \"Payment amount must be greater than zero\"}");
                }
                if (paymentAmount.compareTo(REGISTRATION_FEE) > 0) {
                    return ResponseEntity.badRequest().body("{\"message\": \"Payment amount cannot be greater than total fee: Rs. " + REGISTRATION_FEE + "\"}");
                }
            }

            Student savedStudent = repository.save(student);

            String generatedUsername = student.getFullName().toLowerCase().replaceAll("\\s+", "");
            String defaultPassword = (loginPassword != null && !loginPassword.trim().isEmpty())
                    ? loginPassword.trim()
                    : "1234";

            String insertLoginSql = "INSERT INTO student_login (student_id, username, password) VALUES (?, ?, ?)";
            jdbcTemplate.update(insertLoginSql, student.getStudentId(), generatedUsername, defaultPassword);

            if (paymentAmount != null) {
                Payment registrationPayment = new Payment();
                registrationPayment.setStudentId(savedStudent.getStudentId());
                registrationPayment.setAmount(paymentAmount);
                registrationPayment.setPaymentStatus("Paid");
                registrationPayment.setPaymentMethod(paymentMethod);
                registrationPayment.setTransactionId(transactionId);
                registrationPayment.setPaymentDate(LocalDateTime.now());
                paymentRepository.save(registrationPayment);
            }

            return new ResponseEntity<>(savedStudent, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"message\": \"Error: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        try {
            List<Student> students = repository.findAll();
            return new ResponseEntity<>(students, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<DeletedStudent>> getDeletedStudents() {
        try {
            List<DeletedStudent> deletedStudents = deletedRepository.findAll();
            return new ResponseEntity<>(deletedStudents, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Integer id) {
        try {
            Optional<Student> student = repository.findById(id);
            if (student.isPresent()) {
                return new ResponseEntity<>(student.get(), HttpStatus.OK);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateStudent(@PathVariable Integer id, @RequestBody Student studentDetails) {
        try {
            Optional<Student> student = repository.findById(id);
            if (student.isPresent()) {
                Student existingStudent = student.get();
                Integer oldStudentId = existingStudent.getStudentId();
                
                if (studentDetails.getStudentId() != null) {
                    Optional<Student> conflictId = repository.findByStudentId(studentDetails.getStudentId());
                    if (conflictId.isPresent() && !conflictId.get().getId().equals(id)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("{\"message\": \"Student ID '" + studentDetails.getStudentId() + "' is already taken by someone else.\"}");
                    }
                    existingStudent.setStudentId(studentDetails.getStudentId());
                }

                if (studentDetails.getFullName() != null) {
                    boolean nameConflict = repository.findAll().stream()
                            .anyMatch(s -> s.getFullName().equalsIgnoreCase(studentDetails.getFullName()) && !s.getId().equals(id));
                    if (nameConflict) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("{\"message\": \"This Name is already taken by another student.\"}");
                    }
                    existingStudent.setFullName(studentDetails.getFullName());
                }

                if (studentDetails.getEmail() != null) {
                    boolean emailConflict = repository.findAll().stream()
                            .anyMatch(s -> s.getEmail().equalsIgnoreCase(studentDetails.getEmail()) && !s.getId().equals(id));
                    if (emailConflict) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("{\"message\": \"Email address is already in use by another student.\"}");
                    }
                    existingStudent.setEmail(studentDetails.getEmail());
                }

                if (studentDetails.getGender() != null) existingStudent.setGender(studentDetails.getGender());
                if (studentDetails.getCollegeName() != null) existingStudent.setCollegeName(studentDetails.getCollegeName());
                if (studentDetails.getContactNumber() != null) existingStudent.setContactNumber(studentDetails.getContactNumber());
                if (studentDetails.getDegree() != null) existingStudent.setDegree(studentDetails.getDegree());
                if (studentDetails.getBranch() != null) existingStudent.setBranch(studentDetails.getBranch());
                
                Student updatedStudent = repository.save(existingStudent);

                if (studentDetails.getStudentId() != null && !oldStudentId.equals(studentDetails.getStudentId())) {
                    String updateLoginIdSql = "UPDATE student_login SET student_id = ? WHERE student_id = ?";
                    jdbcTemplate.update(updateLoginIdSql, studentDetails.getStudentId(), oldStudentId);
                }

                return new ResponseEntity<>(updatedStudent, HttpStatus.OK);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"message\": \"Error: " + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<HttpStatus> deleteStudent(@PathVariable Integer id) {
        try {
            Optional<Student> student = repository.findById(id);
            if (student.isPresent()) {
                Integer studentId = student.get().getStudentId();
                
                String deleteLoginSql = "DELETE FROM student_login WHERE student_id = ?";
                jdbcTemplate.update(deleteLoginSql, studentId);

                repository.archiveDeletedStudent(id, "SYSTEM_ADMIN", "User requested deletion via UI form interface");
                repository.deleteById(id);
                
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/restore/{id}")
    @Transactional
    public ResponseEntity<?> restoreStudent(@PathVariable Integer id) {
        try {
            Optional<DeletedStudent> archivedStudentOpt = deletedRepository.findById(id);
            
            if (archivedStudentOpt.isPresent()) {
                DeletedStudent archived = archivedStudentOpt.get();
                
                if (repository.existsByStudentId(archived.getStudentId())) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body("{\"message\": \"Cannot restore: Student ID '" + archived.getStudentId() + "' is already active.\"}");
                }
                if (repository.existsByFullName(archived.getFullName())) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body("{\"message\": \"Cannot restore: Name '" + archived.getFullName() + "' is already active.\"}");
                }
                if (repository.existsByEmail(archived.getEmail())) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body("{\"message\": \"Cannot restore: Email '" + archived.getEmail() + "' is already active.\"}");
                }
                
                Student activeStudent = new Student();
                activeStudent.setStudentId(archived.getStudentId());
                activeStudent.setFullName(archived.getFullName());
                activeStudent.setGender(archived.getGender());
                activeStudent.setEmail(archived.getEmail());
                activeStudent.setCollegeName(archived.getCollegeName());
                activeStudent.setContactNumber(archived.getContactNumber());
                activeStudent.setDegree(archived.getDegree());
                activeStudent.setBranch(archived.getBranch());
                activeStudent.setIsDeleted(false);
                
                repository.save(activeStudent);
                
                String generatedUsername = archived.getFullName().toLowerCase().replaceAll("\\s+", "");
                String defaultPassword = "1234";
                String insertLoginSql = "INSERT INTO student_login (student_id, username, password) VALUES (?, ?, ?)";
                jdbcTemplate.update(insertLoginSql, archived.getStudentId(), generatedUsername, defaultPassword);

                deletedRepository.deleteById(id);
                
                return ResponseEntity.ok().body("{\"message\": \"Student restored successfully\"}");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("{\"message\": \"Student record not found in archive logs\"}");
            }
        } catch (Exception e) {
            System.err.println("CRITICAL RESTORE FAILURE STACK TRACE:");
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Database error: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/by-student-id/{studentId}")
    public ResponseEntity<Student> getStudentByStudentId(@PathVariable Integer studentId) {
        try {
            Optional<Student> student = repository.findByStudentId(studentId);
            if (student.isPresent()) {
                return new ResponseEntity<>(student.get(), HttpStatus.OK);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search-by-name")
    public ResponseEntity<List<Student>> searchStudentsByName(@RequestParam(value = "name", required = false) String name) {
        try {
            if (name == null || name.trim().isEmpty()) {
                return new ResponseEntity<>(new ArrayList<>(), HttpStatus.OK);
            }
            List<Student> students = repository.searchByFullNameInstant(name.trim());
            return new ResponseEntity<>(students, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
