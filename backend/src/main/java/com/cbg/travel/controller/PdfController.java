package com.cbg.travel.controller;

import com.cbg.travel.service.PdfGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfGenerationService pdfGenerationService;

    @GetMapping("/itinerary/{travelRequestId}")
    public ResponseEntity<byte[]> getItineraryPdf(@PathVariable Long travelRequestId) {
        byte[] pdf = pdfGenerationService.generateItineraryPdf(travelRequestId);
        return buildPdfResponse(pdf, "itinerary_" + travelRequestId + ".pdf");
    }

    @GetMapping("/expense-report/{travelRequestId}")
    public ResponseEntity<byte[]> getExpenseReportPdf(@PathVariable Long travelRequestId) {
        byte[] pdf = pdfGenerationService.generateExpenseReportPdf(travelRequestId);
        return buildPdfResponse(pdf, "expense_report_" + travelRequestId + ".pdf");
    }

    @GetMapping("/authorization/{travelRequestId}")
    public ResponseEntity<byte[]> getAuthorizationPdf(@PathVariable Long travelRequestId) {
        byte[] pdf = pdfGenerationService.generateAuthorizationPdf(travelRequestId);
        return buildPdfResponse(pdf, "authorization_" + travelRequestId + ".pdf");
    }

    @GetMapping("/shipment-manifest/{shipmentId}")
    public ResponseEntity<byte[]> getShipmentManifestPdf(@PathVariable Long shipmentId) {
        byte[] pdf = pdfGenerationService.generateShipmentManifestPdf(shipmentId);
        return buildPdfResponse(pdf, "shipment_manifest_" + shipmentId + ".pdf");
    }

    private ResponseEntity<byte[]> buildPdfResponse(byte[] pdfBytes, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }
}
