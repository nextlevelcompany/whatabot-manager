package com.nextlead.controllers;

import com.nextlead.dao.WhatsAppMessageDao;
import com.nextlead.models.WhatsAppMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class WhatsAppMessageController {

    private final WhatsAppMessageDao messageDao;

    @Autowired
    public WhatsAppMessageController(WhatsAppMessageDao messageDao) {
        this.messageDao = messageDao;
    }

    @PostMapping
    public ResponseEntity<WhatsAppMessage> sendMessage(@RequestBody WhatsAppMessage message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }
        if (message.getStatus() == null) {
            message.setStatus("SENT");
        }
        messageDao.save(message);
        return new ResponseEntity<>(message, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<WhatsAppMessage>> getAllMessages() {
        List<WhatsAppMessage> messages = messageDao.findAll();
        return new ResponseEntity<>(messages, HttpStatus.OK);
    }

    @GetMapping("/sender/{sender}")
    public ResponseEntity<List<WhatsAppMessage>> getMessagesBySender(@PathVariable String sender) {
        List<WhatsAppMessage> messages = messageDao.findBySender(sender);
        return new ResponseEntity<>(messages, HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateMessageStatus(@PathVariable Long id, @RequestParam String status) {
        messageDao.updateStatus(id, status);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageDao.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
