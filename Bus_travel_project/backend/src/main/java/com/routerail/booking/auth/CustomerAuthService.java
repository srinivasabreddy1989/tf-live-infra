package com.routerail.booking.auth;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

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
public class CustomerAuthService {
    private final NamedParameterJdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public CustomerAuthService(NamedParameterJdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CustomerResponse signUp(SignUpRequest request, HttpServletRequest httpRequest) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match.");
        }

        String email = normalizeEmail(request.email());
        var parameters = new MapSqlParameterSource()
                .addValue("fullName", request.fullName().trim())
                .addValue("dateOfBirth", request.dateOfBirth())
                .addValue("email", email)
                .addValue("passwordHash", passwordEncoder.encode(request.password()));
        try {
            Long id = jdbc.queryForObject("""
                    INSERT INTO app_user (full_name, date_of_birth, email, password_hash, role, status)
                    VALUES (:fullName, :dateOfBirth, :email, :passwordHash, 'CUSTOMER', 'ACTIVE')
                    RETURNING id
                    """, parameters, Long.class);
            CustomerResponse customer = new CustomerResponse(id, request.fullName().trim(), email, request.dateOfBirth());
            establishSession(httpRequest, customer.id(), "CUSTOMER", null);
            return customer;
        } catch (DuplicateKeyException duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
    }

    public CustomerResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = normalizeEmail(request.email());
        var matches = jdbc.query("""
                SELECT id, full_name, email, date_of_birth, password_hash, status
                FROM app_user
                WHERE lower(email) = :email AND role = 'CUSTOMER'
                """, new MapSqlParameterSource("email", email), (rs, row) -> new StoredCustomer(
                rs.getLong("id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getObject("date_of_birth", LocalDate.class),
                rs.getString("password_hash"),
                rs.getString("status")));

        if (matches.isEmpty()) {
            throw invalidCredentials();
        }
        StoredCustomer account = matches.get(0);
        if (!"ACTIVE".equals(account.status()) || account.passwordHash() == null
                || !passwordEncoder.matches(request.password(), account.passwordHash())) {
            throw invalidCredentials();
        }

        establishSession(httpRequest, account.id(), "CUSTOMER", null);
        return account.toResponse();
    }

    public AccountResponse loginStaff(LoginRequest request, String role, HttpServletRequest httpRequest) {
        if (!"OPERATOR".equals(role) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported account role.");
        }

        var matches = jdbc.query("""
                SELECT id, full_name, email, date_of_birth, password_hash, status, operator_id
                FROM app_user
                WHERE lower(email) = :email AND role = :role
                """, new MapSqlParameterSource().addValue("email", normalizeEmail(request.email()))
                .addValue("role", role), (rs, row) -> new StaffAccount(
                rs.getLong("id"), rs.getString("full_name"), rs.getString("email"),
                rs.getObject("date_of_birth", LocalDate.class), rs.getString("password_hash"),
                rs.getString("status"), rs.getObject("operator_id", Long.class)));

        if (matches.isEmpty()) {
            throw invalidCredentials();
        }
        StaffAccount account = matches.get(0);
        if (!"ACTIVE".equals(account.status()) || account.passwordHash() == null
                || !passwordEncoder.matches(request.password(), account.passwordHash())
                || ("OPERATOR".equals(role) && account.operatorId() == null)) {
            throw invalidCredentials();
        }

        establishSession(httpRequest, account.id(), role, account.operatorId());
        return new AccountResponse(account.id(), account.fullName(), account.email(), role, account.dateOfBirth());
    }

    public Optional<AccountResponse> currentAccount(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("accountId") instanceof Long accountId)
                || !(session.getAttribute("accountRole") instanceof String role)) {
            return Optional.empty();
        }

        List<AccountResponse> accounts = jdbc.query("""
                SELECT id, full_name, email, date_of_birth, role
                FROM app_user
                WHERE id = :id AND role = :role AND status = 'ACTIVE'
                """, new MapSqlParameterSource().addValue("id", accountId).addValue("role", role),
                (rs, row) -> new AccountResponse(rs.getLong("id"), rs.getString("full_name"),
                        rs.getString("email"), rs.getString("role"),
                        rs.getObject("date_of_birth", LocalDate.class)));
        return accounts.stream().findFirst();
    }

    public Optional<CustomerResponse> currentCustomer(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("customerId") instanceof Long customerId)) {
            return Optional.empty();
        }

        List<CustomerResponse> customers = jdbc.query("""
                SELECT id, full_name, email, date_of_birth
                FROM app_user
                WHERE id = :id AND role = 'CUSTOMER' AND status = 'ACTIVE'
                """, new MapSqlParameterSource("id", customerId), (rs, row) -> new CustomerResponse(
                rs.getLong("id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getObject("date_of_birth", LocalDate.class)));
        return customers.stream().findFirst();
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    private void establishSession(HttpServletRequest request, long accountId, String role, Long operatorId) {
        request.getSession(true);
        request.changeSessionId();
        HttpSession session = request.getSession(false);
        session.setAttribute("accountId", accountId);
        session.setAttribute("accountRole", role);
        if ("CUSTOMER".equals(role)) {
            session.setAttribute("customerId", accountId);
        }
        if (operatorId != null) {
            session.setAttribute("operatorId", operatorId);
        }
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
    }

    private record StoredCustomer(long id, String fullName, String email, LocalDate dateOfBirth,
            String passwordHash, String status) {
        CustomerResponse toResponse() {
            return new CustomerResponse(id, fullName, email, dateOfBirth);
        }
    }

    private record StaffAccount(long id, String fullName, String email, LocalDate dateOfBirth,
            String passwordHash, String status, Long operatorId) {
    }
}