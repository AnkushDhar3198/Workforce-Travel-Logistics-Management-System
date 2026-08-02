package com.cbg.travel.dto;

import com.cbg.travel.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private String department;
    private String phone;
    private String designation;
    private String employeeCode;
    private String profileImageUrl;
    private String firstName;
    private String lastName;
}
