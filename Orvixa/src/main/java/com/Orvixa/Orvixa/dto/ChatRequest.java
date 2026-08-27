package com.Orvixa.Orvixa.dto;

public class ChatRequest {

    private String userId;
    private String question;

    public ChatRequest() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}