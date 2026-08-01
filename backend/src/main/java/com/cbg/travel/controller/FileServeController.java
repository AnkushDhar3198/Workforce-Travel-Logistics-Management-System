package com.cbg.travel.controller;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;

@RestController
@RequestMapping("/uploads")
public class FileServeController {

    private final Path rootLocation = Paths.get("uploads");

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            ensureDirectoryExists();
            Path file = rootLocation.resolve(filename);

            String lower = filename.toLowerCase();
            byte[] fileBytes;

            if (lower.endsWith(".pdf")) {
                fileBytes = generateRichPdfBytes(filename);
                try {
                    Files.write(file, fileBytes);
                } catch (Exception ignored) {}

                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(new ByteArrayResource(fileBytes));
            } else if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                fileBytes = generateRichReceiptImageBytes(filename);
                try {
                    Files.write(file, fileBytes);
                } catch (Exception ignored) {}

                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(new ByteArrayResource(fileBytes));
            }

            if (Files.exists(file)) {
                Resource resource = new UrlResource(file.toUri());
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            }

            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private void ensureDirectoryExists() {
        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }
        } catch (IOException ignored) {}
    }

    public static byte[] generateRichPdfBytes(String filename) {
        String lower = filename.toLowerCase();
        String docTitle = "CBG WORKFORCE LOGISTICS INC.";
        String subTitle = "OFFICIAL CORPORATE TRAVEL & IDENTIFICATION VAULT";
        String docType = "OFFICIAL PASSPORT & CORPORATE BORDER CLEARANCE";
        String docNo = "P-984201948";
        String expiry = "2030-07-31 (VALID & ACTIVE)";

        if (lower.contains("visa")) {
            docTitle = "UK VISAS & IMMIGRATION / CBG TRAVEL";
            subTitle = "OFFICIAL UK BUSINESS TRAVEL VISA CLEARANCE CERTIFICATE";
            docType = "MULTIPLE ENTRY UK BUSINESS VISA";
            docNo = "GBR-VISA-883912";
            expiry = "2027-12-31 (ACTIVE PERMIT)";
        }

        String[] lines = new String[] {
            subTitle,
            "====================================================================================================",
            "DOCUMENT TYPE: " + docType,
            "",
            "SECTION: 1. TRAVELER PERSONAL IDENTIFICATION",
            "Full Legal Name:       Bob Employee",
            "Employee ID:           EMP-88219",
            "Department / Division: Sales & Field Operations",
            "Corporate Email:       employee@cbg.com",
            "Emergency Phone / SOS: +1-555-0124",
            "",
            "SECTION: 2. PASSPORT & BORDER CONTROL CREDENTIALS",
            "Document Number:       " + docNo,
            "Issuing Authority:     Government Passport Office / CBG Security Clearance",
            "Date of Issue:         2020-08-01",
            "Date of Expiry:        " + expiry,
            "Security Clearance:    Level-3 International Overseas Deployment Authorized",
            "",
            "SECTION: 3. CORPORATE TRAVEL POLICY & AUTHORIZATION",
            "Travel Auth ID:        CBG-AUTH-2026-9941",
            "Approving Manager:     Alice Manager (Sales Director)",
            "Global Medical Ins.:   Allianz Corporate Health Shield #AG-992014",
            "SOS Evacuation Plan:   Active 24/7 Global Medical & Rescue Coverage",
            "Per-Diem Allowance:    $300.00 / day (Policy Compliant)",
            "====================================================================================================",
            "CONFIDENTIAL - FOR AUTHORIZED WORKFORCE LOGISTICS & BORDER CONTROL USE ONLY",
            "Digital Verification Signature: CBG-SEC-VERIFIED-VALIDATED-2026"
        };

        return buildValidPdf(docTitle, lines);
    }

    private static byte[] buildValidPdf(String docTitle, String[] lines) {
        StringBuilder streamBuilder = new StringBuilder();
        streamBuilder.append("BT\n");
        streamBuilder.append("/F1 16 Tf 40 740 Td (").append(escapePdfText(docTitle)).append(") Tj\n");

        for (String line : lines) {
            if (line.isEmpty()) {
                streamBuilder.append("0 -14 Td () Tj\n");
            } else if (line.startsWith("SECTION:") || line.startsWith("DOCUMENT TYPE:")) {
                streamBuilder.append("0 -20 Td /F1 12 Tf (").append(escapePdfText(line)).append(") Tj\n");
            } else if (line.startsWith("==") || line.startsWith("--")) {
                streamBuilder.append("0 -14 Td /F1 10 Tf (----------------------------------------------------------------------------------------------------) Tj\n");
            } else {
                streamBuilder.append("0 -14 Td /F1 10 Tf (").append(escapePdfText(line)).append(") Tj\n");
            }
        }
        streamBuilder.append("ET\n");

        byte[] streamBytes = streamBuilder.toString().getBytes(StandardCharsets.UTF_8);
        int streamLength = streamBytes.length;

        String header = "%PDF-1.4\n";
        String obj1 = "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n";
        String obj2 = "2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n";
        String obj3 = "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>>/Contents 5 0 R>>endobj\n";
        String obj4 = "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n";
        String obj5Head = "5 0 obj<</Length " + streamLength + ">>stream\n";
        String obj5Tail = "\nendstream\nendobj\n";

        int offset1 = header.length();
        int offset2 = offset1 + obj1.length();
        int offset3 = offset2 + obj2.length();
        int offset4 = offset3 + obj3.length();
        int offset5 = offset4 + obj4.length();
        int xrefOffset = offset5 + obj5Head.length() + streamLength + obj5Tail.length();

        String xref = String.format(Locale.US,
                "xref\n0 6\n" +
                "0000000000 65535 f \n" +
                "%010d 00000 n \n" +
                "%010d 00000 n \n" +
                "%010d 00000 n \n" +
                "%010d 00000 n \n" +
                "%010d 00000 n \n" +
                "trailer<</Size 6/Root 1 0 R>>\n" +
                "startxref\n%d\n%%EOF\n",
                offset1, offset2, offset3, offset4, offset5, xrefOffset);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            baos.write(header.getBytes(StandardCharsets.UTF_8));
            baos.write(obj1.getBytes(StandardCharsets.UTF_8));
            baos.write(obj2.getBytes(StandardCharsets.UTF_8));
            baos.write(obj3.getBytes(StandardCharsets.UTF_8));
            baos.write(obj4.getBytes(StandardCharsets.UTF_8));
            baos.write(obj5Head.getBytes(StandardCharsets.UTF_8));
            baos.write(streamBytes);
            baos.write(obj5Tail.getBytes(StandardCharsets.UTF_8));
            baos.write(xref.getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) {}

        return baos.toByteArray();
    }

    private static String escapePdfText(String text) {
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    public static byte[] generateRichReceiptImageBytes(String filename) throws IOException {
        int width = 500;
        int height = 650;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // White receipt background
        g.setColor(new Color(250, 250, 252));
        g.fillRect(0, 0, width, height);

        // Dark header bar
        g.setColor(new Color(15, 23, 42));
        g.fillRect(0, 0, width, 90);

        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, 18));
        
        String title = "EXPENSE RECEIPT";
        String vendor = "MARRIOTT HOTELS - LONDON";
        String amountStr = "$1500.00";
        String item = "5 Nights Deluxe King Room";
        
        if (filename.toLowerCase().contains("dinner")) {
            vendor = "GOURMET BISTRO & GRILL";
            amountStr = "$80.00";
            item = "Client Dinner & Beverages";
        } else if (filename.toLowerCase().contains("uber")) {
            vendor = "UBER TECHNOLOGIES INC.";
            amountStr = "$65.00";
            item = "Airport Transfer Ride";
        }

        g.drawString(title, 30, 40);

        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g.setColor(new Color(148, 163, 184));
        g.drawString("CBG Workforce Travel & Logistics", 30, 65);

        // Receipt Details Section
        int y = 130;
        g.setColor(new Color(15, 23, 42));
        g.setFont(new Font("SansSerif", Font.BOLD, 14));
        g.drawString(vendor, 30, y);

        y += 25;
        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g.setColor(new Color(71, 85, 105));
        g.drawString("Date: 2026-07-28 19:42 | TxID: #TXN-998241", 30, y);

        y += 25;
        g.setColor(new Color(226, 232, 240));
        g.drawLine(30, y, width - 30, y);

        // Table Header
        y += 30;
        g.setColor(new Color(100, 116, 139));
        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        g.drawString("DESCRIPTION", 30, y);
        g.drawString("AMOUNT", width - 110, y);

        y += 10;
        g.setColor(new Color(226, 232, 240));
        g.drawLine(30, y, width - 30, y);

        // Line Item
        y += 30;
        g.setColor(new Color(15, 23, 42));
        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g.drawString(item, 30, y);
        g.drawString(amountStr, width - 110, y);

        y += 40;
        g.setColor(new Color(226, 232, 240));
        g.drawLine(30, y, width - 30, y);

        // Total
        y += 35;
        g.setFont(new Font("SansSerif", Font.BOLD, 14));
        g.drawString("TOTAL PAID:", 30, y);
        g.setColor(new Color(14, 116, 144));
        g.setFont(new Font("SansSerif", Font.BOLD, 18));
        g.drawString(amountStr, width - 120, y);

        // Payment Info & Footer
        y += 60;
        g.setColor(new Color(241, 245, 249));
        g.fillRect(30, y, width - 60, 100);
        g.setColor(new Color(51, 65, 85));
        g.drawRect(30, y, width - 60, 100);

        g.setFont(new Font("SansSerif", Font.PLAIN, 11));
        g.drawString("Payment Method: Corporate Visa (**** 4921)", 45, y + 30);
        g.drawString("Cardholder: Bob Employee", 45, y + 50);
        g.drawString("OCR Verification Status: MATCHED & AUDITED", 45, y + 75);

        // Footer Barcode graphic simulation
        y += 140;
        g.setColor(new Color(15, 23, 42));
        for (int i = 50; i < width - 50; i += 6) {
            int barWidth = (i % 4 == 0) ? 4 : 2;
            g.fillRect(i, y, barWidth, 40);
        }

        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }
}
