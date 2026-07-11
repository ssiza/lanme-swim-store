# Medusa backend for Railway (Dockerfile builder).
# Build context must be the monorepo root (do not set Railway Root Directory).
# Ops scripts under apps/backend/scripts are bundled into .medusa/server at build time.
# Secrets stay runtime-only — not baked into the image.

FROM node:20-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/

# Backend-only workspace so storefront React 19 is not hoisted into the admin build.
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.workspaces=['apps/backend'];fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

RUN npm ci --include=dev --legacy-peer-deps

COPY apps/backend ./apps/backend

ENV NODE_ENV=development
RUN npm run build --workspace=@dtc/backend

WORKDIR /app/apps/backend/.medusa/server
RUN npm install --omit=dev --legacy-peer-deps
# Publish TypeScript source at /medusa/scripts for ops visibility; run compiled JS from src/scripts.
ARG INVENTORY_SCRIPT_CACHE_BUST=2026-06-25-v6
RUN echo "inventory-script:${INVENTORY_SCRIPT_CACHE_BUST}" \
    && node ../../src/scripts/sync-generate-inventory-script.mjs

FROM node:20-bookworm-slim AS runner
# Avoid collision with Medusa admin route path (/app).
WORKDIR /medusa
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/apps/backend/.medusa/server ./

EXPOSE 9000
# Migrate on boot so first deploy works even if Railway preDeploy/start overrides are unset.
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
