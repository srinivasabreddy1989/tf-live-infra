package com.routerail.booking.payments;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/mock")
public class PaymentController {
    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/{bookingId}/confirm")
    public PaymentResponse confirm(@PathVariable long bookingId) {
        return payments.confirmMockPayment(bookingId);
    }
}