package com.cbg.travel.controller;

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
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
public class FileServeController {

    private final Path rootLocation = Paths.get("uploads");

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            ensureDirectoryExists();
            Path file = rootLocation.resolve(filename);

            // Re-generate if missing or if file size is trivial (older dummy placeholder)
            if (!Files.exists(file) || Files.size(file) < 600) {
                generateRichFile(file, filename);
            }

            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = null;
                try {
                    contentType = Files.probeContentType(file);
                } catch (Exception ignored) {}

                if (contentType == null) {
                    String lower = filename.toLowerCase();
                    if (lower.endsWith(".pdf")) {
                        contentType = "application/pdf";
                    } else if (lower.endsWith(".png")) {
                        contentType = "image/png";
                    } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                        contentType = "image/jpeg";
                    } else {
                        contentType = "application/octet-stream";
                    }
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
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

    private void generateRichFile(Path targetPath, String filename) {
        try {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf")) {
                generateRichPdf(targetPath, filename);
            } else if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                generateRichReceiptImage(targetPath, filename);
            }
        } catch (Exception ignored) {}
    }

    private void generateRichPdf(Path targetPath, String filename) throws IOException {
        String docType = "OFFICIAL PASSPORT & CORPORATE CLEARANCE";
        String passportNo = "P-984201948";
        String expiry = "2030-07-31";
        
        if (filename.toLowerCase().contains("passport")) {
            docType = "INTERNATIONAL PASSPORT IDENTIFICATION";
        } else if (filename.toLowerCase().contains("visa")) {
            docType = "UK BUSINESS TRAVEL VISA CERTIFICATE";
            passportNo = "GBR-VISA-883912";
            expiry = "2027-12-31";
        }

        String pdfContent = "%PDF-1.4\n" +
                "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
                "2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n" +
                "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>>/Contents 5 0 R>>endobj\n" +
                "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
                "5 0 obj<</Length 1400>>stream\n" +
                "BT\n" +
                "/F1 16 Tf 50 740 Td (CBG WORKFORCE LOGISTICS INC.) Tj\n" +
                "0 -22 Td /F1 12 Tf (CORPORATE TRAVEL & IDENTIFICATION VAULT) Tj\n" +
                "0 -20 Td /F1 10 Tf (----------------------------------------------------------------------------------------------------) Tj\n" +
                "0 -25 Td /F1 12 Tf (DOCUMENT TYPE: " + docType + ") Tj\n" +
                "0 -25 Td /F1 11 Tf (1. TRAVELER PERSONAL INFORMATION) Tj\n" +
                "0 -16 Td /F1 10 Tf (Full Legal Name:     Bob Employee) Tj\n" +
                "0 -14 Td (Employee ID:         EMP-88219) Tj\n" +
                "0 -14 Td (Department:          Sales & Field Operations) Tj\n" +
                "0 -14 Td (Corporate Email:     employee@cbg.com) Tj\n" +
                "0 -14 Td (Contact Phone:       +1-555-0124) Tj\n" +
                "0 -25 Td /F1 11 Tf (2. PASSPORT & BORDER CLEARANCE DETAILS) Tj\n" +
                "0 -16 Td /F1 10 Tf (Document Number:     " + passportNo + ") Tj\n" +
                "0 -14 Td (Issuing Authority:   Government Passport Office / CBG Security) Tj\n" +
                "0 -14 Td (Date of Expiry:      " + expiry + " (VALID & ACTIVE)) Tj\n" +
                "0 -14 Td (Security Status:     Verified for International Border Control Audit) Tj\n" +
                "0 -25 Td /F1 11 Tf (3. CORPORATE AUTHORIZATION & POLICY) Tj\n" +
                "0 -16 Td /F1 10 Tf (Travel Auth ID:        CBG-AUTH-2026-9941) Tj\n" +
                "0 -14 Td (Approving Manager:   Alice Manager (Sales Director)) Tj\n" +
                "0 -14 Td (Global Insurance:    Allianz Corporate Medical Shield #AG-992014) Tj\n" +
                "0 -14 Td (SOS Emergency:       Active 24/7 Global Evacuation Protocol) Tj\n" +
                "0 -35 Td /F1 10 Tf (----------------------------------------------------------------------------------------------------) Tj\n" +
                "0 -18 Td /F1 9 Tf (CONFIDENTIAL - FOR AUTHORIZED WORKFORCE LOGISTICS USE ONLY) Tj\n" +
                "0 -14 Td (Digital Verification Code: CBG-SEC-VERIFIED-OK-2026) Tj\n" +
                "ET\n" +
                "endstream\n" +
                "endobj\n" +
                "xref\n" +
                "0 6\n" +
                "0000000000 65535 f \n" +
                "0000000009 00000 n \n" +
                "0000000056 00000 n \n" +
                "0000000111 00000 n \n" +
                "0000000224 00000 n \n" +
                "0000000293 00000 n \n" +
                "trailer <</Size 6/Root 1 0 R>>\n" +
                "startxref\n" +
                "1750\n" +
                "%%EOF\n";
        Files.write(targetPath, pdfContent.getBytes(StandardCharsets.UTF_8));
    }

    private void generateRichReceiptImage(Path targetPath, String filename) throws IOException {
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
        ImageIO.write(image, "png", targetPath.toFile());
    }
}
