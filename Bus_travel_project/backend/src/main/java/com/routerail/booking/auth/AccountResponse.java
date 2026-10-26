package com.routerail.booking.auth;

import java.time.LocalDate;

public record AccountResponse(long id, String fullName, String email, String role, LocalDate dateOfBirth) {
}
