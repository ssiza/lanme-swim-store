# Next.js storefront for Railway (Dockerfile builder).
# Build context must be the monorepo root (do not set Railway Root Directory).
# Installs storefront workspace only — avoids pulling the full Medusa backend into the image.
#
# Railway: each NEXT_PUBLIC_* variable must be set on the storefront service AND
# toggled "Available at Build Time" (Variables → ⋮ → Available at Build Time).

FROM node:20-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/storefront/package.json ./apps/storefront/

# Storefront-only install (much faster than full monorepo npm ci).
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.workspaces=['apps/storefront'];fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

RUN npm ci --include=dev --legacy-peer-deps

COPY apps/storefront ./apps/storefront

# Railway passes service variables as Docker build-args when ARG names match.
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=us
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_S3_PUBLIC_URL
ARG NEXT_PUBLIC_STRIPE_KEY

ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_S3_PUBLIC_URL=$NEXT_PUBLIC_S3_PUBLIC_URL \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY

WORKDIR /app/apps/storefront

RUN if [ -z "$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" ] || [ -z "$NEXT_PUBLIC_MEDUSA_BACKEND_URL" ]; then \
      echo "ERROR: NEXT_PUBLIC_* vars were not passed into the Docker build."; \
      echo "In Railway: open each variable menu and enable 'Available at Build Time'."; \
      exit 1; \
    fi

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Railway injects PORT at runtime — do not hardcode it or healthchecks will miss the server.
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/apps/storefront/.next/standalone ./
COPY --from=build /app/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=build /app/apps/storefront/public ./apps/storefront/public

WORKDIR /app/apps/storefront

EXPOSE 8080

CMD ["node", "server.js"]
