package com.cbg.travel.controller;

import com.cbg.travel.entity.Document;
import com.cbg.travel.entity.User;
import com.cbg.travel.service.AuthService;
import com.cbg.travel.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Document> create(@RequestBody Document document) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(documentService.uploadDocument(document, user.getId()));
    }

    @GetMapping
    public ResponseEntity<List<Document>> getUserDocs() {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(documentService.getUserDocuments(user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        documentService.deleteDocument(id, user.getId());
        return ResponseEntity.ok().build();
    }
}
