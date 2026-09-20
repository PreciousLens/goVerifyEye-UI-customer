# goVerifEye Customer (shopper verify)

Standalone Vite + React site for public product verification. Host this separately from the vendor/admin portal (`goVerifyEye-UI-FE`).

## Routes

| Path | Page |
|------|------|
| `/` or `/verify` | Landing |
| `/verify/scan` | Camera / scan |
| `/verify/manual` | Manual code entry |
| `/verify/result` | Verify outcome |
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
npm run dev          # http://localhost:5180
npm run dev:live     # force Render API
npm run build        # → dist/
npm run preview
```

## Deploy

Build `dist/` and host on any static CDN (Vercel, Netlify, S3, …). Point DNS (e.g. `verify.goverifeye.com`) at this app. QR codes from the API should use the same public origin via `APP_PUBLIC_URL` on the API.

Vendor portal can redirect `/verify*` to this host using `VITE_CUSTOMER_SITE_URL`.
