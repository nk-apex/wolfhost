# WolfHost

## Overview
WolfHost is a hosting panel frontend application with a neon green cyberpunk theme. It provides server hosting management, billing, wallet, referrals, and settings pages. Built with React, Vite, TypeScript/JavaScript, Tailwind CSS, and shadcn/ui components.

## Recent Changes
- 2026-02-06: Migrated from Lovable to Replit environment
  - Updated vite.config.ts to use port 5000 and allow all hosts
  - Removed lovable-tagger dependency from vite config
  - Configured deployment as static site

## Project Architecture
- **Frontend**: React 18 with Vite 5, TypeScript + JSX
- **Styling**: Tailwind CSS with custom neon green theme, shadcn/ui components
- **Routing**: react-router-dom v6
- **State**: @tanstack/react-query, React Context (AuthContext)
- **Fonts**: Orbitron (headings), JetBrains Mono (body)

### Key Directories
- `src/pages/` - Page components (Landing, Login, Register, Overview, Servers, Billing, Wallet, Referrals, Settings)
- `src/components/` - Reusable components (Layout, Sidebar, Header, GlassCard, ServerCard, etc.)
- `src/components/ui/` - shadcn/ui base components
- `src/context/` - AuthContext for authentication state
- `src/services/` - API and Paystack payment services
- `public/` - Static assets

### Running
- Dev: `npm run dev` (Vite dev server on port 5000)
- Build: `npm run build` (outputs to `dist/`)
- Deploy: Static deployment serving `dist/`

## User Preferences
- Neon green cyberpunk aesthetic
- Multiple theme support (default, dark-tech, glassmorphic, light-mode, midnight, cyberpunk)
