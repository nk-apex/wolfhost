# WolfHost

A premium hosting platform that allows users to deploy servers, pay via M-Pesa/Paystack, manage their infrastructure, and earn through referrals.

## Architecture

- **Frontend**: React + TypeScript + Vite, served from the Express server via the built `dist/` folder
- **Backend**: Express.js (Node.js, ESM modules) on port 5000
- **Auth**: JWT-based authentication (stored in localStorage)
- **Payments**: Paystack integration (M-Pesa and card)
- **Server management**: Pterodactyl panel API integration

## Key Files

- `server/index.js` — Main Express server (~3900 lines), handles all API routes and serves the built frontend
- `src/` — React frontend source
- `src/services/api.js` — All frontend API calls (~2300 lines)
- `server/config/countries.js` — Currency/FX rate config
- `server/*.json` — Flat-file data storage (users, servers, messages, notifications, etc.)

## Data Storage

Uses JSON flat files in `server/`:
- `user_credentials.json` — Hashed passwords
- `notifications.json` — Per-user notifications
- `community_messages.json` — Community chat
- `spending.json` — Records of server purchases (used for balance calculation)
- `deposits.json` — **Local deposit records** (recorded when payments are verified; used as primary source for balance calculation)
- `referrals.json` — Referral codes and tracking
- `tasks.json` — Completed social tasks per user
- `deploy_claims.json` — GitHub deploy claims
- `welcome_claims.json` — Free trial claims
- `free_servers.json` — Available free server pool
- `admin_alerts.json` — Admin notifications

## Balance Calculation

Balance = local deposits (deposits.json) - local spending (spending.json).
- **Primary**: Local `deposits.json` — written when any payment is verified (M-Pesa, card, mobile money, bank transfer, USSD). All currencies are converted to KES.
- **Fallback**: Paystack API — used only for users who have no local deposit records (backward compatibility with payments made before this system).
- This makes balance reliable and independent of Paystack API availability.

## Environment Variables

- `NODE_ENV` — `development` (set in Replit shared env)
- `PORT` — `5000` (set in Replit shared env)
- `JWT_SECRET` — Required in production (auto-generated random in dev)
- `PAYSTACK_SECRET_KEY` — Paystack payment processing
- `PTERODACTYL_API_KEY` — Pterodactyl panel API key
- `PTERODACTYL_API_URL` — Defaults to `https://panel.xwolf.space`
- `SUPER_ADMIN_USERNAME` — Username for super admin access

## Running the App

The `npm run dev` script builds the Vite frontend then starts Express. The workflow "Start application" runs this automatically on port 5000.

## Payment Flow (Paystack)

- **M-Pesa / Mobile Money**: STK push via `/api/mpesa/charge` → poll `/api/mpesa/verify/:reference` → `recordDeposit` writes to `deposits.json`
- **Card**: Initialize via `/api/card/initialize` → Paystack checkout tab → user clicks verify → `/api/card/verify/:reference` → `recordDeposit` writes to `deposits.json`
- **Card redirect callback** (Billing page): When Paystack redirects back with `?reference=`, the `VerifyPayment` component opens automatically and calls `/api/card/verify/:reference`
- **VerifyPayment bug fix** (2026-03-22): Was checking `result.status` instead of `result.success`, causing all verifications to always show as "failed". Fixed.

## Paystack API Optimizations (2026-03-22)

- `paystackFetch` now has a 15-second `AbortController` timeout to prevent hanging
- `resolvePaystackCustomer` results are cached (10-min TTL) per email to avoid repeated API calls on every page load
- `fetchUserTransactions` no longer hard-codes `currency=KES`, allowing transactions in GHS/NGN/etc. to show in the billing/wallet pages

## Security

- Helmet.js for HTTP security headers
- Rate limiting on all API routes (auth, payments, registration)
- Input validation with express-validator
- JWT authentication for protected routes
- CORS restricted to localhost, Replit, and xwolf.space domains
- Path-based attack blocking (SQL injection patterns, config file access, etc.)
- Security event logging to `server/security.log`
