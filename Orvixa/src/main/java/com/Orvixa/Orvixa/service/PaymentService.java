package com.Orvixa.Orvixa.service;

import com.Orvixa.Orvixa.dto.CreateOrderRequest;
import com.Orvixa.Orvixa.dto.CreateOrderResponse;
import com.Orvixa.Orvixa.model.Transaction;
import com.Orvixa.Orvixa.repository.TransactionRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.Orvixa.Orvixa.dto.PaymentVerificationRequest;
import com.Orvixa.Orvixa.model.TransactionStatus;
import com.razorpay.Utils;

@Service
public class PaymentService {
    private final RazorpayClient razorpayClient;
    private final TransactionRepository transactionRepository;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    private final FraudDetectionService fraudDetectionService;

    private final TransactionBroadcaster broadcaster;

    private final RetryAdvisorService retryAdvisorService;

    public PaymentService(RazorpayClient razorpayClient,
                          TransactionRepository transactionRepository,
                          FraudDetectionService fraudDetectionService,
                          TransactionBroadcaster broadcaster,
                          RetryAdvisorService retryAdvisorService) {
        this.razorpayClient = razorpayClient;
        this.transactionRepository = transactionRepository;
        this.fraudDetectionService = fraudDetectionService;
        this.broadcaster = broadcaster;
        this.retryAdvisorService = retryAdvisorService;
    }

    public CreateOrderResponse createOrder(CreateOrderRequest request) throws RazorpayException {

        long amountInPaise = Math.round(request.getAmount() * 100);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", request.getCurrency());
        orderRequest.put("receipt", "receipt_" + System.currentTimeMillis());

        com.razorpay.Order order = razorpayClient.orders.create(orderRequest);
        String razorpayOrderId = order.get("id");

        Transaction transaction = new Transaction(
                razorpayOrderId,
                amountInPaise,
                request.getCurrency(),
                request.getUserId()
        );
        transactionRepository.save(transaction);
        broadcaster.broadcast(transaction);

        return new CreateOrderResponse(razorpayOrderId, amountInPaise, request.getCurrency(), razorpayKeyId);
    }

    public Transaction verifyAndFinalize(PaymentVerificationRequest request) {
        Transaction transaction = transactionRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No transaction found for order " + request.getRazorpayOrderId()));

        JSONObject options = new JSONObject();
        options.put("razorpay_order_id", request.getRazorpayOrderId());
        options.put("razorpay_payment_id", request.getRazorpayPaymentId());
        options.put("razorpay_signature", request.getRazorpaySignature());

        boolean isValid;
        try {
            isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);
        } catch (RazorpayException e) {
            isValid = false;
        }

        transaction.setRazorpayPaymentId(request.getRazorpayPaymentId());
        transaction.setStatus(isValid ? TransactionStatus.SUCCESS : TransactionStatus.FAILED);

        Transaction saved = transactionRepository.save(transaction);
        broadcaster.broadcast(saved);

        if (saved.getStatus() == TransactionStatus.SUCCESS) {
            fraudDetectionService.analyzeFraud(saved);
        } else if (saved.getStatus() == TransactionStatus.FAILED) {
            retryAdvisorService.adviseOnFailure(saved);
        }

        return saved;
    }
}