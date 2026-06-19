package com.nextlead.models;

import java.time.LocalDateTime;

public class WhatsAppMessage {
    private Long id;
    private String sender;
    private String receiver;
    private String messageText;
    private LocalDateTime timestamp;
    private String status; // SENT, DELIVERED, READ, RECEIVED

    public WhatsAppMessage() {}

    public WhatsAppMessage(Long id, String sender, String receiver, String messageText, LocalDateTime timestamp, String status) {
        this.id = id;
        this.sender = sender;
        this.receiver = receiver;
        this.messageText = messageText;
        this.timestamp = timestamp;
        this.status = status;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
