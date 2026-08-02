package com.cbg.travel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Async
    public void sendEmailNotification(String toEmail, String subject, String bodyHtml) {
        log.info("[EMAIL NOTIFICATION DISPATCH] Sending email to: {} | Subject: {}", toEmail, subject);
        try {
            if (mailSender != null) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(bodyHtml, true);
                helper.setFrom("notifications@voyacore.com", "VoyaCore Enterprise Communications");
                mailSender.send(message);
                log.info("[EMAIL SUCCESS] Email successfully dispatched to {}", toEmail);
            } else {
                log.warn("[EMAIL SIMULATION] SMTP JavaMailSender not configured. Email logged: {}", bodyHtml);
            }
        } catch (Exception ex) {
            log.error("[EMAIL SERVICE NOTE] Standard email dispatch logged for {}: {}", toEmail, ex.getMessage());
        }
    }

    public String buildTravelRequestHtml(String employeeName, String destination, String startDate, String endDate, String status) {
        return """
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
                <h2 style="color: #38bdf8;">✈️ VoyaCore Travel Request Notification</h2>
                <p>Hello <strong>%s</strong>,</p>
                <p>Your travel request details have been updated:</p>
                <ul>
                    <li><strong>Destination:</strong> %s</li>
                    <li><strong>Dates:</strong> %s to %s</li>
                    <li><strong>Status:</strong> <span style="color: #4ade80;">%s</span></li>
                </ul>
                <p style="font-size: 12px; color: #94a3b8;">VoyaCore Level 5 Enterprise Autonomy Protocol</p>
            </div>
            """.formatted(employeeName, destination, startDate, endDate, status);
    }
}
