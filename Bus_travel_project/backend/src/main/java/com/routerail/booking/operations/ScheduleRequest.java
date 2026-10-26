package com.routerail.booking.operations;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ScheduleRequest(
        @NotNull Long busId,
        @NotBlank @Size(max = 100) String origin,
        @NotBlank @Size(max = 100) String destination,
        @NotNull LocalDateTime departureAt,
        @NotNull LocalDateTime arrivalAt,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal fare) {
}