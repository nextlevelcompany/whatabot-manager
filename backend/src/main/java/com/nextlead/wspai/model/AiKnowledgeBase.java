package com.nextlead.wspai.model;

public class AiKnowledgeBase {
    private Integer id;
    private String category;
    private String keywords;
    private String answer;
    private String attachmentUrl;
    private String attachmentType; // IMAGE, PDF, AUDIO, NONE

    // Campos nuevos para control conversacional y multimedia
    private String intent;
    private Boolean active;
    private Integer priority;
    private String mediaIdWhatsapp;
    private String mediaCaption;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getAttachmentType() {
        return attachmentType;
    }

    public void setAttachmentType(String attachmentType) {
        this.attachmentType = attachmentType;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getMediaIdWhatsapp() {
        return mediaIdWhatsapp;
    }

    public void setMediaIdWhatsapp(String mediaIdWhatsapp) {
        this.mediaIdWhatsapp = mediaIdWhatsapp;
    }

    public String getMediaCaption() {
        return mediaCaption;
    }

    public void setMediaCaption(String mediaCaption) {
        this.mediaCaption = mediaCaption;
    }
}
