# WolfHost

## Overview
WolfHost is a premium hosting infrastructure platform built with React + Vite frontend and Express.js backend. It allows users to deploy servers, manage hosting, and pay with crypto or mobile money (M-Pesa via Paystack).

## Project Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme (dark/cyber aesthetic)
- **Routing**: React Router DOM v6
- **State Management**: TanStack React Query
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js with Express 5
- **Data Storage**: JSON files in `server/` directory
- **Authentication**: JWT-based auth with scrypt password hashing
- **Security**: Helmet, CORS, rate limiting, input validation
- **Payment**: Paystack integration (M-Pesa)
- **Server Management**: Pterodactyl API integration

### Project Structure
```
├── src/                    # Frontend React source
├── server/                 # Express backend
│   ├── index.js           # Main server file (API routes + static serving)
│   ├── config/            # Server configuration
│   ├── tasks.json         # Task data
│   ├── free_servers.json  # Free server data
│   └── ...                # Other JSON data files
├── public/                # Static assets
├── dist/                  # Built frontend (generated)
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS config
└── package.json           # Dependencies
```

### How It Runs
- **Development**: `npx vite build && NODE_ENV=production node server/index.js`
- The Vite build outputs to `dist/`, then the Express server serves those static files on port 5000
- The Express server also handles all `/api/*` routes

### Environment Variables
- `JWT_SECRET` - Required for JWT token signing (set)
- `NODE_ENV` - Set to `development` in dev environment
- `PAYSTACK_SECRET_KEY` - Paystack payment API key (needs to be set by user)
- `PTERODACTYL_API_KEY` - Pterodactyl panel API key (needs to be set by user)
- `PTERODACTYL_API_URL` - Defaults to `https://panel.xwolf.space`
- `SUPER_ADMIN_USERNAME` - Super admin username (needs to be set by user)

## Recent Changes
- 2026-02-24: Imported project to Replit environment
  - Installed all npm dependencies (including devDependencies)
  - Set NODE_ENV=development for dev environment
  - Generated and set JWT_SECRET
  - Configured workflow for build + serve
- 2026-02-24: Fixed payment verification timeout bug
  - All three verify functions in `src/services/paystack.js` (verifyPayment, verifyMobileMoneyPayment, verifyCardPayment) were missing Authorization headers
  - Server endpoints require JWT auth, so verification polls always failed with 401 and silently retried until timeout
  - Added JWT token from localStorage to all verification fetch requests
- 2026-02-24: Fixed server deployment balance verification bug
  - `verifyUserBalance()` in `server/index.js` was passing raw email as Paystack `customer` parameter instead of resolving to customer code first
  - This caused inconsistent balance calculation between what the UI shows and what the backend verifies during server creation
  - Fixed by reusing `fetchUserTransactions()` which properly resolves email to Paystack customer code via `resolvePaystackCustomer()`

- 2026-02-24: Fixed server creation "variable field is required" error
  - All 4 server creation payloads (admin, user, free trial, welcome) had hardcoded egg environment variables that didn't match the Pterodactyl panel's actual egg variable definitions
  - Added `getEggEnvironment()` function that dynamically fetches egg 15's variable definitions from the Pterodactyl API (`/nests/{id}/eggs/15?include=variables`) and builds the environment object from actual variable names
  - Results are cached for 5 minutes to avoid repeated API calls
  - Falls back to a comprehensive set of known variable names if the API call fails
  - Centralized egg ID, docker image, and startup command into constants (`SERVER_EGG_ID`, `SERVER_DOCKER_IMAGE`, `SERVER_STARTUP`)
  - Also fetches the egg's actual startup command and docker image (was `ghcr.io/pelican-eggs/yolks:nodejs_24`, not `parkervcp`)
  - Added `/api/admin/debug-egg` endpoint for diagnosing egg variable issues

- 2026-02-25: Added Community public chat page
  - New page at `/community` with real-time public messaging
  - Backend API: `GET/POST /api/community/messages`, `DELETE /api/community/messages/:id`
  - Messages stored in `server/community_messages.json` (max 200 messages)
  - Active user tracking in `server/community_active.json` (5-min window)
  - Rate limited to 5 messages per 10 seconds
  - Users can delete own messages, admins can delete any
  - Added "Community" nav item to sidebar

- 2026-02-25: Added admin panel features - Notifications & Site Settings
  - New admin tabs: "Notify" (broadcast notifications) and "Site" (social links management)
  - `POST /api/admin/broadcast-notification` — sends notification to all users (type: info/success/warning/alert)
  - `GET /api/site-settings` — public endpoint for social link data
  - `PUT /api/admin/site-settings` — admin-only, update social links
  - Site settings stored in `server/site_settings.json` (WhatsApp channel/group, YouTube, support phone)
  - Landing page footer and sidebar "Join Us" section now load links dynamically from API
  - YouTube link added to landing page footer

### VPS Deployment Notes
- **Nginx** proxies `host.xwolf.space` → `localhost:4000` (config: `/etc/nginx/sites-available/wolfhost.conf`)
- **PM2 process**: `wolfhost` must run with `PORT=4000` — use `PORT=4000 NODE_ENV=production pm2 start server/index.js --name wolfhost`
- Old `wolfhost-backend` and `wolfhost-frontend` processes should remain stopped
- Deploy command: `cd /var/www/wolfhost && git pull && npx vite build && pm2 restart wolfhost`

- 2026-02-26: Fixed new user balance and added Claim Server page
  - Changed all wallet_balance localStorage fallbacks from '1500.00' to '0' in `src/services/api.js` (6 occurrences) so new users start at 0 balance
  - Created `/claim-server` page (`src/pages/ClaimServer.jsx`) where users can name and claim a free 3-day limited server
  - Updated `/api/free-server/claim-welcome` endpoint to accept custom `serverName` from request body
  - Added "Claim Server" link to sidebar navigation with Gift icon
  - Added route in `src/App.tsx`

- 2026-02-26: Added tutorial video management system
  - Backend: CRUD API endpoints at `/api/tutorials` (public) and `/api/admin/tutorials` (admin) with YouTube URL validation
  - Tutorials stored in `server/tutorials.json` with YouTube ID extraction, categories, publish/draft status
  - Admin panel: New "Tutorials" tab for adding, editing, deleting, and publishing/unpublishing tutorial videos
  - User-facing: New `/tutorials` page with search, category filtering, video grid with YouTube thumbnails, and embedded player modal
  - Updated CSP to allow YouTube iframe embeds and thumbnail images
  - Added "Tutorials" to sidebar navigation with BookOpen icon

- 2026-02-26: Added admin alerts and bug bot detection system
  - Backend: `notifyAdmin()` helper, `addAdminAlert()` for persistent alerts in `server/admin_alerts.json`
  - Bug bot detection: 18+ regex patterns scanning for raid bots, nukers, spam bots, token grabbers, DDoS tools, phishing, etc.
  - Server creation blocked if suspicious name detected (both paid and free servers), with admin notification
  - Periodic background scan of all existing servers every 30 minutes (paginated)
  - Admin notified when free trial servers expire (in cleanup function)
  - Super admin ID resolved on startup for reliable notification delivery
  - Admin API: GET/PATCH/DELETE `/api/admin/alerts` endpoints for managing alerts
  - Admin panel: New "Alerts" tab with severity-coded cards, filter by category/status, resolve/delete actions, unresolved badge count

- 2026-02-26: Added Bank Transfer, USSD, and OPay payment support for Nigeria
  - Backend: `POST /api/bank-transfer/charge` and `GET /api/bank-transfer/verify/:reference` for bank transfer payments via Paystack `/charge` with `bank_transfer: {}`
  - Backend: `POST /api/ussd/charge` and `GET /api/ussd/verify/:reference` for USSD payments via Paystack `/charge` with `ussd: { type: bankCode }`
  - USSD supports GTBank (737), UBA (919), Sterling Bank (822)
  - Frontend services: `initializeBankTransfer`, `verifyBankTransfer`, `initializeUSSDPayment`, `verifyUSSDPayment` in `src/services/paystack.js`
  - Currency config: Nigeria (NG) updated with `ussdBanks` array, `paystackCurrency: 'NGN'`, payment methods include `bank_transfer` and `ussd`
  - New helpers: `supportsUSSD()`, `supportsBankTransfer()`, `getUSSDbanks()` in `src/lib/currencyConfig.js`
  - Wallet UI: Nigeria users see Card, Bank Transfer, and USSD payment options
  - Bank Transfer shows virtual account details (bank name, account number, account name) for user to transfer to; supports OPay transfers
  - USSD shows bank selector and displays USSD dial code after initiation
  - Both methods poll for payment confirmation with appropriate timeouts

## User Preferences
- None documented yet
