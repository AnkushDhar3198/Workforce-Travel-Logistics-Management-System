package com.cbg.travel.service;

import com.cbg.travel.entity.Approval;
import com.cbg.travel.entity.Booking;
import com.cbg.travel.entity.Expense;
import com.cbg.travel.entity.Shipment;
import com.cbg.travel.entity.TravelRequest;
import com.cbg.travel.entity.User;
import com.cbg.travel.repository.*;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdfGenerationService {

    private final TravelRequestRepository travelRequestRepository;
    private final BookingRepository bookingRepository;
    private final ShipmentRepository shipmentRepository;
    private final ExpenseRepository expenseRepository;
    private final ApprovalRepository approvalRepository;
    private final UserRepository userRepository;

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(15, 23, 42));
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(15, 23, 42));
    private static final Font BODY_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(51, 65, 85));
    private static final Font SMALL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(100, 116, 139));
    private static final Font LABEL_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(71, 85, 105));
    private static final Font VALUE_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(15, 23, 42));
    private static final Font TABLE_HEADER_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
    private static final Color PRIMARY_COLOR = new Color(14, 116, 144);
    private static final Color HEADER_BG = new Color(15, 23, 42);
    private static final Color ALT_ROW = new Color(241, 245, 249);

    public byte[] generateItineraryPdf(Long travelRequestId) {
        TravelRequest request = travelRequestRepository.findById(travelRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found"));
        User employee = userRepository.findById(request.getEmployeeId()).orElse(null);
        List<Booking> bookings = bookingRepository.findByTravelRequestId(travelRequestId);
        List<Shipment> shipments = shipmentRepository.findByLinkedTravelRequestIdIn(List.of(travelRequestId));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);

        try {
            PdfWriter.getInstance(doc, baos);
            doc.open();

            addCompanyHeader(doc, "TRAVEL ITINERARY");
            doc.add(new Paragraph(" "));

            // Trip Summary
            addSectionHeader(doc, "TRIP SUMMARY");
            PdfPTable summary = new PdfPTable(2);
            summary.setWidthPercentage(100);
            summary.setWidths(new float[]{1, 2});
            addDetailRow(summary, "Traveler", employee != null ? employee.getName() : "N/A");
            addDetailRow(summary, "Employee Code", employee != null && employee.getEmployeeCode() != null ? employee.getEmployeeCode() : "N/A");
            addDetailRow(summary, "Department", employee != null ? employee.getDepartment() : "N/A");
            addDetailRow(summary, "Destination", request.getDestination());
            addDetailRow(summary, "Travel Dates", request.getStartDate() + " to " + request.getEndDate());
            addDetailRow(summary, "Purpose", request.getPurpose());
            addDetailRow(summary, "Estimated Cost", "$" + String.format("%.2f", request.getEstimatedCost()));
            addDetailRow(summary, "Status", request.getStatus().name());
            doc.add(summary);
            doc.add(new Paragraph(" "));

            // Bookings
            if (!bookings.isEmpty()) {
                addSectionHeader(doc, "BOOKINGS & RESERVATIONS");
                PdfPTable bookingTable = new PdfPTable(4);
                bookingTable.setWidthPercentage(100);
                bookingTable.setWidths(new float[]{1.5f, 2, 3, 1.5f});
                addTableHeader(bookingTable, "Type", "Vendor", "Details", "Cost");
                boolean alt = false;
                for (Booking b : bookings) {
                    Color bg = alt ? ALT_ROW : Color.WHITE;
                    addTableCell(bookingTable, b.getType(), bg);
                    addTableCell(bookingTable, b.getVendor(), bg);
                    addTableCell(bookingTable, b.getDetails().length() > 60 ? b.getDetails().substring(0, 60) + "..." : b.getDetails(), bg);
                    addTableCell(bookingTable, "$" + String.format("%.2f", b.getCost()), bg);
                    alt = !alt;
                }
                doc.add(bookingTable);
                doc.add(new Paragraph(" "));
            }

            // Linked Shipments
            if (!shipments.isEmpty()) {
                addSectionHeader(doc, "LINKED CARGO SHIPMENTS");
                PdfPTable shipTable = new PdfPTable(4);
                shipTable.setWidthPercentage(100);
                shipTable.setWidths(new float[]{2.5f, 1.5f, 1.5f, 1.5f});
                addTableHeader(shipTable, "Description", "Carrier", "Status", "Expected Delivery");
                boolean alt = false;
                for (Shipment s : shipments) {
                    Color bg = alt ? ALT_ROW : Color.WHITE;
                    addTableCell(shipTable, s.getDescription(), bg);
                    addTableCell(shipTable, s.getCarrier(), bg);
                    addTableCell(shipTable, s.getStatus(), bg);
                    addTableCell(shipTable, s.getExpectedDelivery() != null ? s.getExpectedDelivery().toString() : "TBD", bg);
                    alt = !alt;
                }
                doc.add(shipTable);
                doc.add(new Paragraph(" "));
            }

            // Policy Compliance
            addSectionHeader(doc, "POLICY COMPLIANCE");
            if (request.getPolicyFlags() == null || request.getPolicyFlags().isBlank()) {
                doc.add(new Paragraph("✓ All policy checks passed. No violations detected.", BODY_FONT));
            } else {
                for (String flag : request.getPolicyFlagsList()) {
                    Paragraph p = new Paragraph("⚠ " + flag.trim(), new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(220, 38, 38)));
                    doc.add(p);
                }
            }

            addFooter(doc);
            doc.close();
        } catch (DocumentException e) {
            throw new RuntimeException("PDF generation failed", e);
        }
        return baos.toByteArray();
    }

    public byte[] generateExpenseReportPdf(Long travelRequestId) {
        TravelRequest request = travelRequestRepository.findById(travelRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found"));
        User employee = userRepository.findById(request.getEmployeeId()).orElse(null);
        List<Expense> expenses = expenseRepository.findByTravelRequestId(travelRequestId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);

        try {
            PdfWriter.getInstance(doc, baos);
            doc.open();

            addCompanyHeader(doc, "EXPENSE REPORT");
            doc.add(new Paragraph(" "));

            addSectionHeader(doc, "REPORT DETAILS");
            PdfPTable details = new PdfPTable(2);
            details.setWidthPercentage(100);
            details.setWidths(new float[]{1, 2});
            addDetailRow(details, "Employee", employee != null ? employee.getName() : "N/A");
            addDetailRow(details, "Employee Code", employee != null && employee.getEmployeeCode() != null ? employee.getEmployeeCode() : "N/A");
            addDetailRow(details, "Trip Destination", request.getDestination());
            addDetailRow(details, "Travel Period", request.getStartDate() + " to " + request.getEndDate());
            addDetailRow(details, "Report Generated", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
            doc.add(details);
            doc.add(new Paragraph(" "));

            // Expense Items
            addSectionHeader(doc, "EXPENSE ITEMS");
            if (expenses.isEmpty()) {
                doc.add(new Paragraph("No expenses submitted for this travel request.", BODY_FONT));
            } else {
                PdfPTable expTable = new PdfPTable(5);
                expTable.setWidthPercentage(100);
                expTable.setWidths(new float[]{1.5f, 1.5f, 1.5f, 1.5f, 2});
                addTableHeader(expTable, "Category", "Amount", "Status", "Date", "Receipt");
                double total = 0;
                boolean alt = false;
                for (Expense exp : expenses) {
                    Color bg = alt ? ALT_ROW : Color.WHITE;
                    addTableCell(expTable, exp.getCategory(), bg);
                    addTableCell(expTable, "$" + String.format("%.2f", exp.getAmount()), bg);
                    addTableCell(expTable, exp.getStatus(), bg);
                    addTableCell(expTable, exp.getSubmittedAt() != null ? exp.getSubmittedAt().toLocalDate().toString() : "N/A", bg);
                    addTableCell(expTable, exp.getReceiptUrl() != null ? "Attached" : "Missing", bg);
                    total += exp.getAmount();
                    alt = !alt;
                }
                doc.add(expTable);
                doc.add(new Paragraph(" "));
                doc.add(new Paragraph("TOTAL CLAIMED: $" + String.format("%.2f", total), TITLE_FONT));
            }

            addFooter(doc);
            doc.close();
        } catch (DocumentException e) {
            throw new RuntimeException("PDF generation failed", e);
        }
        return baos.toByteArray();
    }

    public byte[] generateAuthorizationPdf(Long travelRequestId) {
        TravelRequest request = travelRequestRepository.findById(travelRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found"));
        User employee = userRepository.findById(request.getEmployeeId()).orElse(null);
        List<Approval> approvals = approvalRepository.findByTravelRequestId(travelRequestId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);

        try {
            PdfWriter.getInstance(doc, baos);
            doc.open();

            addCompanyHeader(doc, "TRAVEL AUTHORIZATION");
            doc.add(new Paragraph(" "));

            addSectionHeader(doc, "AUTHORIZATION DETAILS");
            PdfPTable details = new PdfPTable(2);
            details.setWidthPercentage(100);
            details.setWidths(new float[]{1, 2});
            addDetailRow(details, "Authorization #", "AUTH-" + String.format("%05d", travelRequestId));
            addDetailRow(details, "Employee", employee != null ? employee.getName() : "N/A");
            addDetailRow(details, "Destination", request.getDestination());
            addDetailRow(details, "Travel Period", request.getStartDate() + " to " + request.getEndDate());
            addDetailRow(details, "Purpose", request.getPurpose());
            addDetailRow(details, "Budget Approved", "$" + String.format("%.2f", request.getEstimatedCost()));
            addDetailRow(details, "Current Status", request.getStatus().name());
            doc.add(details);
            doc.add(new Paragraph(" "));

            // Approval Chain
            addSectionHeader(doc, "APPROVAL CHAIN");
            if (approvals.isEmpty()) {
                doc.add(new Paragraph("No approvals recorded yet.", BODY_FONT));
            } else {
                PdfPTable appTable = new PdfPTable(4);
                appTable.setWidthPercentage(100);
                addTableHeader(appTable, "Level", "Approver", "Decision", "Date");
                boolean alt = false;
                for (Approval a : approvals) {
                    Color bg = alt ? ALT_ROW : Color.WHITE;
                    addTableCell(appTable, "Level " + a.getLevel(), bg);
                    User approver = userRepository.findById(a.getApproverId()).orElse(null);
                    addTableCell(appTable, approver != null ? approver.getName() : "ID: " + a.getApproverId(), bg);
                    addTableCell(appTable, a.getDecision(), bg);
                    addTableCell(appTable, a.getDecidedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), bg);
                    alt = !alt;
                }
                doc.add(appTable);
            }

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("Digital Verification: VOYACORE-AUTH-" + travelRequestId + "-" + LocalDate.now(), SMALL_FONT));

            addFooter(doc);
            doc.close();
        } catch (DocumentException e) {
            throw new RuntimeException("PDF generation failed", e);
        }
        return baos.toByteArray();
    }

    public byte[] generateShipmentManifestPdf(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);

        try {
            PdfWriter.getInstance(doc, baos);
            doc.open();

            addCompanyHeader(doc, "SHIPMENT MANIFEST");
            doc.add(new Paragraph(" "));

            addSectionHeader(doc, "CARGO DETAILS");
            PdfPTable details = new PdfPTable(2);
            details.setWidthPercentage(100);
            details.setWidths(new float[]{1, 2});
            addDetailRow(details, "Manifest #", "MFT-" + String.format("%05d", shipmentId));
            addDetailRow(details, "Description", shipment.getDescription());
            addDetailRow(details, "Cargo Type", shipment.getType());
            addDetailRow(details, "Origin", shipment.getOrigin());
            addDetailRow(details, "Destination", shipment.getDestination());
            addDetailRow(details, "Carrier", shipment.getCarrier());
            addDetailRow(details, "Status", shipment.getStatus());
            addDetailRow(details, "Expected Delivery", shipment.getExpectedDelivery() != null ? shipment.getExpectedDelivery().toString() : "TBD");
            addDetailRow(details, "Actual Delivery", shipment.getActualDelivery() != null ? shipment.getActualDelivery().toString() : "Pending");
            doc.add(details);
            doc.add(new Paragraph(" "));

            addSectionHeader(doc, "CUSTOMS DOCUMENTATION");
            doc.add(new Paragraph(shipment.getCustomsDocs() != null ? shipment.getCustomsDocs() : "No customs documents attached.", BODY_FONT));

            if (shipment.getLinkedTravelRequestId() != null) {
                doc.add(new Paragraph(" "));
                addSectionHeader(doc, "LINKED TRAVEL REQUEST");
                TravelRequest linked = travelRequestRepository.findById(shipment.getLinkedTravelRequestId()).orElse(null);
                if (linked != null) {
                    User traveler = userRepository.findById(linked.getEmployeeId()).orElse(null);
                    PdfPTable linkTable = new PdfPTable(2);
                    linkTable.setWidthPercentage(100);
                    linkTable.setWidths(new float[]{1, 2});
                    addDetailRow(linkTable, "Traveler", traveler != null ? traveler.getName() : "N/A");
                    addDetailRow(linkTable, "Trip Destination", linked.getDestination());
                    addDetailRow(linkTable, "Trip Dates", linked.getStartDate() + " to " + linked.getEndDate());
                    doc.add(linkTable);
                }
            }

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("Verification: VOYACORE-SHIP-" + shipmentId + "-MANIFEST-" + LocalDate.now(), SMALL_FONT));

            addFooter(doc);
            doc.close();
        } catch (DocumentException e) {
            throw new RuntimeException("PDF generation failed", e);
        }
        return baos.toByteArray();
    }

    // --- Helper Methods ---

    private void addCompanyHeader(Document doc, String title) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(HEADER_BG);
        cell.setPadding(16);
        cell.setBorder(0);

        Paragraph company = new Paragraph("VOYACORE ENTERPRISE", new Font(Font.HELVETICA, 14, Font.BOLD, Color.WHITE));
        company.setSpacingAfter(2);
        cell.addElement(company);

        Paragraph sub = new Paragraph("Workforce Travel & Logistics Management", new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(148, 163, 184)));
        cell.addElement(sub);

        Paragraph titleP = new Paragraph(title, new Font(Font.HELVETICA, 20, Font.BOLD, PRIMARY_COLOR));
        titleP.setSpacingBefore(8);
        cell.addElement(titleP);

        Paragraph date = new Paragraph("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm z")),
                new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(148, 163, 184)));
        date.setSpacingBefore(4);
        cell.addElement(date);

        headerTable.addCell(cell);
        doc.add(headerTable);
    }

    private void addSectionHeader(Document doc, String title) throws DocumentException {
        Paragraph section = new Paragraph(title, new Font(Font.HELVETICA, 11, Font.BOLD, PRIMARY_COLOR));
        section.setSpacingBefore(10);
        section.setSpacingAfter(6);
        doc.add(section);

        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell lineCell = new PdfPCell();
        lineCell.setFixedHeight(2);
        lineCell.setBackgroundColor(PRIMARY_COLOR);
        lineCell.setBorder(0);
        line.addCell(lineCell);
        doc.add(line);
    }

    private void addDetailRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, LABEL_FONT));
        labelCell.setBorder(0);
        labelCell.setPadding(5);
        labelCell.setBackgroundColor(ALT_ROW);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, VALUE_FONT));
        valueCell.setBorder(0);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, TABLE_HEADER_FONT));
            cell.setBackgroundColor(HEADER_BG);
            cell.setPadding(7);
            cell.setBorderWidth(0);
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, String value, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(value, BODY_FONT));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6);
        cell.setBorderWidth(0.5f);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }

    private void addFooter(Document doc) throws DocumentException {
        doc.add(new Paragraph(" "));
        PdfPTable footer = new PdfPTable(1);
        footer.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(ALT_ROW);
        cell.setPadding(10);
        cell.setBorder(0);
        cell.addElement(new Paragraph("CONFIDENTIAL — VoyaCore Enterprise Workforce Travel & Logistics Management System", SMALL_FONT));
        cell.addElement(new Paragraph("This document is auto-generated and digitally verified. © 2026 VoyaCore Enterprise Inc.", SMALL_FONT));
        footer.addCell(cell);
        doc.add(footer);
    }
}
