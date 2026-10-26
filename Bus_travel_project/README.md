# Route & Rail Bus Booking

A local-first bus booking MVP based on the supplied architecture diagram: React + TypeScript, a modular Spring Boot API, PostgreSQL, and Docker Compose.

## Run locally

1. Install and start Docker Desktop with the Linux container engine enabled.
2. From this folder, run:

   ```powershell
   docker compose up --build
   ```

3. Open <http://localhost:8080>.
4. Search Hyderabad to Bengaluru for tomorrow. The migration seeds sample trips and seats.

The local owner account is `owner@ssram.local` with password `ChangeThisOwner123!`. Change `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD` in `.env` before the first startup if you need different credentials. These defaults are for local development only; do not expose them publicly.

The first build downloads the base images and Maven/npm dependencies. The database is persisted in the `postgres_data` volume. To stop the services, press `Ctrl+C`, then run `docker compose down`. To erase local database data as well, run `docker compose down -v`.

The defaults are for local development only. To override them, copy `.env.example` to `.env` and update the values.

## Project layout

```text
backend/       Spring Boot REST API, SQL migration, backend container
frontend/      React customer booking UI, Nginx config, frontend container
docker-compose.yml
.env.example
```

## Included flow

- Search scheduled trips by origin, destination, and date.
- Display current seat availability and let customers choose seats.
- Create a 10-minute pending booking hold in a database transaction.
- Confirm the booking through a local mock payment endpoint.
- Expire stale holds and prevent simultaneous requests from reserving the same seat.
- Sign in as the owner to create operator accounts. Operators can add buses, schedule and cancel trips, and block or unblock seats.
- Operator seat blocks are saved per trip and excluded from customer seat availability and booking holds.

## API routes

- `GET /api/health`
- `GET /api/trips?origin=Hyderabad&destination=Bengaluru&date=YYYY-MM-DD`
- `GET /api/trips/{tripId}/seats`
- `POST /api/bookings/hold`
- `POST /api/payments/mock/{bookingId}/confirm`

The payment flow is a local simulation and does not charge a card. Notifications, customer trip cancellations/refunds, and a real payment provider are not implemented. Customer, operator, and admin authentication is available, but these local-development defaults and the rest of the MVP are not production-hardened. Do not expose this application publicly without changing credentials and adding production security/deployment configuration.