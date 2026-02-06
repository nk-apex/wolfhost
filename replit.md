# WolfHost

## Overview
WolfHost is a hosting panel frontend application with a neon green cyberpunk theme. It provides server hosting management, billing, wallet, referrals, and settings pages. Built with React, Vite, TypeScript/JavaScript, Tailwind CSS, and shadcn/ui components.

## Recent Changes
- 2026-02-06: Fixed Overview page to show real data
  - Wallet balance from Paystack API (/api/transactions/totals) in KES currency
  - Recent transactions from Paystack API (/api/transactions) with channel icons
  - Server count from localStorage (same source as Servers page)
  - Total deposits count and amount from Paystack API
  - Removed all hardcoded/mock stats (uptime, visitors, etc.)
  - Added 10s timeout for API calls to prevent hanging
- 2026-02-06: Added card payment support via Paystack alongside M-Pesa
  - Backend endpoints: /api/card/initialize, /api/card/verify/:reference
  - PaymentModal and Wallet page both support M-Pesa and Card payment methods
  - Card payments use Paystack hosted checkout (redirect to secure page)
  - Transaction display shows card icon and last 4 digits for card payments
- 2026-02-06: Added wallet balance check to Servers page
  - Server deployment requires minimum KES 50 balance (Basic plan)
  - Plan prices in KES: Basic (50), Pro (150), Enterprise (500)
  - Insufficient balance shows error toast and redirects to Wallet page
  - Deploy modal shows live balance, plan affordability, and "Top Up Wallet" link
  - Balance loading state prevents false redirects before API responds
- 2026-02-06: Fixed API URLs from localhost:3001 to relative /api/ paths (Vite proxy)
- 2026-02-06: Implemented real M-Pesa payment integration via Paystack
  - Created Express backend (server/index.js) on port 3001 for secure Paystack API calls
  - Implemented M-Pesa STK push endpoints (/api/mpesa/charge, /api/mpesa/verify)
  - Enforced 50 KSH minimum deposit in both frontend and backend
  - Added Safaricom phone number validation (format: 0712345678 → 2547XXXXXXXX)
  - Frontend polls backend for payment confirmation with 60-second timeout
  - Updated PaymentModal and Wallet page with real M-Pesa flow
  - Paystack secret key stored as PAYSTACK_SECRET_KEY env var (backend only)
- 2026-02-06: Migrated from Lovable to Replit environment
  - Updated vite.config.ts to use port 5000 and allow all hosts
  - Removed lovable-tagger dependency from vite config

## Project Architecture
- **Frontend**: React 18 with Vite 5, TypeScript + JSX (port 5000)
- **Backend**: Express.js API server (port 3001) for Paystack M-Pesa integration
- **Styling**: Tailwind CSS with custom neon green theme, shadcn/ui components
- **Routing**: react-router-dom v6
- **State**: @tanstack/react-query, React Context (AuthContext)
- **Fonts**: Orbitron (headings), JetBrains Mono (body)
- **Payments**: Paystack M-Pesa STK Push + Card payments (KES currency, min 50 KSH)

### Key Directories
- `src/pages/` - Page components (Landing, Login, Register, Overview, Servers, Billing, Wallet, Referrals, Settings)
- `src/components/` - Reusable components (Layout, Sidebar, Header, GlassCard, ServerCard, PaymentModal, etc.)
- `src/components/ui/` - shadcn/ui base components
- `src/context/` - AuthContext for authentication state
- `src/services/` - API (api.js) and Paystack payment services (paystack.js)
- `server/` - Express backend for secure Paystack API calls
- `public/` - Static assets

### Payment Flow
**M-Pesa:**
1. User enters amount (min 50 KSH) and Safaricom phone number
2. Frontend calls backend /api/mpesa/charge endpoint
3. Backend initiates Paystack mobile_money charge with STK push
4. User receives STK push on phone, enters M-Pesa PIN
5. Frontend polls /api/mpesa/verify every 1-2 seconds (up to 60s)
6. On success, wallet balance is updated automatically

**Card:**
1. User enters amount (min 50 KSH) and email address
2. Frontend calls backend /api/card/initialize endpoint
3. Backend initializes Paystack transaction with card channel
4. User is redirected to Paystack's secure hosted checkout page
5. After completing payment, user clicks "Verify Payment" button
6. Frontend calls /api/card/verify to confirm payment status
7. On success, wallet balance is updated automatically

### Environment Variables
- `PAYSTACK_SECRET_KEY` - Paystack secret key (backend only, never exposed to browser)

### Running
- Dev: `npm run dev` (runs both Vite on port 5000 and Express on port 3001 via concurrently)
- Build: `npm run build` (outputs to `dist/`)
- Deploy: Autoscale deployment with Express backend and Vite preview

## User Preferences
- Neon green cyberpunk aesthetic
- Multiple theme support (default, dark-tech, glassmorphic, light-mode, midnight, cyberpunk)
- KES (Kenyan Shilling) as primary currency
- M-Pesa as primary payment method
- Minimum deposit: 50 KSH
