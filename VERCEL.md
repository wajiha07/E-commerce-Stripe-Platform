# Deploy LUNAIRE on Vercel

This monorepo deploys as **two Vercel projects** linked to the same GitHub repo:

| Project | Root Directory | Framework |
|---------|----------------|-----------|
| `lunaire-api` | `apps/api` | NestJS |
| `lunaire-web` | `apps/web` | Vite |

You also need a hosted Postgres (Neon, Supabase, or Vercel Postgres).

## 1. Database (Neon recommended)

1. Create a free project at https://console.neon.tech  
2. Copy the connection string (`DATABASE_URL`)  
3. Run migrations from your machine:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate -w @lunaire/api
DATABASE_URL="postgresql://..." npm run db:seed -w @lunaire/api
```

## 2. Deploy API

```bash
cd apps/api
vercel link   # create project lunaire-api, set root apps/api
vercel env add DATABASE_URL
vercel env add JWT_ACCESS_SECRET
vercel env add JWT_REFRESH_SECRET
vercel env add COOKIE_SECRET
vercel env add WEB_ORIGIN          # https://your-web.vercel.app
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add PLATFORM_FEE_PERCENT
vercel env add NODE_ENV            # production
vercel --prod
```

## 3. Deploy Web

```bash
cd apps/web
# Set VITE_API_URL=https://lunaire-api-xxx.vercel.app/api
# Set VITE_STRIPE_PUBLISHABLE_KEY=pk_...
vercel link
vercel env add VITE_API_URL
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel --prod
```

Then update API `WEB_ORIGIN` to the web production URL and redeploy API.

## 4. Stripe webhook

Endpoint: `https://<api-domain>/api/payments/webhook`  
Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`

## Notes

- NestJS runs as a Vercel Function (Fluid compute).
- Use a pooled Neon URL (`?sslmode=require`) for serverless.
- Mock payments only work when Stripe keys contain placeholders — use real `sk_test_` keys on Vercel.
