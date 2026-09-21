# goVerifEye Customer (shopper verify)

Standalone Vite + React site for public product verification. Host this separately from the vendor/admin portal (`goVerifyEye-UI-FE`).

## Routes

| Path | Page |
|------|------|
| `/` or `/verify` | Landing |
| `/verify/scan` | Camera / scan |
| `/verify/manual` | Manual code entry |
| `/verify/result` | Verify outcome |
| `/verify/details` | Verification details |
| `/verify/account` | Shopper account |
| `/verify/privacy` | Privacy |

## Setup

```bash
cd customer
cp .env.example .env.local
# For live API:
#   VITE_API_BASE_URL=https://goverifeye-api.onrender.com
#   VITE_USE_MOCK_API=false
npm install
npm run dev          # http://localhost:5173
npm run dev:live     # force Render API
npm run build        # → dist/
npm run preview
```

## Production (Vercel)

Production builds use `.env.production` (`VITE_API_BASE_URL=same-origin`) so the browser calls `/api/...` on the same host. `vercel.json` rewrites those to Render.

Do **not** leave `VITE_API_BASE_URL` empty in the Vercel project env — that overrides `.env.production` and ships the in-browser demo/mocks. Use `same-origin` (or the Render URL) and redeploy after changing env.
## Deploy

Build `dist/` and host on any static CDN (Vercel, Netlify, S3, …). Point DNS (e.g. `verify.goverifeye.com`) at this app. QR codes from the API should use the same public origin via `APP_PUBLIC_URL` on the API.

Vendor portal can redirect `/verify*` to this host using `VITE_CUSTOMER_SITE_URL`.
