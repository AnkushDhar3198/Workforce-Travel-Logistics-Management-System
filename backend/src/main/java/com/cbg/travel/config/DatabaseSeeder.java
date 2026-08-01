package com.cbg.travel.config;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final TravelRequestRepository travelRequestRepository;
    private final BookingRepository bookingRepository;
    private final ShipmentRepository shipmentRepository;
    private final ExpenseRepository expenseRepository;
    private final DocumentRepository documentRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final NotificationRepository notificationRepository;
    private final ApprovalRepository approvalRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Always ensure sample upload files exist on disk (for ephemeral container restarts)
        ensureSampleFilesExist();

        if (userRepository.count() > 0) {
            System.out.println("Database already seeded. Skipping seeder.");
            return;
        }

        System.out.println("Seeding database with demo data...");

        // 1. Seed Users
        String encodedPassword = passwordEncoder.encode("password");

        User manager = User.builder()
                .name("Alice Manager")
                .email("manager@cbg.com")
                .passwordHash(encodedPassword)
                .role(UserRole.APPROVING_MANAGER)
                .department("Sales")
                .phone("+1-555-0123")
                .build();
        manager = userRepository.save(manager);

        User employee = User.builder()
                .name("Bob Employee")
                .email("employee@cbg.com")
                .passwordHash(encodedPassword)
                .role(UserRole.TRAVELING_EMPLOYEE)
                .department("Sales")
                .phone("+1-555-0124")
                .managerId(manager.getId())
                .build();
        employee = userRepository.save(employee);

        User travelManager = User.builder()
                .name("Charlie TravelManager")
                .email("travelmanager@cbg.com")
                .passwordHash(encodedPassword)
                .role(UserRole.CORPORATE_TRAVEL_MANAGER)
                .department("Administration")
                .phone("+1-555-0125")
                .build();
        userRepository.save(travelManager);

        User finance = User.builder()
                .name("Diana Finance")
                .email("finance@cbg.com")
                .passwordHash(encodedPassword)
                .role(UserRole.FINANCE_PROCUREMENT)
                .department("Finance")
                .phone("+1-555-0126")
                .build();
        userRepository.save(finance);

        User security = User.builder()
                .name("Ethan Security")
                .email("security@cbg.com")
                .passwordHash(encodedPassword)
                .role(UserRole.SECURITY_RISK_OFFICER)
                .department("Security Operations")
                .phone("+1-555-0127")
                .build();
        userRepository.save(security);

        User logistics = User.builder()
                .name("Frank Logistics")
                .email("logistics@cbg.com")
                .passwordHash(encodedPassword)
                .role(UserRole.LOGISTICS_COORDINATOR)
                .department("Logistics")
                .phone("+1-555-0128")
                .build();
        userRepository.save(logistics);

        User admin = User.builder()
                .name("Grace Admin")
                .email("admin@cbg.com")
                .passwordHash(encodedPassword)
                .role(UserRole.ADMIN)
                .department("IT Operations")
                .phone("+1-555-0129")
                .build();
        userRepository.save(admin);

        // 2. Seed Preferred Vendors
        Vendor delta = Vendor.builder().name("Delta Air Lines").type("AIRLINE").contractTerms("12% discount on international flights").performanceRating(4.7).isPreferred(true).build();
        Vendor emirates = Vendor.builder().name("Emirates").type("AIRLINE").contractTerms("15% discount on business class flights").performanceRating(4.9).isPreferred(true).build();
        Vendor marriott = Vendor.builder().name("Marriott Hotels").type("HOTEL").contractTerms("Negotiated corporate daily rates: $180").performanceRating(4.5).isPreferred(true).build();
        Vendor hilton = Vendor.builder().name("Hilton Hotels").type("HOTEL").contractTerms("Negotiated corporate daily rates: $170").performanceRating(4.4).isPreferred(true).build();
        Vendor enterprise = Vendor.builder().name("Enterprise Rent-A-Car").type("TRANSPORT").contractTerms("Standard flat rate $45/day").performanceRating(4.2).isPreferred(true).build();
        Vendor fedex = Vendor.builder().name("FedEx Logistics").type("LOGISTICS").contractTerms("Priority customs clearance").performanceRating(4.6).isPreferred(true).build();
        vendorRepository.saveAll(Arrays.asList(delta, emirates, marriott, hilton, enterprise, fedex));

        // 3. Seed Policy Rules
        PolicyRule rule1 = PolicyRule.builder().ruleType("HOTEL_BUDGET").conditionJson("{\"max_daily_budget\":300.0}").region("GLOBAL").build();
        PolicyRule rule2 = PolicyRule.builder().ruleType("BOOKING_LEAD_TIME").conditionJson("{\"min_days_advance\":14}").region("GLOBAL").build();
        PolicyRule rule3 = PolicyRule.builder().ruleType("FLIGHT_CLASS").conditionJson("{\"requires_justification_above\":2500.0}").region("GLOBAL").build();
        policyRuleRepository.saveAll(Arrays.asList(rule1, rule2, rule3));

        // 4. Seed Travel Requests
        // Request 1: Draft (violates lead time)
        TravelRequest tr1 = TravelRequest.builder()
                .employeeId(employee.getId())
                .destination("Singapore")
                .startDate(LocalDate.now().plusDays(5)) // lead time violation
                .endDate(LocalDate.now().plusDays(10))
                .purpose("Product Demo Launch")
                .estimatedCost(1200.0)
                .status(TravelRequestStatus.DRAFT)
                .policyFlags("LATE_BOOKING: Request submitted 5 days before travel (Policy requires 14 days lead time).")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
        tr1 = travelRequestRepository.save(tr1);

        // Request 2: Approved (within policy)
        TravelRequest tr2 = TravelRequest.builder()
                .employeeId(employee.getId())
                .destination("London")
                .startDate(LocalDate.now().plusDays(20))
                .endDate(LocalDate.now().plusDays(25))
                .purpose("Client Negotiations")
                .estimatedCost(3200.0)
                .status(TravelRequestStatus.APPROVED)
                .policyFlags("")
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();
        tr2 = travelRequestRepository.save(tr2);

        // Request 3: Pending Approval (violates budget per diem, high cost requires multi-level)
        TravelRequest tr3 = TravelRequest.builder()
                .employeeId(employee.getId())
                .destination("Munich")
                .startDate(LocalDate.now().plusDays(18))
                .endDate(LocalDate.now().plusDays(21)) // 3 days
                .purpose("Critical Tech Summit")
                .estimatedCost(5500.0) // high cost > $5000, per diem > $300
                .status(TravelRequestStatus.PENDING)
                .policyFlags("BUDGET_EXCEEDED: Estimated daily cost is $1833.33 which exceeds the regional per diem cap of $300.00.,FLIGHT_CLASS_VIOLATION: Premium flight class detected based on estimated cost ($5500.0).")
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
        tr3 = travelRequestRepository.save(tr3);

        // Request 4: Rejected
        TravelRequest tr4 = TravelRequest.builder()
                .employeeId(employee.getId())
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(15))
                .endDate(LocalDate.now().plusDays(20))
                .purpose("Team Building")
                .estimatedCost(3500.0)
                .status(TravelRequestStatus.REJECTED)
                .policyFlags("BUDGET_EXCEEDED: Estimated daily cost is $700.00 which exceeds the regional per diem cap of $300.00.")
                .createdAt(LocalDateTime.now().minusDays(4))
                .build();
        tr4 = travelRequestRepository.save(tr4);

        // 5. Seed Approvals
        Approval app1 = Approval.builder()
                .travelRequestId(tr4.getId())
                .approverId(manager.getId())
                .level(1)
                .decision("REJECTED")
                .comment("Team building does not warrant a $3500 budget. Please use local options.")
                .decidedAt(LocalDateTime.now().minusDays(3))
                .build();
        approvalRepository.save(app1);

        // 6. Seed Bookings (for London trip)
        Booking b1 = Booking.builder()
                .travelRequestId(tr2.getId())
                .type("FLIGHT")
                .vendor("Delta Air Lines")
                .cost(1200.0)
                .details("{\"flight_number\":\"DL-18\",\"seat\":\"14A\",\"class\":\"Economy Plus\",\"departure\":\"10:00 AM\"}")
                .bookedAt(LocalDateTime.now().minusDays(4))
                .build();
        Booking b2 = Booking.builder()
                .travelRequestId(tr2.getId())
                .type("HOTEL")
                .vendor("Marriott Hotels")
                .cost(1500.0)
                .details("{\"hotel_name\":\"Marriott London Regent's Park\",\"room_type\":\"Standard King\",\"nights\":5}")
                .bookedAt(LocalDateTime.now().minusDays(4))
                .build();
        bookingRepository.saveAll(Arrays.asList(b1, b2));

        // 7. Seed Shipments
        // Shipment 1: London (Synced - arrives before travel starts)
        Shipment s1 = Shipment.builder()
                .linkedTravelRequestId(tr2.getId())
                .description("CBG Gen-5 Mobile Prototypes & Materials")
                .type("PROTOTYPE")
                .origin("Chicago Hub")
                .destination("London Office")
                .carrier("FedEx Logistics")
                .customsDocs("Commercial Invoice, ATA Carnet #GB-33492")
                .status("IN_TRANSIT")
                .expectedDelivery(tr2.getStartDate().minusDays(1)) // arrives before trip starts -> synced!
                .build();
        
        // Shipment 2: Munich (At-Risk - arrives after travel starts)
        Shipment s2 = Shipment.builder()
                .linkedTravelRequestId(tr3.getId())
                .description("Exhibition Booth Banner Stand & Swag")
                .type("BOOTH")
                .origin("Chicago Hub")
                .destination("Munich Expo Center")
                .carrier("FedEx Logistics")
                .customsDocs("ATA Carnet #DE-88321")
                .status("PREPARING")
                .expectedDelivery(tr3.getStartDate().plusDays(2)) // arrives after trip starts -> AT RISK!
                .build();
        
        // Shipment 3: Unlinked Shipment (delivered)
        Shipment s3 = Shipment.builder()
                .description("APAC Retail Exhibition Flyers")
                .type("MARKETING")
                .origin("Singapore Hub")
                .destination("Tokyo Office")
                .carrier("DHL Express")
                .customsDocs("Customs Declaration C-89")
                .status("DELIVERED")
                .expectedDelivery(LocalDate.now().minusDays(3))
                .actualDelivery(LocalDate.now().minusDays(3))
                .build();

        shipmentRepository.saveAll(Arrays.asList(s1, s2, s3));

        // 8. Seed Expenses
        // Expense 1: Submitting legitimate hotel claim
        Expense exp1 = Expense.builder()
                .travelRequestId(tr2.getId())
                .employeeId(employee.getId())
                .category("HOTEL")
                .amount(1500.0)
                .receiptUrl("/uploads/london_hotel_receipt.png")
                .ocrExtractedData("{\"vendor\":\"Marriott Hotels\",\"amount\":1500.0,\"date\":\"2026-07-28\",\"category\":\"HOTEL\",\"confidence\":0.99}")
                .status("SUBMITTED")
                .submittedAt(LocalDateTime.now().minusDays(1))
                .build();

        // Expense 2: Fraud Risk Claim ( claimed amount deviates from OCR )
        Expense exp2 = Expense.builder()
                .travelRequestId(tr2.getId())
                .employeeId(employee.getId())
                .category("MEAL")
                .amount(250.0) // claim amount
                .receiptUrl("/uploads/dinner_receipt.png")
                .ocrExtractedData("{\"vendor\":\"Gourmet Bistro & Grill\",\"amount\":80.0,\"date\":\"2026-07-26\",\"category\":\"MEAL\",\"confidence\":0.98}") // OCR amount is $80
                .status("SUBMITTED")
                .submittedAt(LocalDateTime.now().minusDays(1))
                .build();

        // Expense 3: Reimbursed
        Expense exp3 = Expense.builder()
                .travelRequestId(tr4.getId())
                .employeeId(employee.getId())
                .category("TRANSPORT")
                .amount(65.0)
                .receiptUrl("/uploads/uber_receipt.png")
                .ocrExtractedData("{\"vendor\":\"Uber Technologies Inc.\",\"amount\":65.0,\"date\":\"2026-07-25\",\"category\":\"TRANSPORT\",\"confidence\":0.97}")
                .status("REIMBURSED")
                .submittedAt(LocalDateTime.now().minusDays(4))
                .build();

        expenseRepository.saveAll(Arrays.asList(exp1, exp2, exp3));

        // 9. Seed Documents
        Document doc1 = Document.builder()
                .userId(employee.getId())
                .type("PASSPORT")
                .fileUrl("/uploads/passport_bob.pdf")
                .expiryDate(LocalDate.now().plusDays(10)) // expiring soon warning!
                .docNumber("P-984201948")
                .issuingAuthority("United States")
                .detailsJson("{\"passportNo\":\"P-984201948\",\"issuingCountry\":\"United States\",\"clearanceLevel\":\"Level-3 Authorized\"}")
                .build();
        Document doc2 = Document.builder()
                .userId(employee.getId())
                .type("VISA")
                .fileUrl("/uploads/visa_uk_bob.pdf")
                .expiryDate(LocalDate.now().plusDays(400))
                .docNumber("GBR-VISA-883912")
                .issuingAuthority("United Kingdom")
                .detailsJson("{\"visaNumber\":\"GBR-VISA-883912\",\"destinationCountry\":\"United Kingdom\",\"entryType\":\"Multiple Entry\"}")
                .build();
        documentRepository.saveAll(Arrays.asList(doc1, doc2));

        // 10. Seed Emergency Alerts
        EmergencyAlert ea1 = EmergencyAlert.builder()
                .employeeId(employee.getId())
                .location("London Office")
                .status("RESOLVED")
                .triggeredAt(LocalDateTime.now().minusDays(4))
                .resolvedAt(LocalDateTime.now().minusDays(4).plusHours(2))
                .notes("Employee reported minor train disruption, safely arrived via taxi.")
                .build();

        EmergencyAlert ea2 = EmergencyAlert.builder()
                .employeeId(employee.getId())
                .location("Manila Central Plaza")
                .status("ACTIVE")
                .triggeredAt(LocalDateTime.now().minusMinutes(45))
                .notes("Typhoon warning active. Employee requested safety routing assistance.")
                .build();
        emergencyAlertRepository.saveAll(Arrays.asList(ea1, ea2));

        // 11. Seed Notifications
        Notification n1 = Notification.builder()
                .userId(employee.getId())
                .type("APPROVAL")
                .message("Your travel request to London has been approved.")
                .readStatus(false)
                .createdAt(LocalDateTime.now().minusDays(3))
                .build();
        Notification n2 = Notification.builder()
                .userId(employee.getId())
                .type("SHIPMENT")
                .message("Your linked shipment 'CBG Gen-5 Mobile Prototypes & Materials' status changed to IN_TRANSIT.")
                .readStatus(false)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
        notificationRepository.saveAll(Arrays.asList(n1, n2));

        // Ensure upload files exist physically
        ensureSampleFilesExist();

        System.out.println("Database seeding completed successfully!");
    }

    private void ensureSampleFilesExist() {
        try {
            java.nio.file.Path uploadDirPath = java.nio.file.Paths.get("uploads");
            if (!java.nio.file.Files.exists(uploadDirPath)) {
                java.nio.file.Files.createDirectories(uploadDirPath);
            }
            createDummyFileIfMissing(uploadDirPath, "bob_docs.pdf", com.cbg.travel.controller.FileServeController.generateRichPdfBytes("bob_docs.pdf"));
            createDummyFileIfMissing(uploadDirPath, "passport_bob.pdf", com.cbg.travel.controller.FileServeController.generateRichPdfBytes("passport_bob.pdf"));
            createDummyFileIfMissing(uploadDirPath, "visa_uk_bob.pdf", com.cbg.travel.controller.FileServeController.generateRichPdfBytes("visa_uk_bob.pdf"));
            createDummyFileIfMissing(uploadDirPath, "london_hotel_receipt.png", com.cbg.travel.controller.FileServeController.generateRichReceiptImageBytes("london_hotel_receipt.png"));
            createDummyFileIfMissing(uploadDirPath, "dinner_receipt.png", com.cbg.travel.controller.FileServeController.generateRichReceiptImageBytes("dinner_receipt.png"));
            createDummyFileIfMissing(uploadDirPath, "uber_receipt.png", com.cbg.travel.controller.FileServeController.generateRichReceiptImageBytes("uber_receipt.png"));
        } catch (Exception e) {
            System.err.println("Could not ensure upload sample files: " + e.getMessage());
        }
    }

    private void createDummyFileIfMissing(java.nio.file.Path uploadDir, String filename, byte[] content) {
        java.nio.file.Path filePath = uploadDir.resolve(filename);
        try {
            java.nio.file.Files.write(filePath, content);
        } catch (Exception ignored) {}
    }
}
