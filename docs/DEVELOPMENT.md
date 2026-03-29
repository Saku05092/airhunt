# AirHunt - Development Log

## Project Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-03-29 | Project inception, requirements defined | Done |
| 2026-03-29 | GitHub repo created, CLAUDE.md written | Done |
| 2026-03-29 | Expo + mobile app setup | Done |
| 2026-03-29 | DB schema (Prisma v7) | Done |
| 2026-03-29 | Mobile UI: 4 tabs + campaign detail | Done |
| 2026-03-29 | Expo Go confirmed working on device | Done |
| TBD | Supabase project + Auth | Pending |
| TBD | Claudex data import | Pending |
| TBD | User custom tasks | Pending |
| TBD | Push notifications | Pending |
| TBD | Referral integration | Pending |
| TBD | App Store submission | Pending |

---

## Architecture Decisions

### ADR-001: React Native + Expo over Flutter
- **Decision**: Use React Native with Expo
- **Reason**: TypeScript ecosystem shared with Claudex. Easier integration.
  Expo provides managed workflow for push notifications, OTA updates,
  and app store builds without native toolchain.
- **Trade-off**: Slightly less performant than Flutter for animations,
  but acceptable for a data-centric app.

### ADR-002: Supabase over custom backend
- **Decision**: Use Supabase for DB + Auth + Realtime
- **Reason**: Free tier is generous (500MB DB, 50K MAU auth).
  Built-in Row Level Security. Reduces backend boilerplate.
  PostgreSQL underneath = full SQL power.
- **Trade-off**: Vendor dependency. Can migrate to self-hosted Supabase
  or raw PostgreSQL later.

### ADR-003: Read-only wallet tracking
- **Decision**: No private key storage. Address input only.
- **Reason**: Security first. Users will never trust a new app with
  private keys. On-chain data is publicly readable by address.
- **Trade-off**: Cannot execute transactions from the app.
  Future consideration for WalletConnect integration.

### ADR-004: tRPC for API
- **Decision**: Use tRPC for type-safe API between mobile and backend
- **Reason**: End-to-end TypeScript type safety. No code generation
  needed. Works well with React Native via @trpc/react-query.
- **Trade-off**: Not RESTful (harder for third-party integration).
  Can add REST endpoints later if needed.

### ADR-005: No npm workspaces for Expo projects
- **Decision**: Do NOT use npm workspaces when Expo Router is involved
- **Reason**: npm workspaces hoists packages to the root node_modules,
  which breaks Expo Router's `require.context` resolution for
  `EXPO_ROUTER_APP_ROOT`. This causes a fatal web bundling error.
- **Fix applied**: Removed `workspaces` from root package.json.
  Each app/package manages its own node_modules independently.
- **Lesson**: Expo + monorepo requires careful setup. If monorepo
  tooling is needed later, use Expo's official monorepo guide with
  `expo-yarn-workspaces` or manual metro.config.js symlink resolution.

### ADR-006: Prisma v7 config format
- **Decision**: Use prisma.config.ts (not url in schema.prisma)
- **Reason**: Prisma v7 removed `url` from datasource block in schema.
  Connection URL must be configured in prisma.config.ts instead.
- **Migration note**: If upgrading from Prisma v6, remove `url = env("DATABASE_URL")`
  from schema.prisma and add it to prisma.config.ts.

---

## Troubleshooting Guide

### Expo Router "EXPO_ROUTER_APP_ROOT" error
```
Error: node_modules/expo-router/_ctx.web.js:Invalid call at line 2:
process.env.EXPO_ROUTER_APP_ROOT
```
**Cause**: npm workspaces or incorrect node_modules resolution.
**Fix**:
1. Remove `workspaces` from root package.json
2. Delete root `node_modules` and `package-lock.json`
3. Reinstall in apps/mobile: `cd apps/mobile && rm -rf node_modules package-lock.json && npm install`
4. Start with cache clear: `npx expo start -c`

### Package version compatibility warnings
```
The following packages should be updated for best compatibility...
```
**Fix**: Always use `npx expo install <package>` instead of `npm install` for Expo-related packages. This ensures SDK-compatible versions.

### Expo Go QR code not working (iOS)
**Symptoms**: Camera says "no usable data" or "can't access site"
**Fix**:
1. Install **Expo Go** from App Store (required)
2. iOS camera app scans QR -> should auto-open in Expo Go
3. If URL shows `localhost`, press `s` in terminal to switch to Expo Go mode (uses LAN IP)
4. PC and phone must be on the same Wi-Fi network
5. If still failing, use tunnel mode: `npx expo start -c --tunnel`

### Prisma v7 "Cannot find module 'prisma/config'"
**Cause**: prisma package not installed in the same directory as prisma.config.ts
**Fix**: `cd packages/db && npm install prisma @prisma/client`

---

## Sprint Log

### Sprint 0: Planning (2026-03-29)
- [x] Requirements gathering via user interview
- [x] MVP scope definition (6 core features)
- [x] Tech stack selection
- [x] Architecture decisions documented
- [x] GitHub repo created
- [x] CLAUDE.md created

### Sprint 1: Foundation (2026-03-29)
- [x] Expo project initialization (React Native + TypeScript)
- [x] Directory structure (apps/mobile, packages/db)
- [x] Expo Router with 4-tab navigation
- [x] Dashboard screen (stats, deadlines, progress bars)
- [x] Campaigns screen (tracked/available, add/remove)
- [x] Campaign Detail screen (task checklist per wallet)
- [x] Wallets screen (add/remove, chain selection)
- [x] Settings screen
- [x] Zustand store with sample data
- [x] Dark theme (AirHunt brand colors)
- [x] Prisma v7 schema (7 tables, validated)
- [x] Web bundling fix (workspaces conflict resolved)
- [x] Expo Go device testing confirmed

### Sprint 2: Core Features (2026-03-29 - 2026-03-30)
- [x] UI redesign: Discover/Dashboard split (was single Campaigns tab)
- [x] Discover tab: browse all campaigns with tier/value/tasks preview
- [x] Dashboard tab: tracked campaigns only with priority view
- [x] Modern dark theme (purple primary, zinc neutrals, true black)
- [x] Claudex REST API connection (auto-sync + pull-to-refresh)
- [x] Supabase project setup + SQL schema deployed (RLS enabled)
- [x] Supabase Auth (Email/Password sign in/up + skip for offline)
- [x] SecureStore token persistence
- [x] User custom task creation (inline form per wallet)
- [x] Today's Priority section (deadline < 7d, sorted by urgency x tier)
- [x] Referral CTA with UTM tracking (utm_source/medium/campaign/content)
- [x] PR badge + reward description on referral buttons
- [x] Twitter follow link + Share via Share API
- [x] Deadline push notifications (7d, 3d, 1d, 0d at 9:00 AM)
- [x] Auto-schedule on track, auto-cancel on untrack
- [x] Notification permission request on first launch

### Sprint 3: Polish & Launch [NOT STARTED]
- [ ] UI/UX polish and animation
- [ ] App icon and branding assets
- [ ] Onboarding flow (first-time user guide)
- [ ] Persist store to Supabase (sync wallets, tasks, campaigns)
- [ ] E2E testing
- [ ] App Store submission (iOS)
- [ ] Google Play submission (Android)
- [ ] Landing page (airhunt.app)

---

## Development Commands

```bash
# Start mobile dev server (recommended)
cd apps/mobile && npx expo start -c

# Start with tunnel (if LAN doesn't work)
cd apps/mobile && npx expo start -c --tunnel

# Web only
cd apps/mobile && npx expo start --web

# Install Expo-compatible packages (ALWAYS use this, not npm install)
cd apps/mobile && npx expo install <package-name>

# TypeScript check
cd apps/mobile && npx tsc --noEmit

# Prisma
cd packages/db && npx prisma validate
cd packages/db && npx prisma migrate dev
cd packages/db && npx prisma studio
```

---

## API Design (Draft)

### Campaigns
```
GET    /campaigns              # List all available campaigns
GET    /campaigns/:id          # Campaign details
POST   /campaigns/import       # Import from Claudex
POST   /campaigns              # Create custom campaign
PUT    /campaigns/:id          # Update campaign
DELETE /campaigns/:id          # Remove campaign
```

### User Campaigns (tracked by user)
```
GET    /me/campaigns           # User's tracked campaigns
POST   /me/campaigns           # Add campaign to tracking
DELETE /me/campaigns/:id       # Stop tracking
```

### Tasks
```
GET    /campaigns/:id/tasks    # List tasks for campaign
POST   /campaigns/:id/tasks    # Add custom task
PUT    /tasks/:id              # Update task
DELETE /tasks/:id              # Remove task
```

### Wallet Tasks (completion status)
```
GET    /wallets/:id/tasks      # All tasks for a wallet
PUT    /wallets/:wid/tasks/:tid  # Toggle task completion
GET    /wallets/:id/progress   # Progress summary per campaign
```

### Wallets
```
GET    /me/wallets             # User's wallets
POST   /me/wallets             # Add wallet
PUT    /me/wallets/:id         # Update label/chain
DELETE /me/wallets/:id         # Remove wallet
```

### Dashboard
```
GET    /me/dashboard/today     # Today's priority tasks
GET    /me/dashboard/upcoming  # Upcoming deadlines
GET    /me/dashboard/overview  # Overall progress stats
```

---

## Cost Tracking

| Item | Cost | Recurring |
|------|------|-----------|
| Supabase (Free) | $0 | Monthly |
| Expo (Free) | $0 | Monthly |
| Vercel (Free) | $0 | Monthly |
| Apple Developer | $99 | Yearly |
| Google Play | $25 | One-time |
| Domain (airhunt.app) | ~$12 | Yearly |
| **Total Year 1** | **~$136** | |

---

## Key Rules (Lessons Learned)

1. **ALWAYS use `npx expo install`** for Expo packages, never `npm install`
2. **NEVER use npm workspaces** with Expo Router projects
3. **ALWAYS start with `-c` flag** after config changes (`npx expo start -c`)
4. **Prisma v7**: No `url` in schema.prisma, use prisma.config.ts
5. **iOS Expo Go**: QR scan requires Expo Go app installed, uses camera app
6. **Same Wi-Fi required** for Expo Go LAN mode; use `--tunnel` as fallback
7. **skipLibCheck: true** in tsconfig.json for React 19 + React Native type compatibility

---

## Open Questions

1. App icon design - need to create
2. Onboarding flow - how many steps?
3. Claudex API format - needs to be defined
4. Push notification frequency - user configurable?
5. Offline mode - cache campaigns and tasks locally?
