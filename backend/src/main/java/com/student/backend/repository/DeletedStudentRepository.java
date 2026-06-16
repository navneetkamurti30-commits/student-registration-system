package com.student.backend.repository;

import com.student.backend.entity.DeletedStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeletedStudentRepository extends JpaRepository<DeletedStudent, Integer> {
    // Standard JPA queries handles data pulling easily
}