package com.cbg.travel.controller;

import com.cbg.travel.entity.User;
import com.cbg.travel.entity.Vendor;
import com.cbg.travel.service.AuthService;
import com.cbg.travel.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Vendor> create(@RequestBody Vendor vendor) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(vendorService.createVendor(vendor, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendor> update(@PathVariable Long id, @RequestBody Vendor vendor) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(vendorService.updateVendor(id, vendor, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        vendorService.deleteVendor(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<Vendor>> getAll() {
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @GetMapping("/preferred")
    public ResponseEntity<List<Vendor>> getPreferred(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(vendorService.getPreferredVendors(type));
    }
}
