package com.nextlead.dao;

import com.nextlead.models.SystemSetting;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class SystemSettingsDaoImpl implements SystemSettingsDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public SystemSettingsDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<SystemSetting> rowMapper = (rs, rowNum) -> {
        SystemSetting setting = new SystemSetting();
        setting.setKeyName(rs.getString("key_name"));
        setting.setValueText(rs.getString("value_text"));
        return setting;
    };

    @Override
    public Optional<String> getSetting(String key) {
        String sql = "SELECT value_text FROM system_settings WHERE key_name = ?";
        try {
            String value = jdbcTemplate.queryForObject(sql, String.class, key);
            return Optional.ofNullable(value);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public void saveSetting(String key, String value) {
        String sql = "INSERT INTO system_settings (key_name, value_text) VALUES (?, ?) " +
                     "ON CONFLICT (key_name) DO UPDATE SET value_text = EXCLUDED.value_text";
        jdbcTemplate.update(sql, key, value);
    }

    @Override
    public List<SystemSetting> getAllSettings() {
        String sql = "SELECT key_name, value_text FROM system_settings";
        return jdbcTemplate.query(sql, rowMapper);
    }
}
