package com.routerail.booking.payments;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {
    private final NamedParameterJdbcTemplate jdbc;

    public PaymentService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public PaymentResponse confirmMockPayment(long bookingId) {
        var params = new MapSqlParameterSource("bookingId", bookingId);
        var bookings = jdbc.queryForList("""
                SELECT id, booking_reference, status
                FROM booking WHERE id = :bookingId FOR UPDATE
                """, params);
        if (bookings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found.");
        }
        var booking = bookings.get(0);
        String status = booking.get("status").toString();
        if ("CONFIRMED".equals(status)) {
            return new PaymentResponse("CONFIRMED");
        }
        if (!"PENDING".equals(status)) {
            return new PaymentResponse(status);
        }

        Integer seatCount = jdbc.queryForObject("""
                SELECT count(*) FROM booking_seat WHERE booking_id = :bookingId
                """, params, Integer.class);
        Integer activeHoldCount = jdbc.queryForObject("""
                SELECT count(*) FROM booking_seat bs
                JOIN seat_allocation a ON a.booking_seat_id = bs.id
                WHERE bs.booking_id = :bookingId AND a.status = 'HELD' AND a.expires_at > now()
                """, params, Integer.class);
        if (seatCount == null || seatCount == 0 || !seatCount.equals(activeHoldCount)) {
            jdbc.update("""
                    UPDATE seat_allocation SET status = 'EXPIRED'
                    WHERE booking_seat_id IN (SELECT id FROM booking_seat WHERE booking_id = :bookingId)
                      AND status = 'HELD'
                    """, params);
            jdbc.update("UPDATE booking SET status = 'EXPIRED' WHERE id = :bookingId", params);
            jdbc.update("UPDATE payment SET status = 'FAILED' WHERE booking_id = :bookingId", params);
            return new PaymentResponse("EXPIRED");
        }

        jdbc.update("""
                UPDATE seat_allocation SET status = 'CONFIRMED', expires_at = NULL
                WHERE booking_seat_id IN (SELECT id FROM booking_seat WHERE booking_id = :bookingId)
                  AND status = 'HELD'
                """, params);
        jdbc.update("UPDATE booking SET status = 'CONFIRMED' WHERE id = :bookingId", params);
        jdbc.update("""
                UPDATE payment
                SET status = 'SUCCEEDED', provider_reference = :providerReference
                WHERE booking_id = :bookingId
                """, new MapSqlParameterSource()
                .addValue("bookingId", bookingId)
                .addValue("providerReference", "MOCK-" + booking.get("booking_reference")));
        return new PaymentResponse("CONFIRMED");
    }
}