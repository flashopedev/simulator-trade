# 🏗️ TASK: Phase 2 - Rebuild Layout (EXACT COPY)

## 🎯 OBJECTIVE
Rebuild entire layout to **EXACTLY** match Hyperliquid original. No creativity - pure 1:1 copy.

---

## 📖 REFERENCE
Read this first: `/sessions/adoring-determined-thompson/mnt/simulator-trade/HYPERLIQUID_REFERENCE_DESIGN.md`

This contains EXACT specifications from original Hyperliquid.

---

## ⚠️ CRITICAL RULES

1. **NO CREATIVITY** - Copy exactly pixel by pixel
2. **Use exact colors** from reference (#00d8c4, #0a0f14, etc)
3. **Use exact dimensions** (280px sidebar, 200px bottom panel, etc)
4. **Use exact layout structure** (grid as shown)
5. **Test on real browser** after each change

---

## 📋 TASKS

### Task 2.1: Update Color Scheme
**File:** `src/app/globals.css`

**Replace colors:**
```css
/* OLD (wrong) */
--bg: (whatever was there)
--primary: cyan/teal

/* NEW (correct) */
:root {
  --bg-main: #0a0f14;
  --bg-secondary: #0f1419;
  --bg-third: #151b21;

  --text-primary: #ffffff;
  --text-secondary: #8a949e;
  --text-dim: #6b7280;

  --accent-buy: #00d8c4;  /* NOT green! */
  --color-green: #00c076;
  --color-red: #ff4976;
  --color-blue: #0066ff;

  --border: #1a1f2e;
  --border-hover: #2a3544;
}
```

**Apply to all components** - replace old color classes.

---

### Task 2.2: Rebuild Trade Page Grid
**File:** `src/app/trade/page.tsx`

**New structure:**
```tsx
<div className="min-h-screen bg-bg-main">
  <Navigation />

  <CoinInfoBar /> {/* NEW component */}

  <div className="grid" style={{
    gridTemplateColumns: "1fr 280px",
    gridTemplateRows: "1fr 200px",
    height: "calc(100vh - 120px)"
  }}>
    {/* Left: Chart + Volume */}
    <div className="row-span-2">
      <Chart />
    </div>

    {/* Right: Order Form + Order Book (sticky) */}
    <div className="sticky top-0 h-screen overflow-y-auto">
      <OrderForm />
      <OrderBookTabs /> {/* NEW: tabs Order Book | Trades */}
    </div>

    {/* Bottom: Tabs Panel (fixed height) */}
    <div className="col-span-2 h-[200px] border-t border-border">
      <BottomTabsPanel /> {/* NEW component */}
    </div>
  </div>
</div>
```

**Key specs:**
- Right sidebar: **280px fixed width**
- Bottom panel: **200px fixed height**
- Chart: fills remaining space

---

### Task 2.3: Create CoinInfoBar Component
**File:** `src/components/CoinInfoBar.tsx` (NEW)

**Layout:**
```tsx
<div className="h-[60px] border-b border-border bg-bg-secondary">
  <div className="flex items-center gap-8 px-4 h-full">
    {/* Coin Selector */}
    <button className="flex items-center gap-2">
      <CoinIcon /> {/* Icon */}
      HYPE/USDC
      <ChevronDown />
    </button>

    {/* Price */}
    <div>
      <div className="text-[10px] text-text-dim">Price</div>
      <div className="text-[20px] font-bold">{price}</div>
    </div>

    {/* 24H Change */}
    <div>
      <div className="text-[10px] text-text-dim">24H Change</div>
      <div className={change >= 0 ? "text-color-green" : "text-color-red"}>
        {change}
      </div>
    </div>

    {/* 24H Volume */}
    <div>
      <div className="text-[10px] text-text-dim">24H Volume</div>
      <div>{volume} USDC</div>
    </div>

    {/* Market Cap */}
    ...

    {/* Contract */}
    ...
  </div>
</div>
```

**Specs:**
- Height: 60px
- Background: `#0f1419`
- Border bottom: 1px
- Flex layout, horizontal
- Gap: 8px between items

---

### Task 2.4: Rebuild OrderForm (Sticky)
**File:** `src/components/OrderForm.tsx`

**Structure:**
```tsx
<div className="w-[280px] border-l border-border bg-bg-secondary">
  {/* Tabs */}
  <div className="flex border-b border-border">
    <button className={active === 'market' ? "tab-active" : "tab"}>
      Market
    </button>
    <button className={active === 'limit' ? "tab-active" : "tab"}>
      Limit
    </button>
    <button className="tab">
      Pro <ChevronDown />
    </button>
  </div>

  {/* Buy/Sell Toggle */}
  <div className="flex p-4 gap-2">
    <button className="flex-1 bg-accent-buy rounded">Buy</button>
    <button className="flex-1 bg-bg-third rounded">Sell</button>
  </div>

  {/* Available Balance */}
  <div className="px-4 py-2">
    <div className="text-[11px] text-text-dim">Available to Trade</div>
    <div className="text-[14px]">{balance} USDC</div>
  </div>

  {/* Price (only for Limit) */}
  {orderType === 'limit' && (
    <div className="px-4 py-2">
      <div className="flex justify-between">
        <label className="text-[11px]">Price (USDC)</label>
        <button className="text-[11px] text-color-blue">Mid</button>
      </div>
      <input type="number" value={price} />
    </div>
  )}

  {/* Size */}
  <div className="px-4 py-2">
    <div className="flex justify-between">
      <label className="text-[11px]">Size</label>
      <select>
        <option>HYPE</option>
      </select>
    </div>
    <input type="number" value={size} />
  </div>

  {/* Slider */}
  <div className="px-4 py-2">
    <input type="range" min="0" max="100" value={percent} />
    <div className="text-[11px] text-text-dim text-right">{percent}%</div>
  </div>

  {/* TIF (Time In Force) - only for Limit */}
  {orderType === 'limit' && (
    <div className="px-4 py-2">
      <label className="text-[11px]">TIF</label>
      <select>
        <option>GTC</option>
        <option>IOC</option>
        <option>FOK</option>
      </select>
    </div>
  )}

  {/* Submit Button */}
  <div className="px-4 py-2">
    <button className="w-full py-4 bg-accent-buy rounded font-bold">
      {side === 'buy' ? 'Buy' : 'Sell'} {orderType === 'market' ? 'Market' : 'Limit'}
    </button>
  </div>

  {/* Connect Button (if not connected) */}
  {!connected && (
    <div className="px-4 py-2">
      <button className="w-full py-4 bg-accent-buy rounded">
        Connect
      </button>
    </div>
  )}

  {/* Order Details */}
  <div className="px-4 py-2 text-[11px]">
    <div className="flex justify-between">
      <span className="text-text-dim">Order Value</span>
      <span>{orderValue || 'N/A'}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-text-dim">Slippage</span>
      <span>Est: 0% / Max: 8.00%</span>
    </div>
    <div className="flex justify-between">
      <span className="text-text-dim">Fees</span>
      <span>0.0700% / 0.0400%</span>
    </div>
  </div>
</div>
```

**Specs:**
- Width: 280px fixed
- Sticky positioning
- No TP/SL fields in form! (установка через Edit на позиции)

---

### Task 2.5: Create OrderBookTabs Component
**File:** `src/components/OrderBookTabs.tsx` (NEW)

**Structure:**
```tsx
<div className="border-t border-border">
  {/* Tabs */}
  <div className="flex">
    <button className={active === 'book' ? "tab-active" : "tab"}>
      Order Book
    </button>
    <button className={active === 'trades' ? "tab-active" : "tab"}>
      Trades
    </button>
  </div>

  {active === 'book' ? (
    <OrderBook />
  ) : (
    <RecentTrades />
  )}
</div>
```

---

### Task 2.6: Update OrderBook Component
**File:** `src/components/OrderBook.tsx`

**Add spread row:**
```tsx
{/* Asks */}
{asks.map((ask) => (
  <div className="flex justify-between text-color-red">
    <span>{ask.price}</span>
    <span>{ask.size}</span>
    <span>{ask.total}</span>
  </div>
))}

{/* SPREAD - NEW! */}
<div className="flex justify-center py-1 bg-bg-third border-y border-border">
  <span className="text-[11px]">Spread</span>
  <span className="ml-2">{spread.toFixed(3)}</span>
  <span className="ml-2 text-text-dim">{spreadPercent.toFixed(3)}%</span>
</div>

{/* Bids */}
{bids.map((bid) => (
  <div className="flex justify-between text-color-green">
    <span>{bid.price}</span>
    <span>{bid.size}</span>
    <span>{bid.total}</span>
  </div>
))}
```

**Add precision selector:**
```tsx
<div className="flex justify-between px-2 py-1">
  <select className="text-[11px]">
    <option>0,001</option>
    <option>0,01</option>
    <option>0,1</option>
  </select>

  <select className="text-[11px]">
    <option>HYPE</option>
  </select>
</div>
```

---

### Task 2.7: Create BottomTabsPanel Component
**File:** `src/components/BottomTabsPanel.tsx` (NEW)

**Structure:**
```tsx
<div className="h-[200px] bg-bg-secondary border-t border-border">
  {/* Tabs */}
  <div className="flex gap-2 px-4 py-2 border-b border-border">
    <button className={active === 'balances' ? "tab-active" : "tab"}>
      Balances
    </button>
    <button className={active === 'positions' ? "tab-active" : "tab"}>
      Positions
    </button>
    <button className={active === 'orders' ? "tab-active" : "tab"}>
      Open Orders
    </button>
    <button className="tab">TWAP</button>
    <button className="tab">Trade History</button>
    <button className="tab">Funding History</button>
    <button className="tab">Order History</button>

    {/* Right side */}
    <div className="ml-auto flex gap-2">
      <button className="tab">
        Filter <ChevronDown />
      </button>
      <label>
        <input type="checkbox" />
        Hide Small Balanc
      </label>
    </div>
  </div>

  {/* Content */}
  <div className="h-[calc(200px-40px)] overflow-y-auto">
    {active === 'balances' && <BalancesTab />}
    {active === 'positions' && <PositionsTab />}
    {active === 'orders' && <OpenOrdersTab />}
    ...
  </div>
</div>
```

**Specs:**
- Height: 200px fixed
- Scrollable content area
- Tabs horizontal
- Filter + checkbox right aligned

---

### Task 2.8: Create PositionsTab Component
**File:** `src/components/PositionsTab.tsx` (NEW)

**Table columns (EXACT):**
```
Coin | Size | Position Value↕ | Entry Price | Mark Price | PNL (ROE %) | Liq. Price | Margin | Funding
```

**Add actions column (hidden initially, показывается on hover):**
```tsx
<td>
  <button onClick={() => handleEdit(position)}>Edit</button>
  <button onClick={() => handleClose(position)}>Close</button>
</td>
```

**Edit button → Opens modal:**
```tsx
<Modal>
  <h3>Edit Position</h3>

  {/* TP/SL Fields */}
  <label>
    Take Profit
    <input type="number" />
  </label>

  <label>
    Stop Loss
    <input type="number" />
  </label>

  <button>Save</button>
</Modal>
```

**Close button → Opens modal:**
```tsx
<Modal>
  <h3>Close Position</h3>

  <p>Current size: {position.size}</p>

  <label>
    Close size
    <input type="number" max={position.size} />
  </label>

  <button>Close Partial</button>
  <button>Close All</button>
</Modal>
```

---

### Task 2.9: Create OpenOrdersTab Component
**File:** `src/components/OpenOrdersTab.tsx` (NEW)

**Table columns:**
```
Time | Type | Coin | Direction | Size | Original Size | Order Value↕ | Price | Reduce Only | Trigger Conditions | TP/SL
```

**Each row has Cancel button:**
```tsx
<button onClick={() => cancelOrder(order.id)}>Cancel</button>
```

---

### Task 2.10: Update Mobile Responsive
**Files:** All components

**Breakpoints:**
```css
/* Mobile (< 768px) */
@media (max-width: 768px) {
  /* Stack vertically */
  .grid {
    grid-template-columns: 1fr;
    grid-template-rows: 50vh auto auto;
  }

  /* Right sidebar becomes bottom */
  .order-form {
    width: 100%;
    position: relative;
  }

  /* Bottom panel smaller */
  .bottom-panel {
    height: 150px;
  }
}
```

---

## ✅ ACCEPTANCE CRITERIA

After implementation:
- [ ] Layout matches screenshot exactly
- [ ] Colors match (`#00d8c4` buy button, etc)
- [ ] Dimensions match (280px sidebar, 200px bottom)
- [ ] Order form sticky on scroll
- [ ] Bottom panel fixed 200px height
- [ ] Spread highlighted in order book
- [ ] Tabs работают (Order Book / Trades)
- [ ] Bottom tabs работают (9 tabs total)
- [ ] Edit position opens modal with TP/SL fields
- [ ] Close position allows partial close
- [ ] Mobile responsive (stacked layout)

---

## 🧪 TESTING

1. Open: http://localhost:3000/trade
2. Compare side-by-side with: https://app.hyperliquid.xyz/trade
3. Check:
   - Layout identical?
   - Colors match?
   - Sizes match?
   - All buttons work?
   - Tabs switch correctly?
   - Modal popups work?

4. Test mobile (resize browser to 375px width)
5. Test tablet (768px width)

---

## ⏱️ ESTIMATED TIME
4-6 hours

---

## 🚀 DEPLOYMENT

After all tasks + tests pass:
```bash
git add .
git commit -m "feat: rebuild layout to match Hyperliquid original exactly"
git push origin main
```

---

## 📝 NOTES

- **NO creativity!** Copy exactly what you see in reference
- **Test frequently** - after each task
- **Ask if unclear** - better to clarify than guess
- **Mobile is important** - many users on mobile
- **TP/SL через Edit**, NOT в order form!

---

**START WITH TASK 2.1 (colors) - это фундамент!**
