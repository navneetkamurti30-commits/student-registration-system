package com.student.backend.repository;

import com.student.backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class UserRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public User findByUsername(String username) {
        // 1. Check Admin Table
        String adminQuery = "SELECT username, password FROM admins WHERE username = ?";
        List<User> admins = jdbcTemplate.query(adminQuery, (rs, rowNum) -> 
            new User(rs.getString("username"), rs.getString("password"), "ADMIN")
        , username);

        if (!admins.isEmpty()) {
            return admins.get(0);
        }

        // 2. Check Student Table (safely parsing the string to an int)
        try {
            int studentId = Integer.parseInt(username);
            String studentQuery = "SELECT student_id, password FROM student_login WHERE student_id = ?";
            List<User> students = jdbcTemplate.query(studentQuery, (rs, rowNum) -> 
                new User(String.valueOf(rs.getInt("student_id")), rs.getString("password"), "STUDENT")
            , studentId);

            if (!students.isEmpty()) {
                return students.get(0);
            }
        } catch (NumberFormatException e) {
            // Not a number, perfectly fine, just means it's not a student ID
        }

        return null;
    }
}