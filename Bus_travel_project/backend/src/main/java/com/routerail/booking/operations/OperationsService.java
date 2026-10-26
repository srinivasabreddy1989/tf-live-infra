package com.routerail.booking.operations;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsService {
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private final NamedParameterJdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public OperationsService(NamedParameterJdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public OperatorAccountResponse createOperator(CreateOperatorRequest request, HttpServletRequest httpRequest) {
        requireRole(httpRequest, "ADMIN");
        String email = normalizeEmail(request.email());
        Integer existing = jdbc.queryForObject("SELECT count(*) FROM app_user WHERE lower(email) = :email",
                new MapSqlParameterSource("email", email), Integer.class);
        if (existing != null && existing > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        try {
            long operatorId = jdbc.queryForObject("""
                    INSERT INTO operator (name, contact_details)
                    VALUES (:name, :contactDetails)
                    RETURNING id
                    """, new MapSqlParameterSource().addValue("name", request.operatorName().trim())
                    .addValue("contactDetails", blankToNull(request.contactDetails())), Long.class);
            long accountId = jdbc.queryForObject("""
                    INSERT INTO app_user (full_name, email, password_hash, role, status, operator_id)
                    VALUES (:fullName, :email, :passwordHash, 'OPERATOR', 'ACTIVE', :operatorId)
                    RETURNING id
                    """, new MapSqlParameterSource().addValue("fullName", request.fullName().trim())
                    .addValue("email", email).addValue("passwordHash", passwordEncoder.encode(request.password()))
                    .addValue("operatorId", operatorId), Long.class);
            return new OperatorAccountResponse(operatorId, accountId, request.operatorName().trim(),
                    request.fullName().trim(), email);
        } catch (DuplicateKeyException duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account or operator already exists.");
        }
    }

    public List<BusManagementResponse> buses(HttpServletRequest request) {
        long operatorId = requireOperator(request).operatorId();
        return jdbc.query("""
                SELECT id, registration_number, bus_type, total_seats
                FROM bus WHERE operator_id = :operatorId ORDER BY registration_number
                """, new MapSqlParameterSource("operatorId", operatorId), (rs, row) ->
                new BusManagementResponse(rs.getLong("id"), rs.getString("registration_number"),
                        rs.getString("bus_type"), rs.getInt("total_seats")));
    }

    @Transactional
    public BusManagementResponse addBus(BusRequest request, HttpServletRequest httpRequest) {
        long operatorId = requireOperator(httpRequest).operatorId();
        String registrationNumber = request.registrationNumber().trim().toUpperCase(Locale.ROOT);
        try {
            long busId = jdbc.queryForObject("""
                    INSERT INTO bus (operator_id, registration_number, bus_type, total_seats)
                    VALUES (:operatorId, :registrationNumber, :busType, :totalSeats)
                    RETURNING id
                    """, new MapSqlParameterSource().addValue("operatorId", operatorId)
                    .addValue("registrationNumber", registrationNumber)
                    .addValue("busType", request.busType().trim()).addValue("totalSeats", request.totalSeats()),
                    Long.class);
            for (int index = 0; index < request.totalSeats(); index++) {
                String seatNumber = (index / 4 + 1) + String.valueOf((char) ('A' + index % 4));
                jdbc.update("""
                        INSERT INTO seat (bus_id, seat_number, seat_type)
                        VALUES (:busId, :seatNumber, 'STANDARD')
                        """, new MapSqlParameterSource().addValue("busId", busId).addValue("seatNumber", seatNumber));
            }
            return new BusManagementResponse(busId, registrationNumber, request.busType().trim(), request.totalSeats());
        } catch (DuplicateKeyException duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That registration number is already in use.");
        }
    }

    @Transactional
    public long addSchedule(ScheduleRequest request, HttpServletRequest httpRequest) {
        long operatorId = requireOperator(httpRequest).operatorId();
        LocalDateTime now = LocalDateTime.now(INDIA);
        if (!request.departureAt().isAfter(now) || !request.arrivalAt().isAfter(request.departureAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Departure must be in the future and arrival must be later.");
        }

        Integer ownedBus = jdbc.queryForObject("""
                SELECT count(*) FROM bus WHERE id = :busId AND operator_id = :operatorId
                """, new MapSqlParameterSource().addValue("busId", request.busId())
                .addValue("operatorId", operatorId), Integer.class);
        if (ownedBus == null || ownedBus == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bus not found for this operator.");
        }

        String origin = request.origin().trim();
        String destination = request.destination().trim();
        if (origin.equalsIgnoreCase(destination)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Origin and destination must be different.");
        }
        List<Long> routeIds = jdbc.query("""
                SELECT id FROM route
                WHERE lower(origin) = lower(:origin) AND lower(destination) = lower(:destination)
                ORDER BY id LIMIT 1
                """, new MapSqlParameterSource().addValue("origin", origin).addValue("destination", destination),
                (rs, row) -> rs.getLong("id"));
        long routeId;
        if (routeIds.isEmpty()) {
            String routeName = origin + " to " + destination;
            routeId = jdbc.queryForObject("""
                    INSERT INTO route (name, origin, destination)
                    VALUES (:name, :origin, :destination)
                    RETURNING id
                    """, new MapSqlParameterSource().addValue("name", routeName.substring(0, Math.min(120, routeName.length())))
                    .addValue("origin", origin).addValue("destination", destination), Long.class);
        } else {
            routeId = routeIds.get(0);
        }

        return jdbc.queryForObject("""
                INSERT INTO trip (bus_id, route_id, departure_at, arrival_at, base_fare, status)
                VALUES (:busId, :routeId, :departureAt, :arrivalAt, :fare, 'SCHEDULED')
                RETURNING id
                """, new MapSqlParameterSource().addValue("busId", request.busId()).addValue("routeId", routeId)
                .addValue("departureAt", request.departureAt().atZone(INDIA).toOffsetDateTime())
                .addValue("arrivalAt", request.arrivalAt().atZone(INDIA).toOffsetDateTime())
                .addValue("fare", request.fare()), Long.class);
    }

    public List<TripManagementResponse> trips(HttpServletRequest request) {
        long operatorId = requireOperator(request).operatorId();
        return jdbc.query("""
                SELECT t.id, b.id AS bus_id, b.registration_number, b.bus_type, r.origin, r.destination,
                       t.departure_at, t.arrival_at, t.base_fare, t.status,
                       COALESCE((SELECT string_agg(s.seat_number, ', ' ORDER BY s.seat_number)
                                 FROM blocked_seat blocked JOIN seat s ON s.id = blocked.seat_id
                                 WHERE blocked.trip_id = t.id), '') AS blocked_seats
                FROM trip t
                JOIN bus b ON b.id = t.bus_id
                JOIN route r ON r.id = t.route_id
                WHERE b.operator_id = :operatorId
                ORDER BY t.departure_at DESC
                """, new MapSqlParameterSource("operatorId", operatorId), (rs, row) ->
                new TripManagementResponse(rs.getLong("id"), rs.getLong("bus_id"),
                        rs.getString("registration_number"), rs.getString("bus_type"),
                        rs.getString("origin"), rs.getString("destination"),
                        rs.getObject("departure_at", OffsetDateTime.class),
                        rs.getObject("arrival_at", OffsetDateTime.class), rs.getBigDecimal("base_fare"),
                        rs.getString("status"), rs.getString("blocked_seats")));
    }

    @Transactional
    public void cancelTrip(long tripId, HttpServletRequest request) {
        long operatorId = requireOperator(request).operatorId();
        int updated = jdbc.update("""
                UPDATE trip SET status = 'CANCELLED'
                WHERE id = :tripId AND status = 'SCHEDULED'
                  AND bus_id IN (SELECT id FROM bus WHERE operator_id = :operatorId)
                """, new MapSqlParameterSource().addValue("tripId", tripId).addValue("operatorId", operatorId));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Trip is not available to cancel or does not belong to this operator.");
        }
    }

    @Transactional
    public void blockSeat(long tripId, SeatBlockRequest request, HttpServletRequest httpRequest) {
        OperatorContext context = requireOperator(httpRequest);
        String seatNumber = request.seatNumber().trim().toUpperCase(Locale.ROOT);
        List<Long> seats = jdbc.query("""
                SELECT s.id
                FROM seat s
                JOIN trip t ON t.bus_id = s.bus_id
                JOIN bus b ON b.id = t.bus_id
                WHERE t.id = :tripId AND b.operator_id = :operatorId
                  AND t.status = 'SCHEDULED' AND upper(s.seat_number) = :seatNumber
                                FOR UPDATE OF t, s
                """, new MapSqlParameterSource().addValue("tripId", tripId)
                .addValue("operatorId", context.operatorId()).addValue("seatNumber", seatNumber),
                (rs, row) -> rs.getLong("id"));
        if (seats.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Scheduled trip or seat not found.");
        }

        long seatId = seats.get(0);
        Integer occupied = jdbc.queryForObject("""
                SELECT count(*) FROM seat_allocation
                WHERE trip_id = :tripId AND seat_id = :seatId
                  AND (status = 'CONFIRMED' OR (status = 'HELD' AND expires_at > now()))
                """, new MapSqlParameterSource().addValue("tripId", tripId).addValue("seatId", seatId), Integer.class);
        if (occupied != null && occupied > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A booked or held seat cannot be blocked.");
        }

        try {
            jdbc.update("""
                    INSERT INTO blocked_seat (trip_id, seat_id, blocked_by, reason)
                    VALUES (:tripId, :seatId, :accountId, :reason)
                    """, new MapSqlParameterSource().addValue("tripId", tripId).addValue("seatId", seatId)
                    .addValue("accountId", context.accountId()).addValue("reason", blankToNull(request.reason())));
        } catch (DuplicateKeyException duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That seat is already blocked.");
        }
    }

    @Transactional
    public void unblockSeat(long tripId, String requestedSeatNumber, HttpServletRequest request) {
        long operatorId = requireOperator(request).operatorId();
        int deleted = jdbc.update("""
                DELETE FROM blocked_seat blocked
                USING seat s, trip t, bus b
                WHERE blocked.trip_id = :tripId AND blocked.seat_id = s.id
                  AND t.id = blocked.trip_id AND b.id = t.bus_id AND b.operator_id = :operatorId
                  AND upper(s.seat_number) = :seatNumber
                """, new MapSqlParameterSource().addValue("tripId", tripId).addValue("operatorId", operatorId)
                .addValue("seatNumber", requestedSeatNumber.trim().toUpperCase(Locale.ROOT)));
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Blocked seat not found for this operator.");
        }
    }

    private OperatorContext requireOperator(HttpServletRequest request) {
        long accountId = requireRole(request, "OPERATOR");
        Long operatorId = jdbc.queryForObject("""
                SELECT operator_id FROM app_user WHERE id = :accountId AND role = 'OPERATOR' AND status = 'ACTIVE'
                """, new MapSqlParameterSource("accountId", accountId), Long.class);
        if (operatorId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Operator account is not linked to an operator.");
        }
        return new OperatorContext(accountId, operatorId);
    }

    private long requireRole(HttpServletRequest request, String role) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("accountId") instanceof Long accountId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in first.");
        }
        if (!role.equals(session.getAttribute("accountRole"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account cannot perform that action.");
        }
        return accountId;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record OperatorContext(long accountId, long operatorId) {
    }
}