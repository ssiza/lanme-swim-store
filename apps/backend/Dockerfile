# Lanme Swim backend for Railway (Dockerfile builder).
# Build context must be the monorepo root (do not set Railway Root Directory).
# Ops scripts under apps/backend/scripts are bundled into .medusa/server at build time.
# Secrets stay runtime-only — not baked into the image.

FROM node:20-bookworm AS build
WORKDIR /app

# Railway / shared CI IPs often hit npm registry 429s on the second install
# (.medusa/server). Raise retries/timeouts for the whole build stage.
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=300000 \
    NPM_CONFIG_MAXSOCKETS=10

COPY package.json package-lock.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/

# Backend-only workspace so storefront React 19 is not hoisted into the admin build.
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.workspaces=['apps/backend'];fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

RUN npm ci --include=dev --legacy-peer-deps

COPY apps/backend ./apps/backend

ENV NODE_ENV=development
RUN npm run build --workspace=@dtc/backend

WORKDIR /app/apps/backend/.medusa/server
# Prefer the npm cache filled by `npm ci` above; retry transient registry 429s.
RUN set -eu; \
  for attempt in 1 2 3 4 5; do \
    if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
      if npm ci --omit=dev --legacy-peer-deps --prefer-offline --no-audit --no-fund; then \
        exit 0; \
      fi; \
    else \
      if npm install --omit=dev --legacy-peer-deps --prefer-offline --no-audit --no-fund; then \
        exit 0; \
      fi; \
    fi; \
    echo "npm install in .medusa/server failed (attempt ${attempt}/5); backing off..."; \
    sleep $((attempt * 20)); \
  done; \
  echo "npm install in .medusa/server failed after 5 attempts"; \
  exit 1
# Publish TypeScript source at /medusa/scripts for ops visibility; run compiled JS from src/scripts.
ARG INVENTORY_SCRIPT_CACHE_BUST=2026-06-25-v6
RUN echo "inventory-script:${INVENTORY_SCRIPT_CACHE_BUST}" \
    && node ../../src/scripts/sync-generate-inventory-script.mjs

FROM node:20-bookworm-slim AS runner
# Avoid collision with Lanme Swim admin route path (/app).
WORKDIR /medusa
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/apps/backend/.medusa/server ./

EXPOSE 9000
# Migrate on boot so first deploy works even if Railway preDeploy/start overrides are unset.
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
