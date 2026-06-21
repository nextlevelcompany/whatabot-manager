package com.nextlead.dao;

import com.nextlead.models.WhatsAppMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class WhatsAppMessageDaoImpl implements WhatsAppMessageDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public WhatsAppMessageDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<WhatsAppMessage> rowMapper = new RowMapper<WhatsAppMessage>() {
        @Override
        public WhatsAppMessage mapRow(ResultSet rs, int rowNum) throws SQLException {
            WhatsAppMessage msg = new WhatsAppMessage();
            msg.setId(rs.getLong("id"));
            msg.setSender(rs.getString("sender"));
            msg.setReceiver(rs.getString("receiver"));
            msg.setMessageText(rs.getString("message_text"));
            msg.setTimestamp(rs.getTimestamp("timestamp").toLocalDateTime());
            msg.setStatus(rs.getString("status"));
            msg.setWamid(rs.getString("wamid"));
            return msg;
        }
    };

    @Override
    public void save(WhatsAppMessage message) {
        String sql = "INSERT INTO whatsapp_messages (sender, receiver, message_text, timestamp, status, wamid) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, 
            message.getSender(), 
            message.getReceiver(), 
            message.getMessageText(), 
            Timestamp.valueOf(message.getTimestamp()), 
            message.getStatus(),
            message.getWamid()
        );
    }

    @Override
    public Optional<WhatsAppMessage> findById(Long id) {
        String sql = "SELECT id, sender, receiver, message_text, timestamp, status, wamid FROM whatsapp_messages WHERE id = ?";
        try {
            WhatsAppMessage message = jdbcTemplate.queryForObject(sql, rowMapper, id);
            return Optional.ofNullable(message);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<WhatsAppMessage> findAll() {
        String sql = "SELECT id, sender, receiver, message_text, timestamp, status, wamid FROM whatsapp_messages ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public List<WhatsAppMessage> findBySender(String sender) {
        String sql = "SELECT id, sender, receiver, message_text, timestamp, status, wamid FROM whatsapp_messages WHERE sender = ? ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, rowMapper, sender);
    }

    @Override
    public List<WhatsAppMessage> findConversation(String phone) {
        // Normalizamos buscando por los últimos 9 dígitos (formato estándar peruano)
        String last9 = phone.length() >= 9 ? phone.substring(phone.length() - 9) : phone;
        String matchPattern = "%" + last9;
        String sql = "SELECT id, sender, receiver, message_text, timestamp, status, wamid FROM whatsapp_messages " +
                     "WHERE sender LIKE ? OR receiver LIKE ? ORDER BY timestamp ASC";
        return jdbcTemplate.query(sql, rowMapper, matchPattern, matchPattern);
    }

    @Override
    public void updateStatus(Long id, String status) {
        String sql = "UPDATE whatsapp_messages SET status = ? WHERE id = ?";
        jdbcTemplate.update(sql, status, id);
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM whatsapp_messages WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public Optional<WhatsAppMessage> findByWamid(String wamid) {
        String sql = "SELECT id, sender, receiver, message_text, timestamp, status, wamid FROM whatsapp_messages WHERE wamid = ?";
        try {
            WhatsAppMessage message = jdbcTemplate.queryForObject(sql, rowMapper, wamid);
            return Optional.ofNullable(message);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public void updateStatusByWamid(String wamid, String status) {
        String sql = "UPDATE whatsapp_messages SET status = ? WHERE wamid = ?";
        jdbcTemplate.update(sql, status, wamid);
    }
}
