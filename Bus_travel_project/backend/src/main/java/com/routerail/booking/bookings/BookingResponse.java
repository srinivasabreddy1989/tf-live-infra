package com.routerail.booking.bookings;

import java.math.BigDecimal;

public record BookingResponse(long id, String reference, BigDecimal totalAmount) {
}