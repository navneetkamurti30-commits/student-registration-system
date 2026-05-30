package com.student.backend.controller;

import com.student.backend.entity.Student;
import com.student.backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentController {

    @Autowired
    private StudentRepository repository;

    @PostMapping
    public ResponseEntity<Student> saveStudent(@RequestBody Student student) {
        try {
            Student savedStudent = repository.save(student);
            return new ResponseEntity<>(savedStudent, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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

    // Changed primitive 'int' to Wrapper 'Integer'
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

    // Changed primitive 'int' to Wrapper 'Integer'
    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Integer id, @RequestBody Student studentDetails) {
        try {
            Optional<Student> student = repository.findById(id);
            if (student.isPresent()) {
                Student existingStudent = student.get();
                
                if (studentDetails.getFullName() != null) {
                    existingStudent.setFullName(studentDetails.getFullName());
                }
                if (studentDetails.getGender() != null) {
                    existingStudent.setGender(studentDetails.getGender());
                }
                if (studentDetails.getEmail() != null) {
                    existingStudent.setEmail(studentDetails.getEmail());
                }
                if (studentDetails.getCollegeName() != null) {
                    existingStudent.setCollegeName(studentDetails.getCollegeName());
                }
                if (studentDetails.getContactNumber() != null) {
                    existingStudent.setContactNumber(studentDetails.getContactNumber());
                }
                if (studentDetails.getDegree() != null) {
                    existingStudent.setDegree(studentDetails.getDegree());
                }
                if (studentDetails.getBranch() != null) {
                    existingStudent.setBranch(studentDetails.getBranch());
                }
                if (studentDetails.getStudentId() != null) {
                    existingStudent.setStudentId(studentDetails.getStudentId());
                }
                
                Student updatedStudent = repository.save(existingStudent);
                return new ResponseEntity<>(updatedStudent, HttpStatus.OK);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Changed primitive 'int' to Wrapper 'Integer'
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteStudent(@PathVariable Integer id) {
        try {
            Optional<Student> student = repository.findById(id);
            if (student.isPresent()) {
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

    // Get student by studentId (business field, 1-99)
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

    // Update student by studentId (business field, 1-99)
    @PutMapping("/by-student-id/{studentId}")
    public ResponseEntity<Student> updateStudentByStudentId(@PathVariable Integer studentId, @RequestBody Student studentDetails) {
        try {
            Optional<Student> student = repository.findByStudentId(studentId);
            if (student.isPresent()) {
                Student existingStudent = student.get();
                
                if (studentDetails.getFullName() != null) {
                    existingStudent.setFullName(studentDetails.getFullName());
                }
                if (studentDetails.getGender() != null) {
                    existingStudent.setGender(studentDetails.getGender());
                }
                if (studentDetails.getEmail() != null) {
                    existingStudent.setEmail(studentDetails.getEmail());
                }
                if (studentDetails.getCollegeName() != null) {
                    existingStudent.setCollegeName(studentDetails.getCollegeName());
                }
                if (studentDetails.getContactNumber() != null) {
                    existingStudent.setContactNumber(studentDetails.getContactNumber());
                }
                if (studentDetails.getDegree() != null) {
                    existingStudent.setDegree(studentDetails.getDegree());
                }
                if (studentDetails.getBranch() != null) {
                    existingStudent.setBranch(studentDetails.getBranch());
                }
                if (studentDetails.getStudentId() != null) {
                    existingStudent.setStudentId(studentDetails.getStudentId());
                }
                
                Student updatedStudent = repository.save(existingStudent);
                return new ResponseEntity<>(updatedStudent, HttpStatus.OK);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}