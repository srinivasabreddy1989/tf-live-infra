package com.routerail.booking.auth;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountBootstrap implements ApplicationRunner {
    private final NamedParameterJdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminAccountBootstrap(NamedParameterJdbcTemplate jdbc, PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String email,
            @Value("${app.admin.password:}") String password) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank()) {
            return;
        }
        Integer existingAdmin = jdbc.queryForObject("""
                SELECT count(*) FROM app_user WHERE lower(email) = :email AND role = 'ADMIN'
                """, new MapSqlParameterSource("email", email), Integer.class);
        if (existingAdmin != null && existingAdmin > 0) {
            return;
        }
        Integer existingAccount = jdbc.queryForObject("""
                SELECT count(*) FROM app_user WHERE lower(email) = :email
                """, new MapSqlParameterSource("email", email), Integer.class);
        if (existingAccount != null && existingAccount > 0) {
            throw new IllegalStateException("Configured owner email is already used by a non-admin account.");
        }
        jdbc.update("""
                INSERT INTO app_user (full_name, email, password_hash, role, status)
                VALUES ('SSRAM Owner', :email, :passwordHash, 'ADMIN', 'ACTIVE')
                """, new MapSqlParameterSource().addValue("email", email)
                .addValue("passwordHash", passwordEncoder.encode(password)));
    }
}
