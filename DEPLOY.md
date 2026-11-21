# Production deployment

## Architecture

Single container (or compose stack) runs:

- NestJS API on port 3000 (`/api/*`)
- React SPA static files + SPA fallback for client routes
- PostgreSQL (Compose service)

Payments: **Stripe Connect** destination charges + application fee. Never store card data.

## Prerequisites

- Docker + Docker Compose
- Stripe account with **Connect** enabled
- Domain + TLS terminator (Cloudflare, nginx, load balancer, or Caddy)

## 1. Configure secrets

```bash
cp .env.production.example .env.production
# Edit .env.production — set strong passwords/secrets and real Stripe keys
```

Required:

| Variable | Notes |
|----------|--------|
| `POSTGRES_PASSWORD` | Strong DB password |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ≥32 random chars |
| `COOKIE_SECRET` | ≥32 random chars |
| `WEB_ORIGIN` | Public HTTPS origin, e.g. `https://shop.example.com` |
| `STRIPE_*` | Live or test keys + webhook secret (**no placeholders**) |

## 2. Stripe webhooks (production)

In Stripe Dashboard → Developers → Webhooks:

- Endpoint: `https://your-domain.com/api/payments/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `charge.refunded`

## 3. Launch

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Health:

```bash
curl -fsS https://your-domain.com/api/health
```

## 4. First admin / seed (optional)

Seed is **not** run automatically in production. To bootstrap demo data in a staging environment only:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec api \
  npx tsx prisma/seed.ts
```

Prefer creating a real admin manually for production.

## 5. TLS

Terminate HTTPS in front of the container (recommended). Point `WEB_ORIGIN` at the public HTTPS URL. Forward `X-Forwarded-*` if your proxy supports it.

## 6. Operations checklist

- [ ] `NODE_ENV=production`
- [ ] Real Stripe keys; mock payment endpoint returns 401/400
- [ ] DB backups scheduled
- [ ] Webhook signature secret configured
- [ ] CORS `WEB_ORIGIN` matches the public site
- [ ] Health checks pass (`/api/health`, `/api/health/ready`)
- [ ] Platform fee `PLATFORM_FEE_PERCENT` reviewed
- [ ] Seller Connect onboarding tested in Stripe test mode first

## 7. Useful commands

```bash
# logs
docker compose -f docker-compose.prod.yml logs -f api

# migrate only
docker compose -f docker-compose.prod.yml --env-file .env.production exec api \
  npx prisma migrate deploy

# stop
docker compose -f docker-compose.prod.yml down
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs install, migrate, test, and build on `main` PRs/pushes.
