package com.routerail.booking.trips;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class TripService {
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private final NamedParameterJdbcTemplate jdbc;

    public TripService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<TripResponse> search(String origin, String destination, LocalDate date) {
        var start = date.atStartOfDay(INDIA).toOffsetDateTime();
        var end = date.plusDays(1).atStartOfDay(INDIA).toOffsetDateTime();
        var parameters = new MapSqlParameterSource()
                .addValue("origin", origin.trim())
                .addValue("destination", destination.trim())
                .addValue("start", start)
                .addValue("end", end);

        return jdbc.query("""
                SELECT t.id, o.name AS operator, b.bus_type, r.origin, r.destination,
                       t.departure_at, t.arrival_at, t.base_fare,
                       (SELECT count(*) FROM seat s
                        WHERE s.bus_id = b.id AND NOT EXISTS (
                            SELECT 1 FROM seat_allocation a
                            WHERE a.trip_id = t.id AND a.seat_id = s.id
                              AND (a.status = 'CONFIRMED' OR (a.status = 'HELD' AND a.expires_at > now()))
                        ) AND NOT EXISTS (
                            SELECT 1 FROM blocked_seat blocked
                            WHERE blocked.trip_id = t.id AND blocked.seat_id = s.id
                        )) AS available_seats
                FROM trip t
                JOIN bus b ON b.id = t.bus_id
                JOIN operator o ON o.id = b.operator_id
                JOIN route r ON r.id = t.route_id
                WHERE lower(r.origin) = lower(:origin)
                  AND lower(r.destination) = lower(:destination)
                  AND t.departure_at >= :start AND t.departure_at < :end
                  AND t.status = 'SCHEDULED'
                ORDER BY t.departure_at
                """, parameters, (rs, rowNum) -> new TripResponse(
                rs.getLong("id"),
                rs.getString("operator"),
                rs.getString("bus_type"),
                rs.getString("origin"),
                rs.getString("destination"),
                rs.getObject("departure_at", java.time.OffsetDateTime.class),
                rs.getObject("arrival_at", java.time.OffsetDateTime.class),
                rs.getBigDecimal("base_fare"),
                rs.getInt("available_seats")));
    }

    public List<SeatResponse> seats(long tripId) {
        return jdbc.query("""
                SELECT s.seat_number,
                       NOT EXISTS (
                           SELECT 1 FROM seat_allocation a
                           WHERE a.trip_id = t.id AND a.seat_id = s.id
                             AND (a.status = 'CONFIRMED' OR (a.status = 'HELD' AND a.expires_at > now()))
                       ) AND NOT EXISTS (
                           SELECT 1 FROM blocked_seat blocked
                           WHERE blocked.trip_id = t.id AND blocked.seat_id = s.id
                       ) AS available
                FROM trip t
                JOIN seat s ON s.bus_id = t.bus_id
                WHERE t.id = :tripId
                ORDER BY s.seat_number
                """, new MapSqlParameterSource("tripId", tripId),
                (rs, rowNum) -> new SeatResponse(rs.getString("seat_number"), rs.getBoolean("available")));
    }
}