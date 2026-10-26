package com.routerail.booking.bookings;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {
    private final NamedParameterJdbcTemplate jdbc;
    private final int holdMinutes;

    public BookingService(NamedParameterJdbcTemplate jdbc,
            @Value("${booking.hold-minutes:10}") int holdMinutes) {
        this.jdbc = jdbc;
        this.holdMinutes = holdMinutes;
    }

    @Transactional
    public BookingResponse createHold(HoldRequest request) {
        var seatNumbers = request.seatNumbers().stream()
                .map(String::trim)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
        if (seatNumbers.size() != request.seatNumbers().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seat numbers must be unique.");
        }

        var tripParams = new MapSqlParameterSource("tripId", request.tripId());
        var trips = jdbc.queryForList("""
                SELECT id, bus_id, base_fare, status
                FROM trip WHERE id = :tripId FOR UPDATE
                """, tripParams);
        if (trips.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found.");
        }
        var trip = trips.get(0);
        if (!"SCHEDULED".equals(trip.get("status").toString())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This trip is not available for booking.");
        }
        long busId = ((Number) trip.get("bus_id")).longValue();
        BigDecimal fare = (BigDecimal) trip.get("base_fare");

        var seatParams = new MapSqlParameterSource()
                .addValue("busId", busId)
                .addValue("seatNumbers", seatNumbers);
        var lockedSeats = jdbc.queryForList("""
                SELECT id, seat_number
                FROM seat
                WHERE bus_id = :busId AND seat_number IN (:seatNumbers)
                ORDER BY id
                FOR UPDATE
                """, seatParams);
        if (lockedSeats.size() != seatNumbers.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more seats do not belong to this bus.");
        }

        jdbc.update("""
                UPDATE seat_allocation SET status = 'EXPIRED'
                WHERE trip_id = :tripId AND status = 'HELD' AND expires_at <= now()
                """, tripParams);
        jdbc.update("""
                UPDATE booking b SET status = 'EXPIRED'
                WHERE b.status = 'PENDING' AND EXISTS (
                    SELECT 1 FROM booking_seat bs
                    JOIN seat_allocation a ON a.booking_seat_id = bs.id
                    WHERE bs.booking_id = b.id AND a.trip_id = :tripId AND a.status = 'EXPIRED'
                )
                """, tripParams);

        var seatIds = lockedSeats.stream().map(seat -> ((Number) seat.get("id")).longValue()).toList();
        var occupiedParams = new MapSqlParameterSource()
                .addValue("tripId", request.tripId())
                .addValue("seatIds", seatIds);
        Integer occupied = jdbc.queryForObject("""
                SELECT count(*) FROM seat_allocation
                WHERE trip_id = :tripId AND seat_id IN (:seatIds)
                  AND (status = 'CONFIRMED' OR (status = 'HELD' AND expires_at > now()))
                """, occupiedParams, Integer.class);
        Integer blocked = jdbc.queryForObject("""
                SELECT count(*) FROM blocked_seat
                WHERE trip_id = :tripId AND seat_id IN (:seatIds)
                """, occupiedParams, Integer.class);
        if ((occupied != null && occupied > 0) || (blocked != null && blocked > 0)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A selected seat is no longer available.");
        }

        String reference = "RR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        BigDecimal total = fare.multiply(BigDecimal.valueOf(seatIds.size()));
        long bookingId = jdbc.queryForObject("""
                INSERT INTO booking (booking_reference, passenger_name, passenger_email, status, total_amount)
                VALUES (:reference, :name, :email, 'PENDING', :total)
                RETURNING id
                """, new MapSqlParameterSource()
                .addValue("reference", reference)
                .addValue("name", request.passengerName().trim())
                .addValue("email", request.passengerEmail().trim().toLowerCase(Locale.ROOT))
                .addValue("total", total), Long.class);

        for (long seatId : seatIds) {
            long bookingSeatId = jdbc.queryForObject("""
                    INSERT INTO booking_seat (booking_id, trip_id, seat_id, fare)
                    VALUES (:bookingId, :tripId, :seatId, :fare)
                    RETURNING id
                    """, new MapSqlParameterSource()
                    .addValue("bookingId", bookingId)
                    .addValue("tripId", request.tripId())
                    .addValue("seatId", seatId)
                    .addValue("fare", fare), Long.class);
            jdbc.update("""
                    INSERT INTO seat_allocation (trip_id, seat_id, booking_seat_id, status, expires_at)
                    VALUES (:tripId, :seatId, :bookingSeatId, 'HELD', now() + make_interval(mins => :holdMinutes))
                    """, new MapSqlParameterSource()
                    .addValue("tripId", request.tripId())
                    .addValue("seatId", seatId)
                    .addValue("bookingSeatId", bookingSeatId)
                    .addValue("holdMinutes", holdMinutes));
        }
        jdbc.update("""
                INSERT INTO payment (booking_id, amount, status)
                VALUES (:bookingId, :total, 'PENDING')
                """, new MapSqlParameterSource().addValue("bookingId", bookingId).addValue("total", total));

        return new BookingResponse(bookingId, reference, total);
    }
}