package com.student.backend.repository;

import com.student.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {
    // Standard database operations are automatically inherited
    Optional<Student> findByStudentId(Integer studentId);
}