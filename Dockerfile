# Monorepo production image: Nest API + React SPA
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM deps AS build
COPY apps/api apps/api
COPY apps/web apps/web
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma \
  && npm run build -w @lunaire/web \
  && npm run build -w @lunaire/api

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl curl \
  && addgroup -S lunaire && adduser -S lunaire -G lunaire

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev && npm cache clean --force

COPY apps/api/prisma apps/api/prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/api/public

USER lunaire
WORKDIR /app/apps/api
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health/live || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
