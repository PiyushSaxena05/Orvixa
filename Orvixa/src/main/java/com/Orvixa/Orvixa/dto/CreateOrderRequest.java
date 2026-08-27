package com.Orvixa.Orvixa.dto;

public class CreateOrderRequest {
    private double amount;
    private String currency;
    private String  userId;

    public CreateOrderRequest(){

    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
