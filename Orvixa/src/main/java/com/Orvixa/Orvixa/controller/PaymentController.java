package com.Orvixa.Orvixa.controller;

import com.Orvixa.Orvixa.dto.CreateOrderRequest;
import com.Orvixa.Orvixa.dto.CreateOrderResponse;
import com.Orvixa.Orvixa.dto.PaymentVerificationRequest;
import com.Orvixa.Orvixa.model.Transaction;
import com.Orvixa.Orvixa.service.PaymentService;
import com.razorpay.RazorpayException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.Orvixa.Orvixa.repository.TransactionRepository;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final TransactionRepository transactionRepository;

    public PaymentController(PaymentService paymentService, TransactionRepository transactionRepository){
        this.paymentService = paymentService;
        this.transactionRepository = transactionRepository;
    }

    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(@RequestBody CreateOrderRequest request,
                                                           Authentication authentication)
            throws RazorpayException {

        request.setUserId(authentication.getName());
        return ResponseEntity.ok(paymentService.createOrder(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<Transaction> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        return ResponseEntity.ok(paymentService.verifyAndFinalize(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Transaction>> getHistory(Authentication authentication) {

        return ResponseEntity.ok(transactionRepository.findByUserIdOrderByCreatedAtDesc(authentication.getName()));
    }
}