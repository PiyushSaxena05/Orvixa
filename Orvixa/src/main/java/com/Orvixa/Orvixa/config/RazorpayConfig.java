package com.Orvixa.Orvixa.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key-id}")
    private String KeyId;

    @Value("${razorpay.key-secret}")
    private String KeySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {

        System.out.println("KEY ID LOADED: " + KeyId);
        System.out.println("SECRET LENGTH: " + (KeySecret != null ? KeySecret.length() : "NULL"));
        return new RazorpayClient(KeyId, KeySecret);
    }

}

