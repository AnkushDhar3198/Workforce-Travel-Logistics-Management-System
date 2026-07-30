package com.cbg.travel.repository;

import com.cbg.travel.entity.User;
import com.cbg.travel.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByDepartment(String department);
    List<User> findByRole(UserRole role);
}
