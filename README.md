# Appointment Booking App

Multi-tenant appointment scheduling for businesses, staff, and customers.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for containerized run)
- Node.js 18+ (for local development without Docker)

## Quick start with Docker

1. Install **Docker Desktop** and ensure it is running.

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set at least `JWT_SECRET`. Add Stripe/Resend keys if you use payments or email.

3. Start the full stack:
   ```bash
   docker compose up --build
   ```

4. Open the app:
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5000/api
   - **Prisma Studio:** http://localhost:5555

The frontend nginx container proxies `/api` to the backend, so the browser uses a single origin.

## Local development (without Docker)

### Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env — use localhost for DATABASE_URL and REDIS_URL
npm install
npx prisma migrate deploy
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs at http://localhost:3000 with API at http://localhost:5000/api (configured in `src/api/axios.js`).

### Database & Redis

Use `docker compose up postgres redis` from the project root, or run Postgres and Redis locally.

## Sprint 9 features

- **Audit logs:** Admin → Audit Logs; service edits, cancellations, reschedules, config changes
- **Analytics:** Dashboard shows cancellation rate and bookings-per-day chart
- **Security:** Zod validation on API routes; booking/service ownership checks per business
- **Admin bootstrap:** One `/api/analytics/bootstrap` call loads dashboard, services, staff, customers, finance

## Useful commands

```bash
# Rebuild after code changes
docker compose up --build

# Stop and remove containers
docker compose down

# View logs
docker compose logs -f backend
```
