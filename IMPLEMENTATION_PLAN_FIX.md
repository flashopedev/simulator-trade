# 🛠️ IMPLEMENTATION PLAN - Fix HL Simulator

## 🎯 GOAL
Transform HL Simulator to match Hyperliquid original functionality and design.

---

## 📊 EXECUTION PHASES

### PHASE 1: FIX CRITICAL REAL-TIME UPDATES (Priority 1) ⏱️ 2-3 hours

#### Problem:
- WebSocket в fallback mode
- Ничего не обновляется
- Prices статичные

#### Solution:

**Task 1.1: Fix WebSocket Connection**
```typescript
// File: src/hooks/useMarketData.ts

Problems:
1. WebSocket disconnects after initial load
2. Reconnect logic не работает
3. State updates не триггерят rerender

Fixes:
- Add reconnect with exponential backoff
- Keep connection alive with ping/pong
- Add connection state management
- Add error handling and fallback
```

**Task 1.2: Add Polling Fallback**
```typescript
// If WebSocket fails, use REST API polling

- Poll Hyperliquid REST API every 2 seconds
- Update prices, orderbook, trades
- Fallback to simulation if API blocked
```

**Task 1.3: Fix Price Updates**
```typescript
// File: src/app/trade/page.tsx

Problems:
- prices state не обновляется для всех coins
- checkLiquidations не срабатывает regularly
- PnL не пересчитывается

Fixes:
- Use useEffect with proper dependencies
- Update prices for ALL coins, not just selected
- checkLiquidations every 5 seconds
- Force rerender when prices change
```

**Acceptance Criteria**:
- ✅ Prices update live (every 1-2 seconds)
- ✅ Order book updates live
- ✅ PnL recalculates automatically
- ✅ Green "Connected" status показывается

---

### PHASE 2: FIX LAYOUT & STRUCTURE (Priority 1) ⏱️ 2-3 hours

#### Problem:
- Layout не соответствует Hyperliquid
- Order form не sticky
- Bottom panel маленький
- Нет tabs

#### Solution:

**Task 2.1: Restructure Trade Page Layout**
```typescript
// File: src/app/trade/page.tsx

New structure:
┌────────────────────────────────────────────┐
│ Navigation (fixed top)                     │
├─────────────────────┬──────────────────────┤
│                     │  ORDER FORM (sticky) │
│   CHART             │  - Market/Limit tabs │
│   (60% height)      │  - Buy/Sell toggle   │
│                     │  - Size/Leverage     │
│                     │  - TP/SL checkboxes  │
│─────────────────────┤  - [Place Order]     │
│ ORDER BOOK (20%)    │                      │
├─────────────────────┤                      │
│ RECENT TRADES (20%) │                      │
├─────────────────────┴──────────────────────┤
│ BOTTOM TABS (200px fixed height)           │
│ [Positions] [Orders] [Fills] [Funding]     │
│ ┌────────────────────────────────────────┐ │
│ │ Active tab content                     │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘

CSS:
- Right sidebar: position: sticky, top: 0, height: 100vh
- Bottom panel: height: 200px (fixed), overflow-y: auto
- Chart: flex-grow: 1
```

**Task 2.2: Add Bottom Tabs Component**
```typescript
// File: src/components/BottomTabs.tsx

Create new component:
- Tabs: Positions | Orders | Fills | Funding
- State management for active tab
- Content area for each tab
- Proper styling (dark theme, compact)

Content per tab:
- Positions: Open positions table
- Orders: Pending limit orders table
- Fills: Order history (filled orders)
- Funding: Funding payments history
```

**Task 2.3: Make Order Form Sticky**
```typescript
// File: src/components/OrderForm.tsx

Changes:
- Add sticky positioning
- Full height (100vh)
- Scrollable if content overflows
- Always visible on scroll
```

**Acceptance Criteria**:
- ✅ Layout matches Hyperliquid
- ✅ Order form sticky справа
- ✅ Bottom tabs работают
- ✅ Responsive на mobile

---

### PHASE 3: ADD TP/SL FUNCTIONALITY (Priority 2) ⏱️ 2-3 hours

#### Problem:
- Нет TP/SL полей
- Нет логики установки
- Нет автозакрытия по TP/SL

#### Solution:

**Task 3.1: Update Database Schema**
```sql
// Add to positions table:
ALTER TABLE positions
ADD COLUMN take_profit DECIMAL(20,8) NULL,
ADD COLUMN stop_loss DECIMAL(20,8) NULL;
```

**Task 3.2: Update OrderForm Component**
```typescript
// File: src/components/OrderForm.tsx

Add fields:
- TP/SL checkboxes
- TP price input (показывается если checked)
- SL price input (показывается если checked)
- Validation (TP > entry for long, TP < entry for short)
```

**Task 3.3: Add TP/SL Logic**
```typescript
// File: src/hooks/useTrading.ts

Add function: checkTPSL(positions, currentPrices)
- Loop through positions
- Check if price hit TP or SL
- Auto-close position
- Record in trade_history with reason

Run every 2 seconds in background
```

**Task 3.4: UI for Setting TP/SL on Existing Position**
```typescript
// File: src/components/Positions.tsx

Add:
- Edit button for each position
- Modal/dropdown to set TP/SL
- Save to database
- Update UI immediately
```

**Acceptance Criteria**:
- ✅ Can set TP/SL on new orders
- ✅ Can edit TP/SL on open positions
- ✅ Auto-close when TP/SL hit
- ✅ Notification shown

---

### PHASE 4: FIX LIMIT ORDERS SYSTEM (Priority 2) ⏱️ 3-4 hours

#### Problem:
- Limit orders исполняются мгновенно
- Нет pending orders
- Нет Orders tab

#### Solution:

**Task 4.1: Create Pending Orders Table**
```sql
CREATE TABLE pending_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES demo_accounts(id),
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL,
  order_type VARCHAR(10) NOT NULL,
  size DECIMAL(20,8) NOT NULL,
  limit_price DECIMAL(20,8) NOT NULL,
  leverage INTEGER NOT NULL,
  margin_mode VARCHAR(10) NOT NULL,
  tp_price DECIMAL(20,8) NULL,
  sl_price DECIMAL(20,8) NULL,
  status VARCHAR(10) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_orders_account ON pending_orders(account_id);
```

**Task 4.2: Update placeOrder Logic**
```typescript
// File: src/hooks/useTrading.ts

Change:
- If orderType === 'market': execute immediately (current logic)
- If orderType === 'limit': insert into pending_orders table
- Do NOT create position yet
- Return success with "Order placed" message
```

**Task 4.3: Add Order Execution Background Job**
```typescript
// File: src/hooks/useOrderExecution.ts

Create new hook:
- Load all pending orders for account
- Check current price vs limit price
- If price matches:
  - Long: currentPrice <= limitPrice (buy when price drops)
  - Short: currentPrice >= limitPrice (sell when price rises)
- Execute order: create position, move to order_history
- Delete from pending_orders

Run every 2 seconds
```

**Task 4.4: Create Orders Tab Component**
```typescript
// File: src/components/OrdersTab.tsx

Show pending orders:
- Table: Market | Side | Size | Limit Price | Status | Actions
- Cancel button for each order
- Edit button (change price/size)
- Filter: All | Buy | Sell
```

**Task 4.5: Add to BottomTabs**
```typescript
// Integrate OrdersTab into BottomTabs component
// Show in Orders tab
```

**Acceptance Criteria**:
- ✅ Limit orders go to pending_orders
- ✅ Execute when price matches
- ✅ Orders tab shows pending orders
- ✅ Can cancel/edit orders

---

### PHASE 5: FIX PORTFOLIO PAGE (Priority 3) ⏱️ 2-3 hours

#### Problem:
- Layout не соответствует Hyperliquid
- Нет PnL chart
- Нет tabs
- Нет Analytics

#### Solution:

**Task 5.1: Restructure Portfolio Layout**
```typescript
// File: src/app/portfolio/page.tsx

New structure:
1. Account Overview (5 cards in row)
   - Account Value
   - Margin Used
   - Unrealized PnL
   - Today's PnL
   - All Time PnL

2. Tabs: Overview | History | Analytics

3. Overview Tab:
   - Open Positions table
   - Open Orders table
   - PnL Chart

4. History Tab:
   - All closed trades
   - Filters by date, coin, side

5. Analytics Tab:
   - Win rate
   - Average PnL
   - Best/Worst trades
   - PnL by coin
```

**Task 5.2: Add PnL Chart**
```typescript
// File: src/components/PnLChart.tsx

Use lightweight-charts:
- Line chart showing account value over time
- Toggle: 1D | 1W | 1M | All
- Hover tooltip with date and value
- Green/Red color based on profit/loss

Data source:
- Create account_snapshots table (store balance every hour)
- Or calculate from trade_history
```

**Task 5.3: Add Today's PnL Calculation**
```typescript
// Calculate PnL for today (00:00 - now)
- Sum closed trades from today
- Add unrealized PnL from open positions
- Show as card in overview
```

**Task 5.4: Add Analytics Tab**
```typescript
// File: src/components/AnalyticsTab.tsx

Stats:
- Total trades
- Win rate (% profitable)
- Average profit per trade
- Average loss per trade
- Best trade (highest PnL)
- Worst trade (lowest PnL)
- PnL by coin (bar chart)
- PnL by side (Long vs Short)
```

**Acceptance Criteria**:
- ✅ 5 cards in overview
- ✅ PnL chart works
- ✅ Tabs work (3 tabs)
- ✅ Analytics show stats

---

### PHASE 6: INTERACTIVE ORDER BOOK (Priority 4) ⏱️ 1-2 hours

#### Problem:
- Цены не кликабельны
- Нет depth visualization
- Spread не выделен

#### Solution:

**Task 6.1: Make Prices Clickable**
```typescript
// File: src/components/OrderBook.tsx

Add onClick handler:
- Click price in order book
- Autofill price in OrderForm
- Focus size input
- Highlight clicked price
```

**Task 6.2: Add Depth Bars**
```typescript
// Show depth visualization:
- Background bar behind each price level
- Width = cumulative size / max size
- Green for bids, Red for asks
- Gradient effect
```

**Task 6.3: Highlight Spread**
```typescript
// Between asks and bids:
- Show spread value (askPrice - bidPrice)
- Different background color
- Larger font
```

**Acceptance Criteria**:
- ✅ Prices clickable
- ✅ Depth bars show
- ✅ Spread highlighted

---

### PHASE 7: UI POLISH (Priority 5) ⏱️ 2-3 hours

#### Problem:
- Colors не точно как Hyperliquid
- Spacing не такой
- Typography мелкие отличия

#### Solution:

**Task 7.1: Update Color Scheme**
```css
// Update globals.css

Match Hyperliquid exactly:
--bg: #0a0e12 (darker)
--primary: #0066ff (blue, not cyan)
--buy: #00c076 (green)
--sell: #ff4976 (red)
--border: #1a1f2e (darker borders)
```

**Task 7.2: Adjust Spacing**
```css
// Make more compact:
- Reduce padding in tables
- Smaller gaps between sections
- Denser order book rows
- Tighter form fields
```

**Task 7.3: Typography**
```css
// Use mono font for all numbers:
font-family: 'JetBrains Mono', monospace;

// Smaller font sizes to match Hyperliquid
```

**Acceptance Criteria**:
- ✅ Colors match exactly
- ✅ Spacing more compact
- ✅ Fonts match

---

## 📊 EXECUTION ORDER

### SPRINT 1 (Day 1): Critical Fixes
- ✅ Phase 1: Real-time updates (MUST HAVE)
- ✅ Phase 2: Layout restructure (MUST HAVE)

### SPRINT 2 (Day 2): Core Features
- ✅ Phase 3: TP/SL functionality
- ✅ Phase 4: Limit orders system

### SPRINT 3 (Day 3): Portfolio & Polish
- ✅ Phase 5: Portfolio page
- ✅ Phase 6: Interactive order book
- ✅ Phase 7: UI polish

---

## 🎯 TESTING CHECKLIST

After each phase:

**Phase 1 Test**:
- [ ] Prices update every 1-2 seconds
- [ ] Order book live updates
- [ ] PnL recalculates automatically
- [ ] "Connected" status shows

**Phase 2 Test**:
- [ ] Order form sticky on scroll
- [ ] Bottom tabs switch correctly
- [ ] Layout matches Hyperliquid
- [ ] Mobile responsive works

**Phase 3 Test**:
- [ ] Can set TP/SL on new order
- [ ] Can edit TP/SL on position
- [ ] Auto-close when TP hit
- [ ] Auto-close when SL hit

**Phase 4 Test**:
- [ ] Limit order goes to pending
- [ ] Executes when price matches
- [ ] Shows in Orders tab
- [ ] Can cancel pending order

**Phase 5 Test**:
- [ ] 5 cards show correct data
- [ ] PnL chart displays
- [ ] Tabs work (3 tabs)
- [ ] Analytics show stats

**Phase 6 Test**:
- [ ] Click price fills order form
- [ ] Depth bars show
- [ ] Spread highlighted

**Phase 7 Test**:
- [ ] Colors match Hyperliquid
- [ ] Spacing compact
- [ ] Fonts match

---

## ⚠️ RISKS & MITIGATIONS

### Risk 1: WebSocket Banned by Hyperliquid
**Mitigation**: Use REST API polling + simulation fallback

### Risk 2: Too Many Changes Break Existing Code
**Mitigation**: Test after each phase, rollback if needed

### Risk 3: Mobile Breaks with New Layout
**Mitigation**: Test on mobile after Phase 2

---

## 📝 NOTES FOR CLAUDE CODE

1. **Start with Phase 1** - это самое критичное
2. **Test after each task** - не делать все сразу
3. **Commit after each phase** - чтобы можно было rollback
4. **Ask if unclear** - лучше уточнить чем сделать неправильно

---

*Plan created: 5 февраля 2026*
*Estimated total time: 15-20 hours*
*Priority: Start with Phase 1 (real-time updates) immediately*
