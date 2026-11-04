# Booking Service

REST API for a book catalog and date-based book reservations.
A book cannot be reserved twice for overlapping dates.

**Stack:** Node.js, TypeScript, Express 5, PostgreSQL, Swagger, Docker

## Run

With Docker:

```bash
docker compose up
```

API: http://localhost:3080 · Swagger: http://localhost:3080/api-docs

Locally (PostgreSQL 13+ required):

```bash
npm install
npm run migrate
npm run dev
```

Environment variables (`.env`):

| Variable | Example |
|---|---|
| `SERVER_PORT` | `3080` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `bookingdb` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | — |

## API

Books

| Method | Path | |
|---|---|---|
| GET | `/books` | all books |
| GET | `/book/:id` | one book |
| POST | `/create/book` | create: `title`, `author`, `year`, `price` |
| PUT | `/book/:id` | update |
| DELETE | `/delete/book/:id` | delete (its reservations are deleted too) |

Reservations

| Method | Path | |
|---|---|---|
| POST | `/books/:id/reservations` | reserve: `customerName`, `startDate`, `endDate` |
| GET | `/books/:id/availability?from=&to=` | is the book free on these dates |
| GET | `/reservations?bookId=` | all reservations or one book's |
| GET | `/reservations/:id` | one reservation |
| PATCH | `/reservations/:id/cancel` | cancel |

```bash
curl -X POST localhost:3080/books/1/reservations \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"Henadzi","startDate":"2026-12-01","endDate":"2026-12-05"}'
```

## Reservation rules

- Dates are `YYYY-MM-DD`, both inclusive; the start cannot be in the past, the end cannot be before the start.
- Overlapping active reservations of the same book are rejected with `409` and the conflicting reservations.
  The database enforces this (`EXCLUDE` constraint), so parallel requests cannot both succeed.
- A cancelled reservation frees its dates.

| Status | When |
|---|---|
| 201 | created |
| 400 | invalid id, name or dates |
| 404 | book or reservation not found |
| 409 | dates overlap; reservation already cancelled |

## Check double booking by hand

With an active reservation of book 1 for `2026-12-01`…`2026-12-05`:

| Request dates | Expected |
|---|---|
| `12-02`…`12-03` (inside) | 409 |
| `12-05`…`12-07` (same last day) | 409 |
| `11-28`…`12-10` (covers it) | 409 |
| `12-06`…`12-06` (next day) | 201 |
| same dates after `PATCH /reservations/:id/cancel` | 201 |

Parallel requests for the same free dates: exactly one `201`, the rest `409`.

```bash
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3080/books/1/reservations \
    -H 'Content-Type: application/json' \
    -d '{"customerName":"Race","startDate":"2026-12-20","endDate":"2026-12-22"}' &
done; wait
```

## Database

| Table | Columns |
|---|---|
| `books` | `id`, `title`, `author`, `year`, `price`, `created_at` |
| `reservations` | `id`, `book_id` → `books.id`, `customer_name`, `start_date`, `end_date`, `status` (`active` / `cancelled`), `created_at` |

Migrations are plain SQL files in `src/migrations`, applied in order by `npm run migrate`
and recorded in the `migrations` table. New one: `npm run migrate:create <name>`.

## Project structure

```
src/
  app.ts            routes, validation, Swagger docs
  server.ts         starts the HTTP server
  DataBase/bd.ts    PostgreSQL queries
  config/swagger.ts OpenAPI setup and schemas
  migrations/       SQL migrations 001-005
  scripts/          migrate, create-migration
Interfases/         TypeScript interfaces
utils/logger.ts     winston logger
```

## Known issues

- `PUT /book/:id` saves only `title`; `author`, `year` and `price` are ignored.
- `GET /books` prints DB connection settings, including the password, to the console.
- `id` fields are returned as strings (`"1"`), not numbers.
- No automated tests yet.
