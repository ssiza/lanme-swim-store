<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Lanmè Swim Store
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/develop/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Medusa is released under the MIT license." />
  </a>
  <a href="https://circleci.com/gh/medusajs/medusa">
    <img src="https://circleci.com/gh/medusajs/medusa.svg?style=shield" alt="Current CircleCI build status." />
  </a>
  <a href="https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

# Lanmè Swim Store

Direct-to-consumer swimwear store for **Lanmè Swim** — bikinis, one-pieces, and beach essentials. Built on Medusa and Next.js with product browsing, cart, checkout, customer accounts, and order management.

> Forked from the Fanarc store monorepo. Configure your own environment variables (Stripe, Resend, S3, database, etc.) before deploying.

## Features

- All of [Medusa's commerce features](https://docs.medusajs.com/resources/commerce-modules)
- Multi-region support with automatic country detection
- Product catalog with variant selection
- Cart with promotion codes
- Multi-step checkout with shipping and payment
- Customer accounts with order history and address management
- Order transfer between accounts

## Getting Started

### Deploy with Medusa Cloud

The fastest way to get started is deploying with [Medusa Cloud](https://cloud.medusajs.com):

1. [Create a Medusa Cloud account](https://cloud.medusajs.com)
2. Deploy this starter directly from your dashboard

### Local Installation

> **Prerequisites:
>
> - [Node.js](https://nodejs.org/) v20+
> - [PostgreSQL](https://www.postgresql.org/) v15+
> - [pnpm](https://pnpm.io/) v10+

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/medusajs/dtc-starter.git
cd dtc-starter
pnpm install
```

2. Set up environment variables for the backend:

```bash
cp apps/backend/.env.template apps/backend/.env
```

3. Set the database URL in `apps/backend.env`:

```bash
# Replace with actual database URL, make sure the database exists.
DATABASE_URL=postgres://postgres:@localhost:5432/medusa-dtc-starter
```

4. Run migrations:

```bash
cd apps/backend
pnpm medusa db:migrate
```

5. Add admin user:

```bash
cd apps/backend
pnpm medusa user -e admin@test.com -p supersecret
```

6. Start Medusa backend:

```bash
cd apps/backend
pnpm dev
```

7. Open the admin dashboard at `localhost:9000/app` and log in. Retrieve your publishable API key at Settings > Publishable API key.

8. Set up environment variables for the storefront:

```bash
cp apps/storefront/.env.template apps/storefront/.env.local
```

9. Update `apps/storefront/.env.local` with your Medusa publishable API key:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_6c3...
```

10.  Start storefront:

```bash
cd apps/storefront
pnpm dev
```

The storefront runs on `http://localhost:8000`.

You can slo run the following command from the root to start both backend and storefront:

```bash
pnpm dev
```

## Configuration

The storefront is configured via environment variables in `apps/storefront/.env.local`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key from your Medusa backend | — |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL of your Medusa backend | `http://localhost:9000` |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region country code | `us` |
| `NEXT_PUBLIC_BASE_URL` | Base URL of the storefront | `https://localhost:8000` |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key (required when Stripe is enabled on a region) | — |

## Stripe payments

Stripe is wired through Medusa's native payment module. The backend registers the Stripe provider only when `STRIPE_API_KEY` is set; until then, manual/system payment continues to work.

### Environment variables

**Backend** (`apps/backend/.env`):

| Variable | Description |
|----------|-------------|
| `STRIPE_API_KEY` | Stripe secret key (`sk_test_...` / `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |

**Storefront** (`apps/storefront/.env.local`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key (`pk_test_...` / `pk_live_...`) |

### Enable Stripe in Admin

Seed data enables manual payment only (`pp_system_default`). After setting Stripe env vars and restarting the backend:

1. Open Medusa Admin (`http://localhost:9000/app`).
2. Go to **Settings → Regions**.
3. Open your region (e.g. Europe).
4. Under **Payment Providers**, add **Stripe** (`pp_stripe_stripe`).
5. Keep **System (Manual)** enabled if you still want manual payments in development.
6. Save the region.

The storefront payment registry already supports `pp_stripe_*` providers — no checkout code changes are needed once the region is configured.

### Stripe webhooks

Medusa exposes a built-in webhook endpoint (no custom routes required):

```
POST {MEDUSA_BACKEND_URL}/hooks/payment/stripe_stripe
```

For the default Stripe provider (`id: "stripe"` in `medusa-config.ts`), the path segment is `stripe_stripe` (maps to provider ID `pp_stripe_stripe`).

**Recommended Stripe events** (payment intent lifecycle):

- `payment_intent.created`
- `payment_intent.processing`
- `payment_intent.requires_action`
- `payment_intent.amount_capturable_updated`
- `payment_intent.partially_funded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.succeeded`

**Local testing with Stripe CLI:**

```bash
# Install: https://stripe.com/docs/stripe-cli
stripe listen --forward-to http://localhost:9000/hooks/payment/stripe_stripe
```

Copy the `whsec_...` signing secret printed by `stripe listen` into `STRIPE_WEBHOOK_SECRET` in `apps/backend/.env`, then restart the backend.

Without `STRIPE_WEBHOOK_SECRET`, basic card checkout may still work synchronously, but webhook-dependent flows (3D Secure, redirect methods, async capture) will not reconcile order status correctly.

## File storage

File uploads use Medusa's native file module. The backend picks the provider from environment variables — no code changes are needed for hero or product uploads.

### Provider behavior

| Environment | Provider | Upload API | File URLs |
|-------------|----------|------------|-----------|
| **Local dev** (default) | `file-local` | `POST /admin/uploads` | `{MEDUSA_BACKEND_URL}/static/...` |
| **Production** (S3 env set) | custom S3 (no ACL) | `POST /admin/uploads` | `{S3_FILE_URL}/...` |

The production provider omits S3 object ACLs so uploads work on modern AWS buckets (Object Ownership = **Bucket owner enforced**, the default since 2023). Use a **bucket policy** for public reads instead of ACLs.

Existing local files in `apps/backend/static/` are not migrated. When S3 is enabled, new uploads go to the bucket; old URLs keep pointing at local static files until re-uploaded.

### Backend environment variables

**Local (default)** — no S3 vars required:

| Variable | Description | Default |
|----------|-------------|---------|
| `MEDUSA_BACKEND_URL` | Public backend URL for local file links | `http://localhost:9000` |

**S3-compatible storage** — all five required vars must be set to activate S3:

| Variable | Description |
|----------|-------------|
| `S3_FILE_URL` | Public base URL for files (e.g. `https://cdn.example.com` or bucket URL) |
| `S3_ACCESS_KEY_ID` | Access key |
| `S3_SECRET_ACCESS_KEY` | Secret key |
| `S3_REGION` | Region (e.g. `us-east-1`, `auto` for R2) |
| `S3_BUCKET` | Bucket name |

**Optional:**

| Variable | Description |
|----------|-------------|
| `S3_ENDPOINT` | API endpoint (required for R2, Spaces, MinIO) |
| `S3_FORCE_PATH_STYLE` | Set to `true` for path-style URLs (MinIO, some providers) |

### Storefront environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Allows `next/image` to load local static uploads in dev |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | Must match `S3_FILE_URL` so `next/image` can load S3 uploads |

### How to enable S3

1. Create a bucket on your provider (AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO, etc.).
2. **AWS S3:** keep Block Public Access enabled and add a bucket policy so product images are readable (ACLs are not used):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadProductImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

3. Grant the IAM user used by Medusa at least `s3:PutObject`, `s3:DeleteObject`, and `s3:GetObject` on the bucket.
4. Set all required S3 env vars on the **backend** (Railway).
5. Set `NEXT_PUBLIC_S3_PUBLIC_URL` on the **storefront** to the same value as `S3_FILE_URL`.
6. Redeploy the backend and storefront.

**Example — Cloudflare R2:**

```bash
S3_FILE_URL=https://pub-xxxx.r2.dev
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
S3_BUCKET=lanme-swim-store
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

**Example — MinIO:**

```bash
S3_FILE_URL=https://minio.example.com/my-bucket
S3_ENDPOINT=https://minio.example.com
S3_FORCE_PATH_STYLE=true
```

### Upload flows

Hero background uploads (Admin widget) and product image uploads both use Medusa's `POST /admin/uploads` endpoint. The active file provider determines where files are stored and what URL is returned.

Admin upload size defaults to **10 MB** (`MEDUSA_MAX_UPLOAD_FILE_SIZE_MB` on the backend). The hero widget also resizes large raster images client-side before upload. **Redeploy the backend** after changing the limit — it is baked into the admin build at compile time.

## Email notifications (Resend)

Transactional email uses Medusa's notification module with a custom Resend provider. Emails are sent from the **backend only** — never from the storefront.

### Provider behavior

| Condition | Behavior |
|-----------|----------|
| `RESEND_API_KEY` **not** set | Default Medusa `notification-local` (`feed` channel); subscribers no-op; no email sent |
| `RESEND_API_KEY` set | Resend provider registered for `email` channel |

### Environment variables

**Backend** (`apps/backend/.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes (to enable) | Resend API key from [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | Yes (when enabled) | Verified sender address |
| `RESEND_FROM_NAME` | Optional | Display name (default template: `Lanmè Swim`) |
| `RESEND_REPLY_TO` | Optional | Reply-to / support address |
| `RESEND_DEV_REDIRECT` | Optional | Send all mail to this inbox in development |
| `STOREFRONT_URL` | Recommended | Base storefront URL for email links (`http://localhost:8000`) |
| `STORE_DEFAULT_REGION` | Optional | Region path segment for links (default: `us`) |

### Development setup

1. Create a Resend account and API key.
2. For quick testing without a verified domain, use Resend's sandbox sender:
   ```bash
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
3. Optionally redirect all outbound mail to your inbox:
   ```bash
   RESEND_DEV_REDIRECT=you@example.com
   ```
4. Set `STOREFRONT_URL` to match your running storefront.
5. Restart the backend after changing env vars.

### Production

Verify your sending domain in Resend before going live. Update `RESEND_FROM_EMAIL` to an address on that domain (e.g. `orders@yourdomain.com`). Remove `RESEND_DEV_REDIRECT`.

### Supported emails (Phase 1 + 2)

| Event | Template | Trigger |
|-------|----------|---------|
| `order.placed` | `order-placed` | Customer completes checkout |
| `order.fulfillment_created` | `order-fulfillment-preparing` | Admin creates fulfillment (manual or otherwise) |
| `shipment.created` | `order-shipped` | Admin marks fulfillment as shipped |
| `delivery.created` | `order-delivered` | Admin marks fulfillment as delivered |
| `auth.verification_requested` | `verification` | Customer registers / requests email verification |
| `auth.password_reset` | `password-reset` | Customer requests password reset |

**Order confirmation includes:** display ID, customer email, line item titles/quantities/unit prices, order total, links to order details and account.

**Not yet implemented:** order canceled, admin invites, marketing/abandoned cart.

Lifecycle emails respect the admin **Send notification** toggle (`no_notification` on the workflow event). When disabled, the event still fires but subscribers skip sending and log `skip_reason=no_notification=true`.

### Local testing

1. Set Resend env vars in `apps/backend/.env`.
2. Start backend and storefront.
3. **Verification:** Register a new customer account — check inbox (or `RESEND_DEV_REDIRECT` target).
4. **Order confirmation:** Place a test order with manual payment — check inbox after order completes.
5. **Password reset:** Use the storefront reset page at `/{region}/reset-password?token=...&email=...` or trigger via the Medusa auth API.

## Railway deployment

Deploy the monorepo as **two Railway app services** (backend + storefront) plus **Redis** on Railway. The database can be **Neon** (recommended) or Railway PostgreSQL.

This is a **shared npm workspace**. Leave each service’s **Root Directory empty** (`/`) so Docker can see the repo root (`package-lock.json`, workspaces). Per-app `railway.toml` files tell Railway how to split frontend and backend.

### Auto-split on import (recommended)

1. In Railway: **New Project → Deploy from GitHub repo** and select this repository.
2. Railway detects the JS monorepo and stages a service for each deployable package (`@dtc/backend`, `@dtc/storefront`) using:
   - `apps/backend/railway.toml`
   - `apps/storefront/railway.toml`
3. Confirm both services keep **Root Directory** empty and Config as Code points at those package files.
4. Add **Redis**, set env vars (below), generate public domains, then deploy **backend first**, then storefront.

If you already have services wired to the root aliases `railway.backend.toml` / `railway.storefront.toml`, those still work — prefer switching Config as Code to `/apps/backend/railway.toml` and `/apps/storefront/railway.toml`.

### Production URLs

Use each service’s **Railway public domain** (Settings → Networking → Generate domain). Custom domains can be added later.

| Service | URL |
|---------|-----|
| Backend + Admin | `https://<backend-service>.up.railway.app` |
| Storefront | `https://store.lanmeswim.com` (or Railway domain until custom DNS is ready) |

Admin dashboard: `https://<backend-service>.up.railway.app/app`

### Railway service setup

#### Backend service

| Setting | Value |
|---------|-------|
| Root directory | empty / `/` (repo root — required) |
| Config as Code | `/apps/backend/railway.toml` |
| Builder | `apps/backend/Dockerfile` (not Railpack — avoids secret/env bake failures) |
| Start command | `npx medusa start` |
| Health check | `GET /health` |

Production image is built with `apps/backend/Dockerfile`: `medusa build` output in a Node 20 slim image. Railway `PORT` is read automatically by the Medusa CLI. Migrations run via `preDeployCommand` before each deploy.

#### Storefront service

| Setting | Value |
|---------|-------|
| Root directory | empty / `/` (repo root — required) |
| Config as Code | `/apps/storefront/railway.toml` |
| Builder | `apps/storefront/Dockerfile` (storefront-only `npm ci`) |
| Health check | `GET /api/health` |

`NEXT_PUBLIC_*` variables must be set on the service **before** deploy — they are baked in at `next build`. The container runs `node server.js` (Next.js standalone) on Railway `PORT`.

**Docker builds:** Railway does not inject service variables into `RUN` steps automatically. Each `NEXT_PUBLIC_*` variable must be enabled **Available at Build Time** (variable ⋮ menu in Railway). The Dockerfile declares matching `ARG` names so Railway passes them as build-args.

### Backend environment variables

Set these on the **backend** Railway service:

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | `production` (runtime only; the build overrides this so Medusa can load `medusa-config.ts`) |
| `DATABASE_URL` | Yes | Neon connection string (e.g. `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`). Use Neon’s **pooled** URL for the running app; the **direct** URL is optional for one-off migrations if the pooled URL times out. |
| `REDIS_URL` | Yes | Reference Railway Redis private URL: `${{Redis.REDIS_URL}}` (not the public URL). `family=0` is appended automatically for ioredis. |
| `JWT_SECRET` | Yes | Strong random string |
| `COOKIE_SECRET` | Yes | Strong random string |
| `STORE_CORS` | Yes | Storefront URL, e.g. `https://store.lanmeswim.com` |
| `ADMIN_CORS` | Yes | Backend Railway URL, e.g. `https://<backend-service>.up.railway.app` |
| `AUTH_CORS` | Yes | Comma-separated backend Railway URL + storefront URL |
| `STOREFRONT_URL` | Yes | `https://store.lanmeswim.com` |
| `MEDUSA_BACKEND_URL` | Yes | Same as backend Railway URL |
| `MEDUSA_MAX_UPLOAD_FILE_SIZE_MB` | Optional | Admin upload limit in MB (default `10`) |
| `STORE_DEFAULT_REGION` | Yes | `us` |
| `STRIPE_API_KEY` | Yes | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` from Stripe webhook |
| `RESEND_API_KEY` | Yes | Resend API key |
| `RESEND_FROM_EMAIL` | Yes | Verified sender, e.g. `orders@lanmeswim.com` |
| `RESEND_FROM_NAME` | Optional | `Lanmè Swim` |
| `RESEND_REPLY_TO` | Optional | Support inbox |
| `S3_FILE_URL` | Yes | Public bucket/CDN URL |
| `S3_ACCESS_KEY_ID` | Yes | AWS access key |
| `S3_SECRET_ACCESS_KEY` | Yes | AWS secret key |
| `S3_REGION` | Yes | e.g. `us-east-1` |
| `S3_BUCKET` | Yes | Bucket name |

Do **not** set `RESEND_DEV_REDIRECT` in production.

### Storefront environment variables

Set these on the **storefront** Railway service. `NEXT_PUBLIC_*` variables must be present **before** `next build`. Deploy the **backend first** so `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is reachable during the storefront build (static paths fetch regions/products/collections at build time).

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | `production` |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Yes | Backend Railway URL, e.g. `https://<backend-service>.up.railway.app` |
| `NEXT_PUBLIC_BASE_URL` | Yes | `https://store.lanmeswim.com` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Yes | From Medusa Admin after deploy |
| `NEXT_PUBLIC_DEFAULT_REGION` | Yes | `us` |
| `NEXT_PUBLIC_STRIPE_KEY` | Yes | `pk_live_...` |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | Yes | Must match backend `S3_FILE_URL` |

### Redis behavior

When `REDIS_URL` is set, the backend registers Medusa Redis modules for cache, event bus, workflow engine, and locking. Without `REDIS_URL`, Medusa falls back to in-memory modules (fine for local dev, not for production).

### Deployment sequence

1. Create a Railway project from this GitHub repo (monorepo auto-import should stage **backend** + **storefront**).
2. Add **Redis** on Railway (or use another Redis host).
3. Create a **Neon** project and copy the connection string into `DATABASE_URL` on the backend service.
4. Confirm backend Config as Code is `/apps/backend/railway.toml` and Root Directory is empty.
5. Set backend environment variables (`DATABASE_URL` = Neon URL, `REDIS_URL` = `${{Redis.REDIS_URL}}`, etc.).
6. Deploy the backend. Migrations run automatically via `preDeployCommand` against your Neon database.
7. Create an admin user (Railway shell on the backend service):
   ```bash
   npx medusa user -e admin@lanmeswim.com -p <password>
   ```
8. Open `https://<backend-service>.up.railway.app/app`, sign in, and copy the **publishable API key** from Settings → Developer.
9. Enable **Stripe** on your region(s) in Admin (Settings → Regions).
10. Confirm storefront Config as Code is `/apps/storefront/railway.toml` and Root Directory is empty.
11. Set storefront environment variables (including the publishable key). Enable **Available at Build Time** on every `NEXT_PUBLIC_*` variable.
12. Deploy the storefront.
13. Configure the **Stripe webhook**:
    ```
    POST https://<backend-service>.up.railway.app/hooks/payment/stripe_stripe
    ```
    Set `STRIPE_WEBHOOK_SECRET` on the backend and redeploy if needed.
14. **Test S3:** upload a hero image or product image in Admin; confirm the URL points to S3.
15. **Test Resend:** place a test order and trigger password reset; confirm email links use `STOREFRONT_URL`.
16. **Test checkout:** full browse → cart → Stripe payment → order confirmation.

### Troubleshooting

**Healthcheck fails with `relation "tax_provider" does not exist`**

The production database has no Medusa schema yet. Redeploy after ensuring `apps/backend/railway.toml` includes `preDeployCommand`, or run manually:

```bash
npm run railway:migrate:backend
```

**Redis `Connection is closed` / `AggregateError`**

- Use the **private** Redis URL (`${{Redis.REDIS_URL}}`), not `REDIS_PUBLIC_URL`.
- Ensure Redis is in the same Railway project as the backend.
- The backend appends `family=0` to `REDIS_URL` automatically for Railway's IPv6 networking.

**Build fails on Railway / admin login blocked**

- Backend uses **`apps/backend/Dockerfile`** instead of Railpack so secrets (`JWT_SECRET`, `COOKIE_SECRET`) are not written into the image at build time.
- `ADMIN_CORS` and `AUTH_CORS` must be **HTTPS origins** (your backend + storefront URLs), never `DATABASE_URL` or other `postgresql://` strings.
- `JWT_SECRET` and `COOKIE_SECRET` should be hex-only (`openssl rand -hex 32`).
- Storefront uses **`apps/storefront/Dockerfile`** instead of Railpack — installs only the storefront workspace (not the full Medusa backend) and produces a smaller standalone Next.js image.
- If a service builds the wrong app, check Root Directory is empty and Config as Code points at the matching `apps/*/railway.toml`.

### Local production scripts

```bash
# From repo root
npm run railway:build:backend
npm run railway:start:backend

npm run railway:build:storefront
npm run railway:start:storefront
```

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Medusa Cloud](https://cloud.medusajs.com)
