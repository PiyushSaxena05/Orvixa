package com.Orvixa.Orvixa.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "otps")
public class Otp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used;

    public Otp() {
    }

    public Otp(String email, String code, Instant expiresAt) {
        this.email = email;
        this.code = code;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getCode() {
        return code;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
}
