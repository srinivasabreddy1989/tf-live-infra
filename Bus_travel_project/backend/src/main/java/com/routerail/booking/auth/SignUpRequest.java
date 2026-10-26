package com.routerail.booking.auth;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
        @NotBlank @Size(min = 2, max = 120) String fullName,
        @NotNull @PastOrPresent LocalDate dateOfBirth,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank String confirmPassword) {
}