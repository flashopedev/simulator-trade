# 🎯 HL SIMULATOR — IMPLEMENTATION PLAN

> **Для:** Claude Code
> **От:** Архитектор
> **Дата:** 5 февраля 2026
> **Статус:** READY TO EXECUTE

---

## 📋 ОБЗОР ПРОЕКТА

**Цель:** Создать демо-торговую платформу для отработки стратегий, аналог https://app.hyperliquid.xyz/trade

**Стек:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Vercel (деплой)

**Платформы:** iPhone Safari, MacBook Chrome/Safari

---

## 🏗️ АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌─────────┐  ┌───────────┐  ┌─────────┐                   │
│  │  Trade  │  │ Portfolio │  │ Faucet  │                   │
│  │  Page   │  │   Page    │  │  Page   │                   │
│  └────┬────┘  └─────┬─────┘  └────┬────┘                   │
│       │             │              │                        │
│  ┌────┴─────────────┴──────────────┴────┐                  │
│  │           SHARED COMPONENTS           │                  │
│  │  Chart, OrderBook, OrderForm,         │                  │
│  │  Positions, Navigation                │                  │
│  └────────────────┬─────────────────────┘                  │
│                   │                                         │
│  ┌────────────────┴─────────────────────┐                  │
│  │              HOOKS                    │                  │
│  │  useAuth, useTrading, useMarketData   │                  │
│  └────────────────┬─────────────────────┘                  │
└───────────────────┼─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────┴───────┐       ┌───────┴───────┐
│   SUPABASE    │       │  HYPERLIQUID  │
│  (Database)   │       │    (API)      │
│               │       │               │
│ • Auth        │       │ • Candles     │
│ • Positions   │       │ • OrderBook   │
│ • History     │       │ • Trades      │
│ • Balances    │       │ • WebSocket   │
└───────────────┘       └───────────────┘
```

---

## 📊 СХЕМА БАЗЫ ДАННЫХ

### Таблицы:

**1. demo_accounts**
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- balance: DECIMAL(20,2) DEFAULT 10000
- created_at, updated_at: TIMESTAMPTZ
```

**2. positions**
```sql
- id: UUID (PK)
- account_id: UUID (FK → demo_accounts)
- coin: VARCHAR(10) — 'HYPE', 'BTC', 'ETH', 'SOL'
- side: VARCHAR(5) — 'Long' | 'Short'
- size: DECIMAL(20,8)
- entry_price: DECIMAL(20,8)
- leverage: INTEGER (1-50)
- margin_mode: VARCHAR(10) — 'cross' | 'isolated'
- liquidation_price: DECIMAL(20,8)
- created_at: TIMESTAMPTZ
```

**3. order_history**
```sql
- id: UUID (PK)
- account_id: UUID (FK)
- coin, side, order_type, size, price, status, fee
- created_at: TIMESTAMPTZ
```

**4. trade_history**
```sql
- id: UUID (PK)
- account_id: UUID (FK)
- coin, side, size, entry_price, exit_price
- pnl: DECIMAL(20,8)
- leverage: INTEGER
- liquidated: BOOLEAN
- closed_at: TIMESTAMPTZ
```

**5. demo_fund_requests**
```sql
- id: UUID (PK)
- account_id: UUID (FK)
- amount: DECIMAL(20,2)
- status, created_at
```

---

## 📁 СТРУКТУРА ФАЙЛОВ

```
hl-simulator/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout + metadata
│   │   ├── page.tsx             # Redirect to /trade
│   │   ├── globals.css          # Global styles + CSS vars
│   │   ├── trade/
│   │   │   └── page.tsx         # MAIN TRADING PAGE
│   │   ├── portfolio/
│   │   │   └── page.tsx         # Portfolio overview
│   │   ├── faucet/
│   │   │   └── page.tsx         # Request demo funds
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts     # OAuth callback
│   │
│   ├── components/
│   │   ├── Navigation.tsx       # Top nav + mobile bottom nav
│   │   ├── AuthForm.tsx         # Login/Signup form
│   │   ├── Chart.tsx            # Candlestick chart (Canvas)
│   │   ├── OrderBook.tsx        # Bid/Ask orderbook
│   │   ├── RecentTrades.tsx     # Trade feed
│   │   ├── OrderForm.tsx        # Place order form
│   │   ├── Positions.tsx        # Open positions + history
│   │   ├── CoinSelector.tsx     # Coin tabs + stats
│   │   └── Notification.tsx     # Toast notifications
│   │
│   ├── hooks/
│   │   ├── useAuth.ts           # Supabase auth + account
│   │   ├── useTrading.ts        # Position CRUD + PnL
│   │   └── useMarketData.ts     # WebSocket + API data
│   │
│   └── lib/
│       ├── utils.ts             # Helpers, constants
│       ├── hyperliquid.ts       # API + WebSocket client
│       └── supabase/
│           ├── client.ts        # Browser client
│           ├── server.ts        # Server client
│           └── types.ts         # Database types
│
├── supabase/
│   └── schema.sql               # Full DB schema
│
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── .env.example
└── .gitignore
```

---

## ✅ EXECUTION STEPS

### PHASE 1: PROJECT SETUP

**Step 1.1 — Initialize Next.js**
```bash
npx create-next-app@latest hl-simulator \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm
```

**Step 1.2 — Install dependencies**
```bash
cd hl-simulator
npm install @supabase/supabase-js @supabase/ssr lightweight-charts lucide-react clsx tailwind-merge
```

**Step 1.3 — Create .env.local**
```
NEXT_PUBLIC_SUPABASE_URL=<from_supabase_dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from_supabase_dashboard>
```

---

### PHASE 2: SUPABASE SETUP

**Step 2.1 — Create Supabase project**
- Go to supabase.com
- Create new project
- Copy URL and anon key

**Step 2.2 — Run SQL schema**
- Open SQL Editor in Supabase
- Execute schema from `supabase/schema.sql`
- Verify tables created

**Step 2.3 — Enable Auth**
- Authentication → Providers → Enable Email
- Disable email confirmation (for testing)

---

### PHASE 3: CORE INFRASTRUCTURE

**Step 3.1 — Supabase clients**
- Create `src/lib/supabase/client.ts` (browser)
- Create `src/lib/supabase/server.ts` (server)
- Create `src/lib/supabase/types.ts` (DB types)

**Step 3.2 — Utils**
- Create `src/lib/utils.ts`
- Add: cn(), formatNumber(), calculateLiquidationPrice(), calculatePnl()
- Add: COIN_DECIMALS, SUPPORTED_COINS, TIMEFRAMES

**Step 3.3 — Hyperliquid API**
- Create `src/lib/hyperliquid.ts`
- Implement: fetchCandles(), fetchL2Book()
- Implement: HyperliquidWebSocket class
- Add: fallback data generators

---

### PHASE 4: HOOKS

**Step 4.1 — useAuth hook**
- Auth state management
- Auto-create demo_account on signup
- Balance update function

**Step 4.2 — useMarketData hook**
- WebSocket connection
- Candles, orderbook, trades state
- Price subscription
- Fallback simulation

**Step 4.3 — useTrading hook**
- Load positions/history from Supabase
- placeOrder() — create position
- closePosition() — close with PnL
- checkLiquidations() — auto-liquidate

---

### PHASE 5: COMPONENTS

**Step 5.1 — Layout components**
- Navigation.tsx (desktop + mobile nav)
- AuthForm.tsx (login/signup)
- Notification.tsx (toasts)

**Step 5.2 — Trading components**
- Chart.tsx (Canvas candlestick)
- OrderBook.tsx (bid/ask table)
- RecentTrades.tsx (trade feed)
- OrderForm.tsx (place order)
- Positions.tsx (positions + history tabs)
- CoinSelector.tsx (coin tabs + 24h stats)

---

### PHASE 6: PAGES

**Step 6.1 — Trade page** (`/trade`)
- Main trading interface
- Grid layout: chart + orderbook + form + positions
- Mobile responsive

**Step 6.2 — Portfolio page** (`/portfolio`)
- Account overview cards
- Positions table
- Trade history table

**Step 6.3 — Faucet page** (`/faucet`)
- Amount selector
- Request button
- Request history

**Step 6.4 — Auth callback** (`/auth/callback`)
- Handle OAuth redirect
- Exchange code for session

---

### PHASE 7: STYLING

**Step 7.1 — Tailwind config**
- Add custom colors (bg, s1-s5, brd, t1-t4, acc, grn, red)
- Add font-family

**Step 7.2 — Global CSS**
- CSS variables
- Scrollbar styling
- Form input styling
- Animations (pulse, slide, spin)

**Step 7.3 — Mobile responsive**
- Test on 375px (iPhone SE)
- Test on 390px (iPhone 14)
- Test on 1440px (MacBook)

---

### PHASE 8: TESTING & DEPLOY

**Step 8.1 — Local testing**
```bash
npm run dev
```
- Test signup/login
- Test placing orders
- Test closing positions
- Test faucet
- Test on mobile (localhost on phone)

**Step 8.2 — Build check**
```bash
npm run build
```
- Fix any TypeScript errors
- Fix any lint errors

**Step 8.3 — Deploy to Vercel**
```bash
vercel
```
- Add environment variables
- Set up Redirect URL in Supabase

---

## 🎨 DESIGN SPECS

### Colors (CSS Variables)
```css
--bg: #000000
--s1: #060809
--s2: #0d0f10
--s3: #141617
--s4: #1b1d1f
--s5: #222426
--brd: #151718
--t1: #eef0f2 (primary text)
--t2: #a0a4a8 (secondary)
--t3: #686c70 (muted)
--t4: #3e4245 (disabled)
--acc: rgb(80,210,193) (teal accent)
--grn: #22c55e (long/profit)
--red: #ef4444 (short/loss)
```

### Typography
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Base size: 12px
- Tabular nums for prices

### Layout
- Desktop: 2-column grid (chart left, orderbook+form right)
- Mobile: single column, scrollable

---

## 🔗 API REFERENCE

### Hyperliquid API
```
POST https://api.hyperliquid.xyz/info

// Get candles
{ "type": "candleSnapshot", "req": { "coin": "HYPE", "interval": "15m", "startTime": ..., "endTime": ... }}

// Get orderbook
{ "type": "l2Book", "coin": "HYPE" }
```

### Hyperliquid WebSocket
```
wss://api.hyperliquid.xyz/ws

// Subscribe
{ "method": "subscribe", "subscription": { "type": "allMids" }}
{ "method": "subscribe", "subscription": { "type": "trades", "coin": "HYPE" }}
{ "method": "subscribe", "subscription": { "type": "l2Book", "coin": "HYPE" }}
{ "method": "subscribe", "subscription": { "type": "candle", "coin": "HYPE", "interval": "15m" }}
```

---

## ⚡ CRITICAL FORMULAS

### Liquidation Price
```typescript
// Long position
liqPrice = entryPrice * (1 - 0.95 / leverage)

// Short position
liqPrice = entryPrice * (1 + 0.95 / leverage)
```

### PnL Calculation
```typescript
// Long
pnl = (currentPrice - entryPrice) * size

// Short
pnl = (entryPrice - currentPrice) * size
```

### ROE (Return on Equity)
```typescript
margin = (size * entryPrice) / leverage
roe = (pnl / margin) * 100
```

### Fee
```typescript
fee = notional * 0.0005 // 0.05%
```

---

## 📝 NOTES FOR CLAUDE CODE

1. **Reference files exist** in `/hl-simulator` — use as templates
2. **Mobile-first** — test responsive at every step
3. **TypeScript strict** — no `any` types
4. **Error handling** — always try/catch API calls
5. **State sync** — keep Supabase and local state in sync
6. **Fallback data** — always have simulated data if API fails

---

## ✅ DEFINITION OF DONE

- [ ] Can signup/login with email
- [ ] Trade page shows real-time chart from Hyperliquid
- [ ] Can place Long/Short orders
- [ ] Positions show with live PnL
- [ ] Can close positions
- [ ] Liquidations work automatically
- [ ] Portfolio shows all account data
- [ ] Faucet adds USDC to balance
- [ ] Works on iPhone Safari
- [ ] Works on MacBook Chrome
- [ ] Deployed to Vercel

---

**START EXECUTION FROM PHASE 1**
