# LUNAIRE — Premium Fashion E-commerce Monolith

Monolithic NestJS + React e-commerce **Stripe Connect platform** for **LUNAIRE**. Sellers onboard with Connect Express; checkout uses destination charges with an application fee. PostgreSQL, Prisma, customer storefront, seller portal, and admin dashboard.

## Stack

- **Frontend:** React 19 + Vite + React Router + TanStack Query
- **Backend:** NestJS (monolith API + static SPA in production)
- **Database:** PostgreSQL + Prisma
- **Payments:** Stripe Connect Express + Payment Intents (destination charges + application fee), webhook verification (mock Connect/payment when keys are placeholders)

## Quick start

### 1. Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 2. Start database

**Option A — Docker**

```bash
docker compose up -d
```

**Option B — Homebrew PostgreSQL** (if Docker is unavailable)

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s lunaire || true
createdb -O lunaire lunaire || true
psql -d lunaire -c "ALTER USER lunaire WITH PASSWORD 'lunaire';"
```

### 3. Install & configure

```bash
npm install
cp .env.example apps/api/.env   # already seeded with local defaults in apps/api/.env
# Optional: set real Stripe keys in apps/api/.env and apps/web/.env
```

### 4. Migrate & seed

```bash
npm run db:generate
npm run db:migrate:dev -w @lunaire/api -- --name init
# or after first migration exists:
npm run db:migrate
npm run db:seed
```

### 5. Run (development)

```bash
npm run dev
```

- Storefront: http://localhost:5173  
- API: http://localhost:3000/api  
- Admin: http://localhost:5173/admin  

### Demo accounts

| Role     | Email                 | Password       |
|----------|-----------------------|----------------|
| Admin    | admin@lunaire.test    | Password123!   |
| Manager  | manager@lunaire.test  | Password123!   |
| Support  | support@lunaire.test  | Password123!   |
| Seller   | seller@lunaire.test   | Password123!   |
| Customer | customer@lunaire.test | Password123!   |

Coupons: `LUNAIRE10`, `WELCOME25`

Seller portal: http://localhost:5173/seller  
Become a seller: http://localhost:5173/sell  

**Checkout rule:** one seller per cart/checkout (Connect destination charges).

## Stripe Connect

1. Enable **Connect** in your Stripe Dashboard (Express accounts)
2. Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and optional `PLATFORM_FEE_PERCENT` (default `10`) to `apps/api/.env`
3. Set `VITE_STRIPE_PUBLISHABLE_KEY` in `apps/web/.env`
4. Forward webhooks (include Connect events such as `account.updated`):

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

If keys contain `placeholder`, seller onboarding and checkout use **mock Connect + mock payment** (no card data). Card numbers are never stored by the app.

Test card (real Stripe test mode): `4242 4242 4242 4242`

Payment model: customer pays the platform PaymentIntent with `transfer_data.destination` = seller Connect account and `application_fee_amount` = platform commission.

## Production

See **[DEPLOY.md](DEPLOY.md)** for full production deployment (Docker Compose, secrets, Stripe webhooks, TLS).

Quick local production image:

```bash
cp .env.production.example .env.production
# fill real secrets + Stripe keys
npm run docker:prod
```

Or build/run without Docker:

```bash
npm run build
NODE_ENV=production npm run start
```

Nest serves the React SPA and `/api/*` from one process. Health: `GET /api/health`.

Production hardening includes: env validation, Helmet CSP, stricter rate limits on auth, request IDs + structured HTTP logs, graceful shutdown, mock-payment disabled, SPA fallback, CI workflow, and Compose healthchecks.

## Project layout

```
apps/api   NestJS API, Prisma, Stripe, RBAC
apps/web   React storefront + /admin dashboard
```

## Image attribution

Product and lifestyle imagery uses [Unsplash](https://unsplash.com) URLs (license-friendly for demos). Replace with your own assets for production.

## Manual verification checklist

- [ ] Browse home → shop filters → product PDP → add to bag  
- [ ] Checkout (mock or Stripe Connect) → order confirmation  
- [ ] Customer order history / track order  
- [ ] Seller login → Connect onboarding → products → orders  
- [ ] Admin login → sellers, dashboard, products, orders, refunds  
- [ ] Coupons, shipping, CMS banners, reports, staff roles  

## Security notes

- Passwords hashed with bcrypt  
- JWT access + rotating refresh tokens  
- Role-based access for admin routes  
- Helmet, validation pipes, rate limiting  
- Stripe webhook signature verification  
- No PAN/CVV persistence  
