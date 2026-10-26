package com.routerail.booking.auth;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class CustomerAuthController {
    private final CustomerAuthService auth;

    public CustomerAuthController(CustomerAuthService auth) {
        this.auth = auth;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/signup")
    public CustomerResponse signUp(@Valid @RequestBody SignUpRequest request, HttpServletRequest httpRequest) {
        return auth.signUp(request, httpRequest);
    }

    @PostMapping("/login")
    public CustomerResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return auth.login(request, httpRequest);
    }

    @PostMapping("/operator/login")
    public AccountResponse operatorLogin(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return auth.loginStaff(request, "OPERATOR", httpRequest);
    }

    @PostMapping("/admin/login")
    public AccountResponse adminLogin(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return auth.loginStaff(request, "ADMIN", httpRequest);
    }

    @GetMapping("/me")
    public ResponseEntity<AccountResponse> currentAccount(HttpServletRequest request) {
        return auth.currentAccount(request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request) {
        auth.logout(request);
        return Map.of("status", "SIGNED_OUT");
    }
}