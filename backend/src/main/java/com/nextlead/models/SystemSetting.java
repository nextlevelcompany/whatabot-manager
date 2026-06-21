package com.nextlead.models;

public class SystemSetting {
    private String keyName;
    private String valueText;

    public SystemSetting() {
    }

    public SystemSetting(String keyName, String valueText) {
        this.keyName = keyName;
        this.valueText = valueText;
    }

    public String getKeyName() {
        return keyName;
    }

    public void setKeyName(String keyName) {
        this.keyName = keyName;
    }

    public String getValueText() {
        return valueText;
    }

    public void setValueText(String valueText) {
        this.valueText = valueText;
    }
}
