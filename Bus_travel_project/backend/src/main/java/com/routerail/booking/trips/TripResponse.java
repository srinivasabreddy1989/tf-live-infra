package com.routerail.booking.trips;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TripResponse(
        long id,
        String operator,
        String busType,
        String origin,
        String destination,
        OffsetDateTime departureAt,
        OffsetDateTime arrivalAt,
        BigDecimal fare,
        int availableSeats) {
}