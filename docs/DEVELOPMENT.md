# AirHunt - Development Log

## Project Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-03-29 | Project inception, requirements defined | Done |
| 2026-03-29 | GitHub repo created, CLAUDE.md written | Done |
| TBD | Expo + monorepo setup | Pending |
| TBD | DB schema + Supabase | Pending |
| TBD | Auth flow | Pending |
| TBD | Campaign management | Pending |
| TBD | Task management | Pending |
| TBD | Wallet registration | Pending |
| TBD | Notifications | Pending |
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

### ADR-005: Monorepo structure
- **Decision**: Turborepo monorepo with apps/ and packages/
- **Reason**: Shared types between mobile/web/api. Single repo
  for easier development. Shared linting and testing config.
- **Trade-off**: More complex initial setup.

---

## Sprint Log

### Sprint 0: Planning (2026-03-29)
- [x] Requirements gathering via user interview
- [x] MVP scope definition (6 core features)
- [x] Tech stack selection
- [x] Architecture decisions documented
- [x] GitHub repo created
- [x] CLAUDE.md created
- [ ] Expo project initialization
- [ ] Database schema implementation

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

## Open Questions

1. App icon design - need to create
2. Onboarding flow - how many steps?
3. Claudex API format - needs to be defined
4. Push notification frequency - user configurable?
5. Offline mode - cache campaigns and tasks locally?
