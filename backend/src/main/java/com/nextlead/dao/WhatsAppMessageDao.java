package com.nextlead.dao;

import com.nextlead.models.WhatsAppMessage;
import java.util.List;
import java.util.Optional;

public interface WhatsAppMessageDao {
    void save(WhatsAppMessage message);
    Optional<WhatsAppMessage> findById(Long id);
    List<WhatsAppMessage> findAll();
    List<WhatsAppMessage> findBySender(String sender);
    List<WhatsAppMessage> findConversation(String phone);
    void updateStatus(Long id, String status);
    void delete(Long id);
}
