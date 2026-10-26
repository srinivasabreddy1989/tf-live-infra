WITH locations(city) AS (
    VALUES
        ('Hyderabad'),
        ('Bengaluru'),
        ('Dharmasthala'),
        ('Mangalore'),
        ('Chikkamagaluru'),
        ('Balehonnur'),
        ('Anantapur'),
        ('Tirupati'),
        ('Mysuru')
)
INSERT INTO route (name, origin, destination)
SELECT origin.city || ' to ' || destination.city, origin.city, destination.city
FROM locations origin
CROSS JOIN locations destination
WHERE origin.city <> destination.city
  AND NOT EXISTS (
      SELECT 1 FROM route existing
      WHERE lower(existing.origin) = lower(origin.city)
        AND lower(existing.destination) = lower(destination.city)
  );

WITH locations(city) AS (
    VALUES
        ('Hyderabad'),
        ('Bengaluru'),
        ('Dharmasthala'),
        ('Mangalore'),
        ('Chikkamagaluru'),
        ('Balehonnur'),
        ('Anantapur'),
        ('Tirupati'),
        ('Mysuru')
)
INSERT INTO stop (name, city, type)
SELECT city || ' Bus Station', city, 'BUS_STATION'
FROM locations location
WHERE NOT EXISTS (
    SELECT 1 FROM stop existing WHERE lower(existing.city) = lower(location.city)
);

INSERT INTO trip (bus_id, route_id, departure_at, arrival_at, base_fare)
SELECT
    service.bus_id,
    route.id,
    (trip_day.day::date + service.departure_time) AT TIME ZONE 'Asia/Kolkata',
    (trip_day.day::date + 1 + service.arrival_time) AT TIME ZONE 'Asia/Kolkata',
    (650 + (route.id % 9) * 85)::numeric(10, 2)
FROM route
CROSS JOIN LATERAL generate_series(
    CASE WHEN route.id = 1 THEN (current_date + 3)::timestamp ELSE (current_date + 1)::timestamp END,
    (current_date + 14)::timestamp,
    interval '1 day'
) AS trip_day(day)
CROSS JOIN (VALUES
    (1, time '20:30', time '06:30'),
    (2, time '21:15', time '07:00')
) AS service(bus_id, departure_time, arrival_time);

INSERT INTO trip_stop (trip_id, stop_id, stop_sequence, departure_at)
SELECT trip.id, stop.id, 1, trip.departure_at
FROM trip
JOIN route ON route.id = trip.route_id
JOIN stop ON lower(stop.city) = lower(route.origin)
ON CONFLICT (trip_id, stop_sequence) DO NOTHING;

INSERT INTO trip_stop (trip_id, stop_id, stop_sequence, arrival_at)
SELECT trip.id, stop.id, 2, trip.arrival_at
FROM trip
JOIN route ON route.id = trip.route_id
JOIN stop ON lower(stop.city) = lower(route.destination)
ON CONFLICT (trip_id, stop_sequence) DO NOTHING;