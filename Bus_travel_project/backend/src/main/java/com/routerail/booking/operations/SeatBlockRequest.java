package com.routerail.booking.operations;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SeatBlockRequest(
        @NotBlank @Size(max = 10) String seatNumber,
        @Size(max = 160) String reason) {
}