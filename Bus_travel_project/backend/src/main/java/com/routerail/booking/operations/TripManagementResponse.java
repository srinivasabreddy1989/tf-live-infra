package com.routerail.booking.operations;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TripManagementResponse(
        long id,
        long busId,
        String registrationNumber,
        String busType,
        String origin,
        String destination,
        OffsetDateTime departureAt,
        OffsetDateTime arrivalAt,
        BigDecimal fare,
        String status,
        String blockedSeats) {
}