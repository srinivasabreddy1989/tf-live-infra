package com.routerail.booking.auth;

import java.time.LocalDate;

public record CustomerResponse(long id, String fullName, String email, LocalDate dateOfBirth) {
}