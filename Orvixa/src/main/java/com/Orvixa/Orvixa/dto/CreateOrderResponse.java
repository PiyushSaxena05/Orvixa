package com.Orvixa.Orvixa.dto;

public class CreateOrderResponse {

    private String razorpayOrderId;
    private long amountinPaise;
    private String currency;
    private String razorpayKeyId;

    public CreateOrderResponse(String razorpayOrderId, long amountinPaise, String currency, String razorpayKeyId) {

        this.razorpayOrderId = razorpayOrderId;
        this.amountinPaise = amountinPaise;
        this.currency = currency;
        this.razorpayKeyId = razorpayKeyId;
    }

    public String getRazorpayOrderId(){
        return razorpayOrderId;
    }

    public long getAmountinPaise(){
        return  amountinPaise;
    }

    public String getCurrency(){
        return currency;
    }
    public String getRazorpayKeyId(){
        return razorpayKeyId;
    }

}
