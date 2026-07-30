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
        Document saved = documentRepository.save(document);
        auditLogService.log(userId, "UPLOAD_DOCUMENT", "Document", saved.getId());
        return saved;
    }

    public List<Document> getUserDocuments(Long userId) {
        return documentRepository.findByUserId(userId);
    }

    public void deleteDocument(Long id, Long userId) {
        documentRepository.deleteById(id);
        auditLogService.log(userId, "DELETE_DOCUMENT", "Document", id);
    }
}
