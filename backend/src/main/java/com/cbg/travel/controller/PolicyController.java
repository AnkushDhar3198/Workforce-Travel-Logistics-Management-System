package com.cbg.travel.controller;

import com.cbg.travel.entity.PolicyRule;
import com.cbg.travel.repository.PolicyRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/policy-rules")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyRuleRepository policyRuleRepository;

    @GetMapping
    public ResponseEntity<List<PolicyRule>> getAllRules() {
        return ResponseEntity.ok(policyRuleRepository.findAll());
    }

    @GetMapping("/type/{ruleType}")
    public ResponseEntity<List<PolicyRule>> getRulesByType(@PathVariable String ruleType) {
        return ResponseEntity.ok(policyRuleRepository.findByRuleType(ruleType));
    }
}
