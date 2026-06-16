package com.student.backend.repository;

import com.student.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {
    
    @Query("SELECT s FROM Student s WHERE s.studentId = :studentId")
    Optional<Student> findByStudentId(@Param("studentId") Integer studentId);

    @Query("SELECT s FROM Student s WHERE LOWER(s.fullName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Student> searchByFullNameInstant(@Param("name") String name);

    // --- NEW VALIDATION METHODS FOR SEPARATE ERROR REASONS ---
    boolean existsByStudentId(Integer studentId);
    boolean existsByFullName(String fullName);
    boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO deleted_students (id, student_id, full_name, gender, email, college_name, contact_number, degree, branch, deleted_by, delete_reason) " +
                   "SELECT id, student_id, full_name, gender, email, college_name, contact_number, degree, branch, :deletedBy, :reason FROM students WHERE id = :id", 
            nativeQuery = true)
    void archiveDeletedStudent(@Param("id") Integer id, @Param("deletedBy") String deletedBy, @Param("reason") String reason);
}