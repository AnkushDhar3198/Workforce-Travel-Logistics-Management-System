package com.cbg.travel.controller;

import com.cbg.travel.config.JwtService;
import com.cbg.travel.entity.User;
import com.cbg.travel.repository.UserRepository;
import com.cbg.travel.service.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam(required = false) String token) {
        // EventSource can't send Authorization headers, so we accept token as query param
        if (token == null || token.isBlank()) {
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(new SecurityException("Missing authentication token"));
            return emitter;
        }

        try {
            String email = jwtService.extractEmail(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new SecurityException("Invalid token"));

            if (!jwtService.isTokenValid(token, email)) {
                throw new SecurityException("Token expired or invalid");
            }

            return sseService.registerEmitter(user.getId());
        } catch (Exception e) {
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(e);
            return emitter;
        }
    }
}
