package com.Orvixa.Orvixa.service;

import com.Orvixa.Orvixa.model.Otp;
import com.Orvixa.Orvixa.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.security.SecureRandom;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private static final int OTP_LENGTH = 6;
    private static final int EXPIRY_MINUTES = 5;
    private static final SecureRandom random = new SecureRandom();

    public OtpService(OtpRepository otpRepository, JavaMailSender mailSender) {
        this.otpRepository = otpRepository;
        this.mailSender = mailSender;
    }

    public void generateAndSendOtp(String email) {
        String code = generateCode();
        Instant expiresAt = Instant.now().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES);

        Otp otp = new Otp(email, code, expiresAt);
        otpRepository.save(otp);

        sendEmail(email, code);
    }

    public boolean verifyOtp(String email, String submittedCode) {
        Otp otp = otpRepository.findTopByEmailAndUsedFalseOrderByIdDesc(email)
                .orElse(null);

        if (otp == null) {
            return false;
        }

        if (Instant.now().isAfter(otp.getExpiresAt())) {
            return false;
        }

        if (!otp.getCode().equals(submittedCode)) {
            return false;
        }

        otp.setUsed(true);
        otpRepository.save(otp);
        return true;
    }

    private String generateCode() {
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private void sendEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Your Orvixa Login OTP");
        message.setText("Your OTP for login is: " + code + "\n\nThis code expires in "
                + EXPIRY_MINUTES + " minutes. Do not share this code with anyone.");
        mailSender.send(message);
    }
}
