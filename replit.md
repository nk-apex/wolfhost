# WolfHost

## Overview
WolfHost is a hosting panel frontend application with a neon green cyberpunk theme. It provides server hosting management, billing, wallet, referrals, and settings pages. Built with React, Vite, TypeScript/JavaScript, Tailwind CSS, and shadcn/ui components.

## Recent Changes
- 2026-02-11: Fixed Billing & Wallet pages to show per-user real-time transaction data
  - Backend /api/transactions and /api/transactions/totals now filter by user email (Paystack customer filter)
  - M-Pesa charges now use the user's actual email instead of generated phone email
  - All frontend API calls (balance, transactions, stats) pass logged-in user email
  - Card payment email auto-fills from user profile
  - Cleaned up api.js: removed ~1000 lines of legacy commented-out code
  - Each user now sees only their own transactions, balance, and payment history
- 2026-02-11: Full Pterodactyl panel integration (panel.xwolf.space)
  - Backend endpoint /api/auth/register creates users on Pterodactyl panel via Application API
  - Backend endpoint /api/auth/login verifies users exist on Pterodactyl panel by email/username
  - Frontend login and register flows now use real panel authentication
  - Sidebar "LOGGED IN AS" now shows actual user's username and email (was hardcoded)
  - getUser() no longer returns mock user when not logged in
  - Removed demo account info from login page
  - Error handling for duplicate email/username on the panel
  - PTERODACTYL_API_KEY and PAYSTACK_SECRET_KEY stored as environment secrets
- 2026-02-06: Updated server deployment to use 3-tier pricing popup
  - Limited (KES 50): 1 vCPU, 1GB RAM, 10GB storage, 10 slots, basic protection
  - Unlimited (KES 100): 2 vCPU, 4GB RAM, 40GB storage, unlimited slots, advanced protection
  - Admin (KES 200): 4 vCPU, 8GB RAM, 80GB storage, unlimited slots, admin panel, 24/7 support
  - Two-step flow: select tier → enter server name → deploy
  - Each tier has unique color coding (green/blue/purple) and feature list
  - Balance check prevents selecting unaffordable tiers
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
  - Server deployment requires minimum KES 50 balance (Limited tier)
  - Tier prices in KES: Limited (50), Unlimited (100), Admin (200)
  - Insufficient balance shows error toast and redirects to Wallet page
  - Deploy modal shows live balance, tier affordability, and "Top Up Wallet" link
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
- `PTERODACTYL_API_KEY` - Pterodactyl Application API key for panel.xwolf.space (backend only)

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
