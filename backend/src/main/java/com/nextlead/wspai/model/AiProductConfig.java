package com.nextlead.wspai.model;

public class AiProductConfig {
    private Integer id;
    private Integer productoId;
    private Boolean aiEnabled;
    private String searchKeywords;
    private String customAiDescription;

    // Campos nuevos para control de intención, prioridad y multimedia
    private String intent;
    private Integer priority;
    private String mediaIdWhatsapp;
    private String imageCaption;

    // De producto relacionado (para simplificar lecturas en UI)
    private String productCode;
    private String productName;
    private String productPrice;
    private String productImage;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getProductoId() {
        return productoId;
    }

    public void setProductoId(Integer productoId) {
        this.productoId = productoId;
    }

    public Boolean getAiEnabled() {
        return aiEnabled;
    }

    public void setAiEnabled(Boolean aiEnabled) {
        this.aiEnabled = aiEnabled;
    }

    public String getSearchKeywords() {
        return searchKeywords;
    }

    public void setSearchKeywords(String searchKeywords) {
        this.searchKeywords = searchKeywords;
    }

    public String getCustomAiDescription() {
        return customAiDescription;
    }

    public void setCustomAiDescription(String customAiDescription) {
        this.customAiDescription = customAiDescription;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
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

    public String getImageCaption() {
        return imageCaption;
    }

    public void setImageCaption(String imageCaption) {
        this.imageCaption = imageCaption;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductPrice() {
        return productPrice;
    }

    public void setProductPrice(String productPrice) {
        this.productPrice = productPrice;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(String productImage) {
        this.productImage = productImage;
    }
}
