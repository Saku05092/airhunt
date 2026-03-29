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
| Mobile | React Native + Expo (TypeScript) | Not started |
| Web | Next.js | Not started |
| Backend API | Express + tRPC | Not started |
| Database | PostgreSQL (Supabase) | Not started |
| Auth | Supabase Auth (Google/Apple/Email) | Not started |
| Push Notifications | Expo Push Notifications | Not started |
| State Management | Zustand | Not started |
| Airdrop Data | Claudex API integration | Not started |

---

## Business Model

- **Free**: 1 wallet, basic task management, referral links (monetization via referrals)
- **Pro** (~$9.99/mo): 10 wallets, advanced features
- **Unlimited** (~$29.99/mo): 50+ wallets, all features
- **Revenue**: Referral commissions + subscription

---

## Development Phases & Progress

### Phase 1: MVP [IN PROGRESS]

#### 1a: Foundation (Week 1)
- [ ] Expo project initialization
- [ ] Monorepo setup (apps/mobile, apps/web, packages/)
- [ ] Supabase project setup
- [ ] Database schema design (Prisma)
- [ ] Auth (Google/Apple/Email)
- [ ] Basic navigation structure

#### 1b: Core Features (Week 2-3)
- [ ] Airdrop campaign management (CRUD)
- [ ] Claudex data import
- [ ] Task management (per campaign x per wallet)
- [ ] Template tasks from Claudex
- [ ] User custom task creation
- [ ] Checklist UI with completion tracking

#### 1c: Wallet & Intelligence (Week 3-4)
- [ ] Wallet address registration (multi-wallet)
- [ ] Chain selection (ETH, ARB, OP, Base, Polygon, Solana)
- [ ] Wallet labeling
- [ ] Deadline reminder notifications (7d, 3d, 1d, 0d)
- [ ] Tier-based priority display (S/A/B/C)
- [ ] "Today's Tasks" view
- [ ] Priority sorting (expected value x deadline proximity)

#### 1d: Monetization & Polish (Week 4-5)
- [ ] Referral link integration (CTA buttons in campaign details)
- [ ] UTM tracking for referral attribution
- [ ] UI/UX polish
- [ ] App icon and branding
- [ ] Onboarding flow

#### Testing & Launch (Week 5-6)
- [ ] E2E testing
- [ ] App Store submission (iOS)
- [ ] Google Play submission (Android)
- [ ] Landing page

### Phase 2: On-Chain Intelligence [NOT STARTED]
- [ ] On-chain activity auto-detection (Etherscan/Alchemy APIs)
- [ ] Protocol interaction history
- [ ] Activity timestamps and frequency
- [ ] Gas cost tracking
- [ ] Bridge count/amount tracking
- [ ] Swap count/amount tracking
- [ ] LP provision status
- [ ] NFT mint history
- [ ] Wallet-to-wallet progress comparison dashboard

### Phase 3: Scaling [NOT STARTED]
- [ ] Subscription payment (Stripe / RevenueCat)
- [ ] 50+ wallet support
- [ ] Points/XP balance tracking
- [ ] Referral performance analytics
- [ ] Web app (Next.js)
- [ ] Advanced notifications (Telegram/Discord integration)

---

## Database Schema (Draft)

```
users
  id, email, auth_provider, plan (free/pro/unlimited), created_at

wallets
  id, user_id, address, chain, label, is_primary, created_at

campaigns (airdrop campaigns)
  id, name, ticker, category, chain, tier (S/A/B/C),
  status (active/upcoming/ended), tge_completed,
  description, estimated_value, funding_raised,
  website, twitter, referral_link, referral_reward,
  deadline, added_at, source (claudex/manual)

campaign_tasks (template tasks per campaign)
  id, campaign_id, title, description, sort_order, is_template

wallet_tasks (task completion per wallet)
  id, wallet_id, campaign_task_id, completed, completed_at, notes

user_campaigns (user's tracked campaigns)
  id, user_id, campaign_id, priority_override, notes, added_at

notifications
  id, user_id, campaign_id, type (deadline/reminder),
  scheduled_at, sent_at, status
```

---

## Commands

```bash
# Mobile
cd apps/mobile && npx expo start

# Web
cd apps/web && npm run dev

# Database
npx prisma migrate dev
npx prisma studio

# API
cd packages/api && npm run dev
```

---

## Relation to Claudex

AirHunt consumes airdrop data from Claudex:
- Campaign listings (Tier, tasks, deadlines, referral links)
- Claudex dashboard serves as the data source / CMS
- AirHunt is the user-facing app for personal management

---

## Key Design Principles

- Mobile-first (thumb-friendly UI)
- Beginners as primary target (simple, guided UX)
- No private key storage (read-only wallet tracking)
- Referral links always marked as PR
- DYOR disclaimer on all campaign pages
- Japanese + English bilingual
