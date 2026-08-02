package com.cbg.travel.config;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final VendorRepository vendorRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        migrateUserTableSchema();
        ensureUploadDirectoryExists();
        seedVendors();
        seedPolicyRules();
        System.out.println("System configuration seeding completed.");
    }

    private void migrateUserTableSchema() {
        try {
            System.out.println("Executing automatic schema migration for users table...");
            String[] alterQueries = {
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
                "ALTER TABLE users ALTER COLUMN name DROP NOT NULL",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_number VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_expiry DATE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id BIGINT",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date DATE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            };

            for (String query : alterQueries) {
                try {
                    jdbcTemplate.execute(query);
                } catch (Exception ex) {
                    System.out.println("Schema migration query note: " + ex.getMessage());
                }
            }
            System.out.println("Users table schema migration completed successfully.");
        } catch (Exception e) {
            System.err.println("Users table schema migration warning: " + e.getMessage());
        }
    }

    private void seedVendors() {
        if (vendorRepository.count() > 0) return;
        System.out.println("Seeding preferred vendors catalog...");

        Vendor delta = Vendor.builder().name("Delta Air Lines").type("AIRLINE").contractTerms("12% discount on international flights").performanceRating(4.7).isPreferred(true).build();
        Vendor emirates = Vendor.builder().name("Emirates").type("AIRLINE").contractTerms("15% discount on business class flights").performanceRating(4.9).isPreferred(true).build();
        Vendor marriott = Vendor.builder().name("Marriott Hotels").type("HOTEL").contractTerms("Negotiated corporate daily rates: $180").performanceRating(4.5).isPreferred(true).build();
        Vendor hilton = Vendor.builder().name("Hilton Hotels").type("HOTEL").contractTerms("Negotiated corporate daily rates: $170").performanceRating(4.4).isPreferred(true).build();
        Vendor enterprise = Vendor.builder().name("Enterprise Rent-A-Car").type("TRANSPORT").contractTerms("Standard flat rate $45/day").performanceRating(4.2).isPreferred(true).build();
        Vendor fedex = Vendor.builder().name("FedEx Logistics").type("LOGISTICS").contractTerms("Priority customs clearance").performanceRating(4.6).isPreferred(true).build();
        Vendor dhl = Vendor.builder().name("DHL Express").type("LOGISTICS").contractTerms("Same-day international express").performanceRating(4.3).isPreferred(true).build();
        Vendor lufthansa = Vendor.builder().name("Lufthansa").type("AIRLINE").contractTerms("10% discount on European routes").performanceRating(4.6).isPreferred(true).build();

        vendorRepository.saveAll(Arrays.asList(delta, emirates, marriott, hilton, enterprise, fedex, dhl, lufthansa));
        System.out.println("Vendors seeded: " + vendorRepository.count());
    }

    private void seedPolicyRules() {
        if (policyRuleRepository.count() > 0) return;
        System.out.println("Seeding corporate policy rules...");

        PolicyRule rule1 = PolicyRule.builder().ruleType("HOTEL_BUDGET").conditionJson("{\"max_daily_budget\":300.0}").region("GLOBAL").build();
        PolicyRule rule2 = PolicyRule.builder().ruleType("BOOKING_LEAD_TIME").conditionJson("{\"min_days_advance\":14}").region("GLOBAL").build();
        PolicyRule rule3 = PolicyRule.builder().ruleType("FLIGHT_CLASS").conditionJson("{\"requires_justification_above\":2500.0}").region("GLOBAL").build();
        PolicyRule rule4 = PolicyRule.builder().ruleType("MEAL_PER_DIEM").conditionJson("{\"max_daily_meal\":75.0}").region("GLOBAL").build();
        PolicyRule rule5 = PolicyRule.builder().ruleType("TRANSPORT_PER_DIEM").conditionJson("{\"max_daily_transport\":100.0}").region("GLOBAL").build();

        policyRuleRepository.saveAll(Arrays.asList(rule1, rule2, rule3, rule4, rule5));
        System.out.println("Policy rules seeded: " + policyRuleRepository.count());
    }

    private void ensureUploadDirectoryExists() {
        try {
            java.nio.file.Path uploadDirPath = java.nio.file.Paths.get("uploads");
            if (!java.nio.file.Files.exists(uploadDirPath)) {
                java.nio.file.Files.createDirectories(uploadDirPath);
            }
        } catch (Exception e) {
            System.err.println("Could not create uploads directory: " + e.getMessage());
        }
    }
}
