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

## User Preferences
- None documented yet
