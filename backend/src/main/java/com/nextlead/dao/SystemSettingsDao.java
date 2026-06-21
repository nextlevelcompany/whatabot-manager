package com.nextlead.dao;

import com.nextlead.models.SystemSetting;
import java.util.List;
import java.util.Optional;

public interface SystemSettingsDao {
    Optional<String> getSetting(String key);
    void saveSetting(String key, String value);
    List<SystemSetting> getAllSettings();
}
