package com.nextlead.wspai.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AiDecisionResponse {

    private String intent;

    @JsonProperty("reply_text")
    @JsonAlias("replyText")
    private String replyText;

    @JsonProperty("send_media")
    @JsonAlias("sendMedia")
    private boolean sendMedia;

    @JsonProperty("media_type")
    @JsonAlias("mediaType")
    private String mediaType;

    @JsonProperty("media_id")
    @JsonAlias("mediaId")
    private String mediaId;

    @JsonProperty("image_url")
    @JsonAlias("imageUrl")
    private String imageUrl;

    private String caption;
    private List<String> buttons;

    @JsonProperty("next_state")
    @JsonAlias("nextState")
    private String nextState;

    @JsonProperty("needs_human")
    @JsonAlias("needsHuman")
    private boolean needsHuman;

    @JsonProperty("extracted_info")
    @JsonAlias("extractedInfo")
    private com.fasterxml.jackson.databind.JsonNode extractedInfo;

    // Getters and Setters
    public com.fasterxml.jackson.databind.JsonNode getExtractedInfo() {
        return extractedInfo;
    }

    public void setExtractedInfo(com.fasterxml.jackson.databind.JsonNode extractedInfo) {
        this.extractedInfo = extractedInfo;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getReplyText() {
        return replyText;
    }

    public void setReplyText(String replyText) {
        this.replyText = replyText;
    }

    public boolean isSendMedia() {
        return sendMedia;
    }

    public void setSendMedia(boolean sendMedia) {
        this.sendMedia = sendMedia;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getMediaId() {
        return mediaId;
    }

    public void setMediaId(String mediaId) {
        this.mediaId = mediaId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public List<String> getButtons() {
        return buttons;
    }

    public void setButtons(List<String> buttons) {
        this.buttons = buttons;
    }

    public String getNextState() {
        return nextState;
    }

    public void setNextState(String nextState) {
        this.nextState = nextState;
    }

    public boolean isNeedsHuman() {
        return needsHuman;
    }

    public void setNeedsHuman(boolean needsHuman) {
        this.needsHuman = needsHuman;
    }

    @Override
    public String toString() {
        return "AiDecisionResponse{" +
                "intent='" + intent + '\'' +
                ", replyText='" + replyText + '\'' +
                ", sendMedia=" + sendMedia +
                ", mediaType='" + mediaType + '\'' +
                ", mediaId='" + mediaId + '\'' +
                ", imageUrl='" + imageUrl + '\'' +
                ", caption='" + caption + '\'' +
                ", buttons=" + buttons +
                ", nextState='" + nextState + '\'' +
                ", needsHuman=" + needsHuman +
                '}';
    }
}
