# AirHunt Security Guidelines

## Architecture Security Requirements

### Rust API (services/api/)
- ALL endpoints must be authenticated (Supabase JWT or API key)
- CORS must restrict to known origins
- Inbound rate limiting required (tower-governor or similar)
- All wallet addresses must be validated before use in URLs
- Use URL encoding for all query parameters

### Mobile App (apps/mobile/)
- Never store private keys or seed phrases
- Read-only wallet tracking only
- All external URLs wrapped in try/catch before Linking.openURL
- No console.log with sensitive data in production
- Plan gating checked server-side (not just client-side)

### Supabase
- RLS enabled on ALL tables
- Every table must have SELECT, INSERT, UPDATE, DELETE policies
- Trigger functions use SECURITY DEFINER + SET search_path = public
- Never expose service_role key to client

## Input Validation Rules

| Input | Validation |
|---|---|
| EVM address | `^0x[0-9a-fA-F]{40}$` |
| Solana address | `^[1-9A-HJ-NP-Za-km-z]{32,44}$` |
| Chain | Enum: ethereum, arbitrum, optimism, base, polygon, solana |
| URL | try/catch new URL(), protocol must be https or http |
| Campaign ID | Alphanumeric + hyphens only |

## Numeric Precision

- Wei calculations: ALWAYS BigInt (TypeScript) or U256 (Rust)
- Never convert BigInt to Number for arithmetic
- Convert to float only for final display formatting
