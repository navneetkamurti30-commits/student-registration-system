package com.student.backend.controller;

import com.student.backend.entity.Payment;
import com.student.backend.repository.PaymentRepository;
import com.student.backend.repository.StudentRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5173", "http://localhost:3000"})
public class PaymentController {

    private static final BigDecimal REGISTRATION_FEE = BigDecimal.valueOf(500);

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Payment>> getPaymentsByStudentId(@PathVariable Integer studentId) {
        return ResponseEntity.ok(paymentRepository.findByStudentIdOrderByCreatedAtDesc(studentId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> savePayment(@RequestBody Payment payment) {
        if (payment.getStudentId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student ID is required"));
        }

        if (!studentRepository.existsByStudentId(payment.getStudentId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Student ID " + payment.getStudentId() + " does not exist"));
        }

        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Payment amount must be greater than zero"));
        }

        if (payment.getPaymentStatus() == null || payment.getPaymentStatus().trim().isEmpty()) {
            payment.setPaymentStatus("Paid");
        }

        if ("Paid".equalsIgnoreCase(payment.getPaymentStatus())) {
            BigDecimal alreadyPaid = paymentRepository.sumPaidAmountByStudentId(payment.getStudentId());
            if (alreadyPaid == null) alreadyPaid = BigDecimal.ZERO;
            BigDecimal remainingAmount = REGISTRATION_FEE.subtract(alreadyPaid);

            if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Total registration fee is already paid"));
            }

            if (payment.getAmount().compareTo(remainingAmount) > 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Payment amount cannot be greater than remaining fee: Rs. " + remainingAmount
                ));
            }
        }

        Payment savedPayment = paymentRepository.save(payment);
        return new ResponseEntity<>(savedPayment, HttpStatus.CREATED);
    }
}
