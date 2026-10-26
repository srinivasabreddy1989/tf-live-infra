INSERT INTO trip (bus_id, route_id, departure_at, arrival_at, base_fare)
SELECT
    service.bus_id,
    route.id,
    (current_date + service.departure_time) AT TIME ZONE 'Asia/Kolkata',
    (current_date + 1 + service.arrival_time) AT TIME ZONE 'Asia/Kolkata',
    (720 + (route.id % 8) * 90)::numeric(10, 2)
FROM route
CROSS JOIN (VALUES
    (1, time '20:30', time '06:30'),
    (2, time '21:15', time '07:00')
) AS service(bus_id, departure_time, arrival_time)
WHERE service.departure_time > (now() AT TIME ZONE 'Asia/Kolkata')::time;

INSERT INTO trip_stop (trip_id, stop_id, stop_sequence, departure_at)
SELECT trip.id, stop.id, 1, trip.departure_at
FROM trip
JOIN route ON route.id = trip.route_id
JOIN stop ON lower(stop.city) = lower(route.origin)
WHERE trip.departure_at::date = current_date
ON CONFLICT (trip_id, stop_sequence) DO NOTHING;

INSERT INTO trip_stop (trip_id, stop_id, stop_sequence, arrival_at)
SELECT trip.id, stop.id, 2, trip.arrival_at
FROM trip
JOIN route ON route.id = trip.route_id
JOIN stop ON lower(stop.city) = lower(route.destination)
WHERE trip.departure_at::date = current_date
ON CONFLICT (trip_id, stop_sequence) DO NOTHING;