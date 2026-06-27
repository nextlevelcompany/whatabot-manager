package com.nextlead.dao;

import com.nextlead.wspai.dao.WhatsAppMessageDao;
import com.nextlead.wspai.dao.WhatsAppMessageDaoImpl;
import com.nextlead.wspai.model.WhatsAppMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class WhatsAppMessageDaoTests {

    private WhatsAppMessageDao messageDao;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        messageDao = new WhatsAppMessageDaoImpl(jdbcTemplate);
    }

    @Test
    void saveMessage_ShouldCallJdbcTemplateUpdate() {
        WhatsAppMessage msg = new WhatsAppMessage(null, "54911223344", "54911556677", "Hola", LocalDateTime.now(), "SENT");

        messageDao.save(msg);

        verify(jdbcTemplate, times(1)).update(
            eq("INSERT INTO whatsapp_messages (sender, receiver, message_text, timestamp, status) VALUES (?, ?, ?, ?, ?)"),
            eq(msg.getSender()),
            eq(msg.getReceiver()),
            eq(msg.getMessageText()),
            any(Timestamp.class),
            eq(msg.getStatus())
        );
    }

    @Test
    void findById_WhenMessageDoesNotExist_ShouldReturnEmptyOptional() {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), anyLong()))
            .thenThrow(new org.springframework.dao.EmptyResultDataAccessException(1));

        Optional<WhatsAppMessage> result = messageDao.findById(1L);

        assertFalse(result.isPresent());
    }

    @Test
    void updateStatus_ShouldCallJdbcTemplateUpdate() {
        messageDao.updateStatus(1L, "READ");

        verify(jdbcTemplate, times(1)).update(
            eq("UPDATE whatsapp_messages SET status = ? WHERE id = ?"),
            eq("READ"),
            eq(1L)
        );
    }

    @Test
    void deleteMessage_ShouldCallJdbcTemplateUpdate() {
        messageDao.delete(1L);

        verify(jdbcTemplate, times(1)).update(
            eq("DELETE FROM whatsapp_messages WHERE id = ?"),
            eq(1L)
        );
    }
}
