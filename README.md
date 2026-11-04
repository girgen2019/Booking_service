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

## Database

Migrations are plain SQL files in `src/migrations`, applied in order by `npm run migrate`
and recorded in the `migrations` table. New one: `npm run migrate:create <name>`.

## Known issues

- `PUT /book/:id` saves only `title`; `author`, `year` and `price` are ignored.
- `GET /books` prints DB connection settings, including the password, to the console.
- `id` fields are returned as strings (`"1"`), not numbers.
- No automated tests yet.
