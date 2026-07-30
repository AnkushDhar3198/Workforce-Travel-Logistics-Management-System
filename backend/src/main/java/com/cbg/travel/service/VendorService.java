package com.cbg.travel.service;

import com.cbg.travel.entity.Vendor;
import com.cbg.travel.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final AuditLogService auditLogService;

    public Vendor createVendor(Vendor vendor, Long userId) {
        Vendor saved = vendorRepository.save(vendor);
        auditLogService.log(userId, "CREATE_VENDOR", "Vendor", saved.getId());
        return saved;
    }

    public Vendor updateVendor(Long id, Vendor updated, Long userId) {
        Vendor existing = vendorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));

        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setContractTerms(updated.getContractTerms());
        existing.setPerformanceRating(updated.getPerformanceRating());
        existing.setIsPreferred(updated.getIsPreferred());

        Vendor saved = vendorRepository.save(existing);
        auditLogService.log(userId, "UPDATE_VENDOR", "Vendor", saved.getId());
        return saved;
    }

    public void deleteVendor(Long id, Long userId) {
        vendorRepository.deleteById(id);
        auditLogService.log(userId, "DELETE_VENDOR", "Vendor", id);
    }

    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    public List<Vendor> getPreferredVendors(String type) {
        if (type != null && !type.trim().isEmpty()) {
            return vendorRepository.findByTypeAndIsPreferred(type, true);
        }
        return vendorRepository.findByIsPreferred(true);
    }
}
