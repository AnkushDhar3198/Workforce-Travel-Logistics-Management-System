package com.cbg.travel.service;

import com.cbg.travel.config.JwtService;
import com.cbg.travel.dto.AuthResponse;
import com.cbg.travel.dto.LoginRequest;
import com.cbg.travel.dto.RegisterRequest;
import com.cbg.travel.entity.User;
import com.cbg.travel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditLogService auditLogService;

    public AuthResponse register(RegisterRequest request) {
        // Check for duplicate email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .department(request.getDepartment())
                .designation(request.getDesignation())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .nationality(request.getNationality())
                .bloodGroup(request.getBloodGroup())
                .passportNumber(request.getPassportNumber())
                .passportExpiry(request.getPassportExpiry())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .emergencyContactRelation(request.getEmergencyContactRelation())
                .managerId(request.getManagerId())
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // Auto-generate employee code: EMP-<zero-padded ID>
        savedUser.setEmployeeCode("EMP-" + String.format("%05d", savedUser.getId()));
        savedUser = userRepository.save(savedUser);

        String token = jwtService.generateToken(savedUser.getEmail());

        auditLogService.log(savedUser.getId(), "REGISTER", "User", savedUser.getId());

        return buildAuthResponse(token, savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalStateException("Account is deactivated. Contact your administrator.");
        }

        String token = jwtService.generateToken(user.getEmail());

        auditLogService.log(user.getId(), "LOGIN", "User", user.getId());

        return buildAuthResponse(token, user);
    }

    public User getCurrentUserEntity() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No authenticated user session found"));
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getPhone(),
                user.getDesignation(),
                user.getEmployeeCode(),
                user.getProfileImageUrl(),
                user.getFirstName(),
                user.getLastName()
        );
    }
}
