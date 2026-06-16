package com.student.backend.repository;

import com.student.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findByStudentId(Integer studentId);

    List<Payment> findByStudentIdOrderByCreatedAtDesc(Integer studentId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.studentId = :studentId AND LOWER(p.paymentStatus) = 'paid'")
    BigDecimal sumPaidAmountByStudentId(@Param("studentId") Integer studentId);
}
