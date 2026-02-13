# WolfHost

## Overview
WolfHost is a hosting panel frontend application with a neon green cyberpunk theme. It provides server hosting management, billing, wallet, referrals, and settings pages. The project aims to offer a comprehensive and visually distinctive platform for server hosting.

## User Preferences
- Neon green cyberpunk aesthetic
- Multiple theme support (default, dark-tech, glassmorphic, light-mode, midnight, cyberpunk)
- KES (Kenyan Shilling) as primary currency
- M-Pesa as primary payment method
- Minimum deposit: 50 KSH

## System Architecture
The application is built with React 18, Vite 5, and uses TypeScript/JavaScript. Styling is managed with Tailwind CSS and shadcn/ui components, featuring a custom neon green theme. Routing is handled by react-router-dom v6, and state management utilizes @tanstack/react-query and React Context for authentication. Headings use the Orbitron font, while body text uses JetBrains Mono.

**Core Features:**
- **User Authentication & Management:** Integration with Pterodactyl panel for user registration, login, and admin verification.
- **Server Management:** Auto-provisioning of servers on Pterodactyl panel with three tiers (Limited, Unlimited, Admin), server suspension/unsuspension, and deletion capabilities. Users can manage servers directly via Pterodactyl links.
- **Billing & Wallet:** Real-time transaction data and wallet balance from Paystack API, supporting M-Pesa and card payments. Tracks spending for accurate balance deduction.
- **Referral System:** Comprehensive referral tracking with a code, referrer-referred relationships, and completion status. Awards admin panels for achieving referral milestones.
- **Task Reward System:** Users can complete social media tasks to earn free trial servers, with mechanisms to prevent duplicate claims.
- **Admin Dashboard:** Provides administrators with an overview of users and servers, user management (delete, toggle admin status), server management (suspend, delete), and payment insights including total revenue, payment count, and average payment statistics.
- **W.O.L.F AI Assistant:** An AI chatbot powered by Grok AI API, providing assistance with server tiers, payments, referrals, and account features.
- **Welcome Free Server:** New users are offered a 3-day free trial server.

**Technical Implementations:**
- **Frontend:** React 18 with Vite 5, TypeScript + JSX.
- **Backend:** Express.js API server for secure interactions with payment gateways and Pterodactyl.
- **Styling:** Tailwind CSS with a custom neon green theme, enhanced by shadcn/ui components.
- **UI/UX:** Consistent dark glass panel design elements, responsive layouts for various screen sizes, and a cyberpunk aesthetic.
- **Server Auto-Naming:** Servers are automatically named `username-plan-timestamp`.
- **Payment Flow:** Includes detailed processes for both M-Pesa (STK Push with polling for confirmation) and Card payments (Paystack hosted checkout with verification).

## External Dependencies
- **Pterodactyl Panel:** Used for server provisioning, user authentication, and server management.
- **Paystack:** Integrated for handling all payment transactions, including M-Pesa STK Push and card payments, currency handling (KES), and transaction history.
- **Grok AI API:** Powers the W.O.L.F AI Assistant for user support and information retrieval.