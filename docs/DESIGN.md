# AirHunt - Design Specification

## Brand Identity

- **Name**: AirHunt
- **Tagline**: "エアドロを、逃さない。" / "Never miss a drop."
- **Colors**:
  - Primary: #6366F1 (Indigo)
  - Accent: #F59E0B (Amber - for deadlines/urgency)
  - Success: #10B981 (Green)
  - Background: #0F172A (Dark navy)
  - Surface: #1E293B
  - Text: #F1F5F9

## Screen Flow (MVP)

```
[Splash] -> [Onboarding] -> [Main]

Main (Tab Navigation):
  [Dashboard]  - Today's tasks, upcoming deadlines
  [Campaigns]  - All tracked airdrop campaigns
  [Wallets]    - Wallet management
  [Settings]   - Account, notifications, subscription
```

## Key Screens

### 1. Dashboard (Home)
```
+----------------------------------+
|  AirHunt              [bell]     |
+----------------------------------+
|  TODAY'S PRIORITY                |
|  +----------------------------+  |
|  | [S] edgeX - 2 days left   |  |
|  |     "XP登録を完了"         |  |
|  |     Wallet: メイン [done]  |  |
|  |     Wallet: サブ1 [todo]   |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | [A] Linea - no deadline    |  |
|  |     "ブリッジする"          |  |
|  |     Wallet: メイン [todo]  |  |
|  +----------------------------+  |
+----------------------------------+
|  UPCOMING DEADLINES              |
|  edgeX      Mar 31  [2d]        |
|  OpenSea    TBD     [--]        |
+----------------------------------+
|  PROGRESS                        |
|  edgeX    ████████░░ 80%         |
|  Linea    ███░░░░░░░ 30%         |
|  Eclipse  ░░░░░░░░░░ 0%          |
+----------------------------------+
| [Dashboard] [Campaigns] [Wallet] |
+----------------------------------+
```

### 2. Campaign Detail
```
+----------------------------------+
|  <- Back                         |
+----------------------------------+
|  [S] edgeX                       |
|  $EDGE | Perp DEX | Ethereum     |
|  Est: $500-3,000+ | Deadline: 2d |
+----------------------------------+
|  DESCRIPTION                     |
|  Amber Group支援の高性能Perp     |
|  DEX。TGE 3/31。25%エアドロ...   |
+----------------------------------+
|  TASKS         [+ Add Task]      |
|                                  |
|  Wallet: メイン (0x1234...abcd)  |
|  [x] XP登録を完了                |
|  [x] edgeXで取引してXPを獲得    |
|  [ ] リファーラルで友人招待       |
|  [ ] Pre-TGE Seasonに参加       |
|                                  |
|  Wallet: サブ1 (0x5678...efgh)   |
|  [ ] XP登録を完了                |
|  [ ] edgeXで取引してXPを獲得    |
|  [ ] リファーラルで友人招待       |
|  [ ] Pre-TGE Seasonに参加       |
+----------------------------------+
|  [Register via Referral]  PR     |
+----------------------------------+
|  DYOR - NFA                      |
+----------------------------------+
```

### 3. Wallet Overview
```
+----------------------------------+
|  MY WALLETS        [+ Add]       |
+----------------------------------+
|  メイン                          |
|  0x1234...abcd | Ethereum        |
|  Tracking: 5 campaigns           |
|  Completed: 12/20 tasks          |
|  +----------------------------+  |
|  | edgeX    ████████░░ 80%   |  |
|  | Linea    ███░░░░░░░ 30%   |  |
|  | Eclipse  ░░░░░░░░░░ 0%    |  |
|  +----------------------------+  |
+----------------------------------+
|  サブ1                           |
|  0x5678...efgh | Arbitrum        |
|  Tracking: 3 campaigns           |
|  Completed: 2/15 tasks           |
+----------------------------------+
```

## Interaction Patterns

- **Swipe right on task**: Mark as complete
- **Long press on campaign**: Quick actions (priority, archive)
- **Pull down**: Refresh data
- **Tap deadline badge**: Set/edit reminder

## Typography

- Headlines: Inter Bold
- Body: Inter Regular
- Monospace (addresses): JetBrains Mono

## Accessibility

- Minimum touch target: 44x44pt
- Color contrast: WCAG AA compliant
- Support for system dark/light mode (dark default)
