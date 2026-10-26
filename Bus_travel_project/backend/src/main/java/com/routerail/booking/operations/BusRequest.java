package com.routerail.booking.operations;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BusRequest(
        @NotBlank @Size(max = 30) String registrationNumber,
        @NotBlank @Size(max = 60) String busType,
        @Min(1) @Max(100) int totalSeats) {
}