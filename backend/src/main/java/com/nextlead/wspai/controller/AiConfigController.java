package com.nextlead.wspai.controller;

import com.nextlead.wspai.dao.AiConfigDao;
import com.nextlead.wspai.model.ShippingCoverage;
import com.nextlead.wspai.model.AiProductConfig;
import com.nextlead.wspai.model.AiKnowledgeBase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiConfigController {

    private final AiConfigDao aiConfigDao;

    @Autowired
    public AiConfigController(AiConfigDao aiConfigDao) {
        this.aiConfigDao = aiConfigDao;
    }

    // ==========================================
    // Shipping Coverage APIs
    // ==========================================
    @GetMapping("/shipping-coverage")
    public ResponseEntity<List<ShippingCoverage>> getShippingCoverage() {
        return new ResponseEntity<>(aiConfigDao.getAllShippingCoverage(), HttpStatus.OK);
    }

    @PostMapping("/shipping-coverage")
    public ResponseEntity<Void> saveShippingCoverage(@RequestBody ShippingCoverage coverage) {
        aiConfigDao.saveShippingCoverage(coverage);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/shipping-coverage/{id}")
    public ResponseEntity<Void> deleteShippingCoverage(@PathVariable("id") Integer id) {
        aiConfigDao.deleteShippingCoverage(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // ==========================================
    // AI Products Config APIs
    // ==========================================
    @GetMapping("/products-config")
    public ResponseEntity<List<AiProductConfig>> getProductsConfig() {
        return new ResponseEntity<>(aiConfigDao.getAllAiProductsConfig(), HttpStatus.OK);
    }

    @PostMapping("/products-config")
    public ResponseEntity<Void> saveProductConfig(@RequestBody AiProductConfig config) {
        aiConfigDao.saveAiProductConfig(config);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // ==========================================
    // AI Knowledge Base (FAQ) APIs
    // ==========================================
    @GetMapping("/knowledge-base")
    public ResponseEntity<List<AiKnowledgeBase>> getKnowledgeBase() {
        return new ResponseEntity<>(aiConfigDao.getAllAiKnowledgeBase(), HttpStatus.OK);
    }

    @PostMapping("/knowledge-base")
    public ResponseEntity<Void> saveKnowledgeBase(@RequestBody AiKnowledgeBase kb) {
        aiConfigDao.saveAiKnowledgeBase(kb);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/knowledge-base/{id}")
    public ResponseEntity<Void> deleteKnowledgeBase(@PathVariable("id") Integer id) {
        aiConfigDao.deleteAiKnowledgeBase(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
