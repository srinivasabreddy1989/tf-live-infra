ALTER TABLE app_user
    ADD COLUMN operator_id BIGINT REFERENCES operator(id);

CREATE INDEX app_user_operator_id_idx ON app_user (operator_id);

CREATE TABLE blocked_seat (
    trip_id BIGINT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL REFERENCES seat(id),
    blocked_by BIGINT NOT NULL REFERENCES app_user(id),
    reason VARCHAR(160),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (trip_id, seat_id)
);