# LUNAIRE — Premium Fashion E-commerce Monolith

Monolithic NestJS + React e-commerce application for the **LUNAIRE** contemporary fashion house. PostgreSQL, Prisma, Stripe Payment Intents (with local mock fallback), customer storefront, and integrated admin dashboard.

## Stack

- **Frontend:** React 19 + Vite + React Router + TanStack Query
- **Backend:** NestJS (monolith API + static SPA in production)
- **Database:** PostgreSQL + Prisma
- **Payments:** Stripe Payment Intents + webhook signature verification (mock confirm in local/dev when keys are placeholders)

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
| Customer | customer@lunaire.test | Password123!   |

Coupons: `LUNAIRE10`, `WELCOME25`

## Stripe

1. Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` to `apps/api/.env`
2. Set `VITE_STRIPE_PUBLISHABLE_KEY` in `apps/web/.env`
3. Forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

If keys contain `placeholder`, checkout uses **mock payment confirmation** (no card data). Card numbers are never stored by the app.

Test card (real Stripe test mode): `4242 4242 4242 4242`

## Production build

```bash
npm run build
npm run start
```

Nest serves the built React app from `apps/web/dist` and exposes `/api/*`.

## Project layout

```
apps/api   NestJS API, Prisma, Stripe, RBAC
apps/web   React storefront + /admin dashboard
```

## Image attribution

Product and lifestyle imagery uses [Unsplash](https://unsplash.com) URLs (license-friendly for demos). Replace with your own assets for production.

## Manual verification checklist

- [ ] Browse home → shop filters → product PDP → add to bag  
- [ ] Checkout (mock or Stripe) → order confirmation  
- [ ] Customer order history / track order  
- [ ] Admin login → dashboard, products, orders, refunds  
- [ ] Coupons, shipping, CMS banners, reports, staff roles  

## Security notes

- Passwords hashed with bcrypt  
- JWT access + rotating refresh tokens  
- Role-based access for admin routes  
- Helmet, validation pipes, rate limiting  
- Stripe webhook signature verification  
- No PAN/CVV persistence  
