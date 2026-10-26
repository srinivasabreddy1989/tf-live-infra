package com.routerail.booking.operations;

public record BusManagementResponse(long id, String registrationNumber, String busType, int totalSeats) {
}