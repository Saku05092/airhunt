# AirHunt - Airdrop Activity Manager

## Project Overview

AirHunt is a mobile-first airdrop activity management app for DeFi farmers. It solves the core pain point of tracking which wallets have completed which tasks, across multiple airdrop campaigns, with deadline awareness and priority management.

### Core Value Proposition
- "Which wallet did what, and what's left to do?" - answered at a glance
- Never miss an airdrop deadline again
- Prioritize by expected value (Tier S/A/B/C)

---

## Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Mobile | React Native + Expo (TypeScript) | Done |
| Web | Next.js | Not started |
| Backend API | Claudex REST API (port 3001) | Done |
| Database | Supabase (PostgreSQL) + RLS | Done |
| Auth | Supabase Auth (Email/Password) | Done |
| Push Notifications | Expo Notifications | Done |
| State Management | Zustand | Done |
| Airdrop Data | Claudex API integration | Done |

---

## Business Model

- **Free**: 1 wallet, basic task management, referral links (monetization via referrals)
- **Pro** (~$9.99/mo): 10 wallets, advanced features
- **Unlimited** (~$29.99/mo): 50+ wallets, all features
- **Revenue**: Referral commissions + subscription

---

## Development Phases & Progress

### Phase 1: MVP [IN PROGRESS]

#### 1a: Foundation
- [x] Expo project initialization (React Native + TypeScript)
- [x] Directory structure (apps/mobile, packages/db)
- [x] Expo Router with tab navigation (Discover/Dashboard/Wallets/Settings)
- [x] Supabase project setup + SQL schema deployed
- [x] Database schema (wallets, user_campaigns, custom_tasks, wallet_tasks, profiles)
- [x] Row Level Security on all tables
- [x] Auto-create profile trigger on signup
- [x] Supabase Auth (Email/Password sign in/up)
- [x] SecureStore token persistence (iOS/Android)
- [x] "Skip for now" offline mode

#### 1b: Core Features
- [x] Claudex REST API integration (GET /api/campaigns)
- [x] Auto-sync on app start + pull-to-refresh
- [x] Airdrop campaign management (Discover: browse all, Dashboard: tracked only)
- [x] Task management per campaign x per wallet (checklist UI)
- [x] User custom task creation (inline form, isTemplate: false)
- [x] Template tasks from Claudex API

#### 1c: Intelligence
- [x] Deadline reminder push notifications (7d, 3d, 1d, day-of at 9:00 AM)
- [x] Auto-schedule on campaign track, auto-cancel on untrack
- [x] Notification permission request on first launch
- [x] Today's Priority view (Dashboard, top section)
- [x] Priority sorting (deadline proximity x tier S>A>B>C)
- [x] Max 5 priority items with "View all" link
- [x] Tier-colored campaign cards with deadline badges
- [x] Wallet address registration with chain selection
- [x] Wallet labeling and primary wallet designation

#### 1d: Monetization
- [x] Referral CTA buttons with UTM tracking (utm_source/medium/campaign/content)
- [x] PR badge on referral links
- [x] Reward description display
- [x] Twitter follow link
- [x] Share via React Native Share API

#### 1e: Polish & Launch [NOT STARTED]
- [ ] UI/UX polish and animation
- [ ] App icon and branding assets
- [ ] Onboarding flow (first-time user guide)
- [ ] E2E testing
- [ ] App Store submission (iOS)
- [ ] Google Play submission (Android)
- [ ] Landing page (airhunt.app)

### Phase 2: On-Chain Intelligence [COMPLETED]
- [x] On-chain activity auto-detection (Etherscan APIs, 5 EVM chains)
- [x] Protocol interaction history (bridges, DEX, lending detection)
- [x] Activity timestamps and frequency
- [x] Gas cost tracking (BigInt precision, USD estimates)
- [x] Bridge count/amount tracking
- [x] Swap count/amount tracking
- [x] NFT mint history
- [x] Wallet-to-wallet progress comparison dashboard

### Phase 3: Unlimited Plan Features - Rust Backend [COMPLETED]
- [x] Rust API server (axum, port 3002)
- [x] Sybil Risk Score (6-factor analysis, weighted scoring)
- [x] Airdrop Value Estimator (19 historical comparables, percentile)
- [x] Portfolio Dashboard (multi-chain token aggregation)
- [x] Export / Tax Report (CSV generation)
- [x] Plan gate infrastructure (PlanGate component, hasAccess utility)
- [x] App integration (4 new screens: sybil, portfolio, export, plan gate)
- [x] Claudex Pricing page updated

### Phase 4: Scaling [IN PROGRESS]

#### Code Complete (requires external setup to activate):
- [x] Stripe integration (checkout session + webhook handler)
- [x] Supabase plan sync (webhook -> profiles.plan logic)
- [x] 50+ wallet limit enforcement (plan-based, UI count display)
- [x] Railway Dockerfile + config (multi-stage Rust build)
- [x] Next.js web app (landing page, pricing, signup)
- [x] Google/Apple OAuth (expo-web-browser + AuthSession flow)

#### External Setup Required:
- [ ] Stripe account creation + product/price IDs -> .env
- [ ] Railway deploy (GitHub -> services/api directory)
- [ ] Domain purchase (airhunt.app) + DNS configuration
- [ ] Vercel deploy (apps/web)
- [ ] Supabase OAuth provider config (Google/Apple Client IDs)
- [ ] App Store submission (iOS)
- [ ] Google Play submission (Android)

#### Remaining:
- [ ] Advanced notifications (Telegram/Discord)

### Backlog: Bug Fixes / Improvements (from audit)
- [ ] Store race condition fix (toggleTask concurrent access)
- [ ] Rust chain parameter enum validation
- [ ] console.warn -> structured logger
- [ ] `any` type replacement (index.tsx CampaignCard)
- [ ] Hardcoded ETH/USD prices -> API price feed
- [ ] Sybil chrono_now() -> ISO 8601 format
- [ ] Wallet ID Date.now() -> crypto.randomUUID()
- [ ] File splitting (dashboard.tsx 567L, [id].tsx 633L)

---

## Database Schema (Supabase)

```sql
-- profiles: auto-created on signup
profiles (id UUID PK -> auth.users, plan, wallet_limit)

-- wallets: multi-chain, per user
wallets (id, user_id, address, chain, label, is_primary)
  UNIQUE(user_id, address, chain)

-- user_campaigns: which campaigns user is tracking
user_campaigns (id, user_id, campaign_id, priority_override, notes)
  UNIQUE(user_id, campaign_id)

-- custom_tasks: user-created tasks per campaign
custom_tasks (id, user_id, campaign_id, title, description, sort_order)

-- wallet_tasks: completion status per wallet x task
wallet_tasks (id, user_id, wallet_id, task_id, completed, completed_at, notes)
  UNIQUE(wallet_id, task_id)

-- All tables have RLS enabled (auth.uid() = user_id)
```

---

## Commands

```bash
# Mobile dev server
cd apps/mobile && npx expo start -c

# Mobile with tunnel (if LAN fails)
cd apps/mobile && npx expo start -c --tunnel

# Claudex API (data source)
cd /Users/shin/claude-code/claudex && npm run api

# Supabase schema
# Run packages/db/supabase-schema.sql in Supabase SQL Editor

# TypeScript check
cd apps/mobile && npx tsc --noEmit

# Install Expo packages (ALWAYS use this)
cd apps/mobile && npx expo install <package-name>
```

---

## Architecture

```
Claudex (Data Source)                  AirHunt (User App)
+---------------------+               +----------------------+
| src/api/data.ts     |   REST API    | lib/api.ts           |
| (Campaign data)     | ------------> | (API client)         |
|                     | GET /api/     |                      |
| src/api/server.ts   | campaigns    | lib/store.ts         |
| (HTTP :3001)        |               | (Zustand)            |
|                     |               |                      |
| Dashboard HTML      |               | lib/supabase.ts      |
| Tweet generator     |               | (Auth + DB)          |
| Research pipeline   |               |                      |
+---------------------+               | lib/notifications.ts |
                                       | (Push alerts)        |
                                       |                      |
                                       | Screens:             |
                                       |  Discover (browse)   |
                                       |  Dashboard (tracked) |
                                       |  Campaign Detail     |
                                       |  Wallets             |
                                       |  Settings            |
                                       |  Auth/Login          |
                                       +----------------------+
                                              |
                                       +------v------+
                                       | Supabase    |
                                       | (PostgreSQL |
                                       |  + Auth)    |
                                       +-------------+
```

---

## Relation to Claudex

AirHunt consumes airdrop data from Claudex:
- Campaign listings (Tier, tasks, deadlines, referral links)
- Claudex API serves as the data source / CMS
- AirHunt is the user-facing app for personal management
- research-project.ts adds campaigns to Claudex -> auto-available in AirHunt

---

## Key Design Principles

- Mobile-first (thumb-friendly UI)
- Beginners as primary target (simple, guided UX)
- No private key storage (read-only wallet tracking)
- Referral links always marked as PR
- DYOR disclaimer on all campaign pages
- Japanese + English bilingual
- Dark theme (purple primary, zinc neutrals, true black bg)

---

## Key Rules (Lessons Learned)

1. **ALWAYS use `npx expo install`** for Expo packages, never `npm install`
2. **NEVER use npm workspaces** with Expo Router projects
3. **ALWAYS start with `-c` flag** after config changes
4. **Prisma v7**: No `url` in schema.prisma, use prisma.config.ts
5. **iOS Expo Go**: QR scan requires Expo Go app, uses standard camera
6. **Same Wi-Fi required** for LAN mode; `--tunnel` as fallback
7. **skipLibCheck: true** in tsconfig for React 19 + RN compatibility
8. **Supabase keys**: Use `sb_publishable_...` (not legacy anon key)
9. **EXPO_PUBLIC_ prefix** required for env vars accessible in client
