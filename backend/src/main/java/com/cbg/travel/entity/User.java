package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Corporate Identity ---
    @Column(name = "employee_code", unique = true)
    private String employeeCode;

    @Column(name = "name")
    private String name;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String designation;

    // --- Personal Details ---
    @Column(nullable = false)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String gender; // MALE, FEMALE, OTHER

    @Column
    private String nationality;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    // --- Passport & Travel Documents ---
    @Column(name = "passport_number")
    private String passportNumber;

    @Column(name = "passport_expiry")
    private LocalDate passportExpiry;

    // --- Address ---
    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column
    private String city;

    @Column
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column
    private String country;

    // --- Emergency Contact ---
    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relation")
    private String emergencyContactRelation;

    // --- Organizational ---
    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getName() {
        if (name != null && !name.isBlank()) return name;
        if (firstName == null && lastName == null) return "";
        if (lastName == null || lastName.isBlank()) return firstName != null ? firstName : "";
        if (firstName == null || firstName.isBlank()) return lastName;
        return firstName + " " + lastName;
    }
}
