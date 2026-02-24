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

### VPS Deployment Notes
- **Nginx** proxies `host.xwolf.space` → `localhost:4000` (config: `/etc/nginx/sites-available/wolfhost.conf`)
- **PM2 process**: `wolfhost` must run with `PORT=4000` — use `PORT=4000 NODE_ENV=production pm2 start server/index.js --name wolfhost`
- Old `wolfhost-backend` and `wolfhost-frontend` processes should remain stopped
- Deploy command: `cd /var/www/wolfhost && git pull && npx vite build && pm2 restart wolfhost`

## User Preferences
- None documented yet
