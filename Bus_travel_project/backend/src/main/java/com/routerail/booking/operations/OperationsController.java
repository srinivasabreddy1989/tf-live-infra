package com.routerail.booking.operations;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/operations")
public class OperationsController {
    private final OperationsService operations;

    public OperationsController(OperationsService operations) {
        this.operations = operations;
    }

    @PostMapping("/operators")
    @ResponseStatus(HttpStatus.CREATED)
    public OperatorAccountResponse createOperator(@Valid @RequestBody CreateOperatorRequest request,
            HttpServletRequest httpRequest) {
        return operations.createOperator(request, httpRequest);
    }

    @GetMapping("/buses")
    public List<BusManagementResponse> buses(HttpServletRequest request) {
        return operations.buses(request);
    }

    @PostMapping("/buses")
    @ResponseStatus(HttpStatus.CREATED)
    public BusManagementResponse addBus(@Valid @RequestBody BusRequest request, HttpServletRequest httpRequest) {
        return operations.addBus(request, httpRequest);
    }

    @PostMapping("/trips")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addSchedule(@Valid @RequestBody ScheduleRequest request,
            HttpServletRequest httpRequest) {
        return Map.of("tripId", operations.addSchedule(request, httpRequest));
    }

    @GetMapping("/trips")
    public List<TripManagementResponse> trips(HttpServletRequest request) {
        return operations.trips(request);
    }

    @PatchMapping("/trips/{tripId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelTrip(@PathVariable long tripId, HttpServletRequest request) {
        operations.cancelTrip(tripId, request);
    }

    @PostMapping("/trips/{tripId}/blocked-seats")
    @ResponseStatus(HttpStatus.CREATED)
    public void blockSeat(@PathVariable long tripId, @Valid @RequestBody SeatBlockRequest request,
            HttpServletRequest httpRequest) {
        operations.blockSeat(tripId, request, httpRequest);
    }

    @DeleteMapping("/trips/{tripId}/blocked-seats")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblockSeat(@PathVariable long tripId, @RequestParam String seatNumber,
            HttpServletRequest request) {
        operations.unblockSeat(tripId, seatNumber, request);
    }
}