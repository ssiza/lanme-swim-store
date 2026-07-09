# Lanmè Swim Store — GitHub Setup

This project is a standalone duplicate of the Fanarc store, rebranded for **Lanmè Swim** (bikini swimwear and beach essentials).

## Create the GitHub repository

1. On GitHub, create a new empty repository named `lanme-swim-store` under your account (e.g. `ssiza/lanme-swim-store`). Do **not** initialize it with a README.

2. From this directory, push the existing commit:

```bash
cd lanme-swim-store
git remote add origin https://github.com/ssiza/lanme-swim-store.git
git push -u origin main
```

## Configure environment (when ready)

Copy and fill in env files from the templates:

```bash
cp apps/backend/.env.template apps/backend/.env
cp apps/storefront/.env.template apps/storefront/.env
```

See `README.md` for full Railway deployment and variable reference. Use **separate** values from Fanarc for:

- `DATABASE_URL` (new Neon/Postgres database)
- `JWT_SECRET` / `COOKIE_SECRET`
- Stripe keys and webhook
- Resend (`RESEND_FROM_EMAIL`, e.g. `orders@lanmeswim.com`)
- S3 bucket (`S3_BUCKET=lanme-swim-store`)
- `STOREFRONT_URL` / `NEXT_PUBLIC_BASE_URL` (e.g. `https://store.lanmeswim.com`)

## Brand assets

Replace `apps/storefront/public/lanme-logo.svg` with your final logo when ready. Site name and copy are centralized in `apps/storefront/src/lib/constants/site.ts`.
