package com.routerail.booking.operations;

public record OperatorAccountResponse(
        long operatorId,
        long accountId,
        String operatorName,
        String fullName,
        String email) {
}