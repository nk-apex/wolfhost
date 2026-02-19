# WolfHost

## Overview
WolfHost is a hosting panel frontend application with a neon green cyberpunk theme. It provides server hosting management, billing, wallet, referrals, and settings pages. The project aims to offer a comprehensive and visually distinctive platform for server hosting.

## User Preferences
- Neon green cyberpunk aesthetic
- Multiple theme support (default, dark-tech, glassmorphic, light-mode, midnight, cyberpunk)
- Multi-currency support: currency displayed per user's selected country (KES, GHS, XOF, ZAR, NGN, UGX, etc.)
- Country selection during sign-up; all pages display amounts in user's local currency
- Internal wallet balance stored in KES, converted to local currency for display
- M-Pesa as primary payment method for Kenya; Mobile Money for Ghana/CI
- Minimum deposit: 50 KSH equivalent

## System Architecture
The application is built with React 18, Vite 5, and uses TypeScript/JavaScript. Styling is managed with Tailwind CSS and shadcn/ui components, featuring a custom neon green theme. Routing is handled by react-router-dom v6, and state management utilizes @tanstack/react-query and React Context for authentication. Headings use the Orbitron font, while body text uses JetBrains Mono.

**Core Features:**
- **User Authentication & Management:** Integration with Pterodactyl panel for user registration, login, and admin verification.
- **Server Management:** Auto-provisioning of servers on Pterodactyl panel with three tiers (Limited, Unlimited, Admin), server suspension/unsuspension, and deletion capabilities. Users can manage servers directly via Pterodactyl links.
- **Billing & Wallet:** Real-time transaction data and wallet balance from Paystack API, supporting M-Pesa (Kenya), MTN/Vodafone/AirtelTigo Mobile Money (Ghana), MTN/Wave Mobile Money (Cote d'Ivoire), and card payments for all countries. Multi-currency support with FX conversion to KES base currency.
- **Referral System:** Comprehensive referral tracking with a code, referrer-referred relationships, and completion status. Awards admin panels for achieving referral milestones.
- **Auto Onboarding:** New users are automatically joined to community groups (WhatsApp, Telegram, YouTube) and receive a free 3-day trial server upon registration. Tasks page has been removed; onboarding is fully automated.
- **Admin Dashboard:** Provides administrators with an overview of users and servers, user management (delete, toggle admin status), server management (suspend, delete), and payment insights including total revenue, payment count, and average payment statistics.
- **W.O.L.F AI Assistant:** An AI chatbot powered by Grok AI API, providing assistance with server tiers, payments, referrals, and account features.
- **Welcome Free Server:** New users are offered a 3-day free trial server.

**Technical Implementations:**
- **Frontend:** React 18 with Vite 5, TypeScript + JSX.
- **Backend:** Express.js API server for secure interactions with payment gateways and Pterodactyl.
- **Styling:** Tailwind CSS with a custom neon green theme, enhanced by shadcn/ui components.
- **UI/UX:** Consistent dark glass panel design elements, responsive layouts for various screen sizes, and a cyberpunk aesthetic.
- **Server Auto-Naming:** Servers are automatically named `username-plan-timestamp`.
- **Payment Flow:** Includes detailed processes for M-Pesa (Kenya STK Push with polling), Ghana Mobile Money (MTN, Vodafone Cash, AirtelTigo via Paystack charge API), Cote d'Ivoire Mobile Money (MTN, Wave), and Card payments (Paystack hosted checkout with verification). Country-aware phone formatting and validation.
- **Security Hardening (Feb 2026):** Enterprise-grade security stack applied:
  - **Production Build Serving:** Frontend is built with Vite (Terser minification) and served via Express static — NO dev server in production. Source code is never exposed.
  - **Helmet:** Comprehensive security headers: CSP (strict with Paystack/fonts whitelisted), HSTS (2 years, preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Permissions-Policy, X-DNS-Prefetch-Control, X-Download-Options, X-Permitted-Cross-Domain-Policies
  - **CORS:** Restricted to localhost, Replit domains, and host.xwolf.space
  - **Rate Limiting:** 6 tiers — global (300/15min), auth (10/15min), payment (15/15min), admin (60/15min), chat (10/min), server creation (5/hr)
  - **Input Validation:** express-validator on login, register, payment charges, server creation, chat messages
  - **Centralized Error Handler:** Catches JSON parse errors, oversized requests, unhandled errors; always returns generic error messages in production (no stack traces ever)
  - **Security Logging:** Failed logins, rate limit hits, admin access denials, admin actions, payment attempts, validation failures logged to server/security.log (console suppressed in production)
  - **Path Blocking:** Suspicious paths blocked (.env, .git, server/, src/, package.json, wp-admin, .php, etc.)
  - **Source Map Protection:** No source maps generated, .map requests blocked
  - **Request Size Limits:** JSON/URL-encoded bodies capped at 1MB
  - **Request Tracking:** Unique request ID + client IP on every request
  - **Anti-DevTools:** Advanced browser protection — debugger traps, console nullification, keyboard shortcut blocking (F12, Ctrl+Shift+I, Cmd+Option+I), right-click disabled, text selection/copy/drag restricted, React DevTools blocked, Function.prototype.toString spoofing
  - **Build Security:** Terser strips ALL console methods (log, debug, info, warn, error, trace), removes comments, mangles variable names, hash-based filenames hide structure
  - **JWT Auth:** Persistent JWT_SECRET via Replit secrets, 7-day token expiry, proper Bearer token validation on all protected endpoints
  - **Known Limitation:** Auth is frontend localStorage-based; userId is client-trusted. Changing auth model is a separate task.
  - **Credential Protection:** All sensitive values in environment variables:
    - PAYSTACK_SECRET_KEY, PTERODACTYL_API_KEY, JWT_SECRET stored as Replit secrets (server-side only)
    - SUPER_ADMIN_USERNAME, PTERODACTYL_API_URL, NODE_ENV stored as env vars
    - No mock data or demo credentials in production build

## External Dependencies
- **Pterodactyl Panel:** Used for server provisioning, user authentication, and server management.
- **Paystack:** Integrated for handling all payment transactions, including M-Pesa STK Push and card payments, currency handling (KES), and transaction history.
- **Grok AI API:** Powers the W.O.L.F AI Assistant for user support and information retrieval.