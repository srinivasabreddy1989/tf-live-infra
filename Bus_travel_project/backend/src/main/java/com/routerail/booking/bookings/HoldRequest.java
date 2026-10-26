package com.routerail.booking.bookings;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HoldRequest(
        @NotNull Long tripId,
        @NotEmpty @Size(max = 6) List<@NotBlank @Size(max = 10) String> seatNumbers,
        @NotBlank @Size(min = 2, max = 120) String passengerName,
        @NotBlank @Email @Size(max = 254) String passengerEmail) {
}