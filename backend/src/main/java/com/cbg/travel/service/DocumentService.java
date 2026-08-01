package com.cbg.travel.service;

import com.cbg.travel.entity.Document;
import com.cbg.travel.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final AuditLogService auditLogService;

    public Document uploadDocument(Document document, Long userId) {
        document.setUserId(userId);
        normalizeFileUrl(document);
        Document saved = documentRepository.save(document);
        auditLogService.log(userId, "UPLOAD_DOCUMENT", "Document", saved.getId());
        return saved;
    }

    public List<Document> getUserDocuments(Long userId) {
        List<Document> list = documentRepository.findByUserId(userId);
        boolean changed = false;
        for (Document d : list) {
            if (normalizeFileUrl(d)) {
                documentRepository.save(d);
                changed = true;
            }
        }
        return list;
    }

    private boolean normalizeFileUrl(Document doc) {
        if (doc.getFileUrl() == null || doc.getFileUrl().contains("bob_docs.pdf")) {
            String type = doc.getType() != null ? doc.getType().toUpperCase() : "PASSPORT";
            if ("TICKET".equals(type)) {
                doc.setFileUrl("/uploads/ticket_bob.pdf");
                return true;
            } else if ("VISA".equals(type)) {
                doc.setFileUrl("/uploads/visa_uk_bob.pdf");
                return true;
            } else if ("INSURANCE".equals(type)) {
                doc.setFileUrl("/uploads/insurance_bob.pdf");
                return true;
            } else if ("SHIPMENT_DOC".equals(type)) {
                doc.setFileUrl("/uploads/shipment_doc_bob.pdf");
                return true;
            } else if ("PASSPORT".equals(type)) {
                doc.setFileUrl("/uploads/passport_bob.pdf");
                return true;
            }
        }
        return false;
    }

    public void deleteDocument(Long id, Long userId) {
        documentRepository.deleteById(id);
        auditLogService.log(userId, "DELETE_DOCUMENT", "Document", id);
    }
}
