# 🚀 TASK: Phase 1 - Fix Real-Time Updates

## 🎯 OBJECTIVE
Fix critical issue: "Ничего не обновляется" - make prices, order book, and PnL update live.

---

## 📋 CONTEXT

**Problem**: User reports nothing updates, WebSocket in fallback mode, app feels "broken"

**Root Cause**:
1. WebSocket disconnects after initial load
2. Fallback simulation doesn't update state
3. Price updates don't trigger rerender
4. checkLiquidations doesn't run regularly

**Files to modify**:
- `src/hooks/useMarketData.ts`
- `src/app/trade/page.tsx`
- `src/hooks/useTrading.ts`

---

## 📝 TASKS

### Task 1.1: Fix WebSocket Reconnection
**File**: `src/hooks/useMarketData.ts`

**Current issue**: WebSocket disconnects and never reconnects

**Fix**:
1. Add reconnect logic with exponential backoff
2. Add connection state management (connecting, connected, disconnected, error)
3. Add ping/pong to keep connection alive
4. Better error handling

**Implementation**:
```typescript
// Add reconnection logic
const [reconnectAttempts, setReconnectAttempts] = useState(0);
const maxReconnectAttempts = 5;
const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

// In WebSocket error/close handler:
if (reconnectAttempts < maxReconnectAttempts) {
  setTimeout(() => {
    setReconnectAttempts(prev => prev + 1);
    // reconnect logic
  }, reconnectDelay);
}

// Add heartbeat
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ method: 'ping' }));
  }
}, 30000);
```

---

### Task 1.2: Add REST API Polling Fallback
**File**: `src/hooks/useMarketData.ts`

**Current issue**: When WebSocket fails, fallback simulation is static

**Fix**: Add REST API polling to Hyperliquid as fallback

**Implementation**:
```typescript
// Add polling function
const pollMarketData = async () => {
  try {
    // Fetch from Hyperliquid REST API
    const response = await fetch(`https://api.hyperliquid.xyz/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'metaAndAssetCtxs'
      })
    });

    const data = await response.json();

    // Update state with real data
    setPrice(data[coin].markPx);
    // ... update other data
  } catch (error) {
    console.error('Polling failed:', error);
    // Fall back to simulation
  }
};

// If WebSocket fails, start polling
useEffect(() => {
  if (!isConnected) {
    const interval = setInterval(pollMarketData, 2000);
    return () => clearInterval(interval);
  }
}, [isConnected, coin]);
```

---

### Task 1.3: Fix Price Updates for All Coins
**File**: `src/app/trade/page.tsx`

**Current issue**: prices state only updates for currently selected coin

**Fix**: Track prices for ALL coins, not just selected one

**Implementation**:
```typescript
// Current (BAD):
useEffect(() => {
  if (price) {
    setPrices((prev) => ({ ...prev, [coin]: price }));
  }
}, [coin, price]);

// Fixed (GOOD):
useEffect(() => {
  // Fetch prices for ALL coins periodically
  const fetchAllPrices = async () => {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
      });

      const data = await response.json();

      const allPrices: Record<string, number> = {};
      data.forEach((asset: any) => {
        allPrices[asset.name] = parseFloat(asset.markPx);
      });

      setPrices(allPrices);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  };

  fetchAllPrices();
  const interval = setInterval(fetchAllPrices, 2000); // Every 2 seconds

  return () => clearInterval(interval);
}, []);
```

---

### Task 1.4: Fix checkLiquidations to Run Regularly
**File**: `src/app/trade/page.tsx`

**Current issue**: checkLiquidations runs but prices don't update

**Fix**: Ensure it runs every 5 seconds with updated prices

**Implementation**:
```typescript
// Current:
useEffect(() => {
  const timer = setInterval(() => {
    checkLiquidations(prices);
  }, 5000);
  return () => clearInterval(timer);
}, [checkLiquidations, prices]);

// This is OK, but make sure prices dependency works
// Add useCallback to checkLiquidations in useTrading.ts
```

---

### Task 1.5: Force PnL Recalculation
**File**: `src/components/Positions.tsx`

**Current issue**: PnL doesn't update visually

**Fix**: Add key prop to force rerender when prices change

**Implementation**:
```typescript
// In Positions component
{positions.map((p) => {
  const currentPrice = currentPrices[p.coin] || p.entry_price;
  const pnl = calculatePnl(p.entry_price, currentPrice, p.size, p.side === 'Long');

  return (
    <tr key={`${p.id}-${currentPrice}`}> // Add currentPrice to key
      {/* ... rest of row */}
    </tr>
  );
})}
```

---

### Task 1.6: Add Visual Feedback for Updates
**File**: `src/components/OrderBook.tsx` and `src/components/RecentTrades.tsx`

**Fix**: Add flash animation when prices update

**Implementation**:
```typescript
// Add flash effect
const [flashPrices, setFlashPrices] = useState<Set<number>>(new Set());

useEffect(() => {
  // When price changes, add to flash set
  setFlashPrices(new Set([newPrice]));

  // Remove after 300ms
  setTimeout(() => {
    setFlashPrices(new Set());
  }, 300);
}, [price]);

// In render:
<div className={flashPrices.has(price) ? 'flash-green' : ''}>
  {price}
</div>

// CSS:
.flash-green {
  animation: flashGreen 300ms ease-out;
}

@keyframes flashGreen {
  0% { background-color: rgba(0, 255, 0, 0.3); }
  100% { background-color: transparent; }
}
```

---

## ✅ ACCEPTANCE CRITERIA

After implementation:
- [ ] Prices update every 1-2 seconds (visible change)
- [ ] Order book updates live
- [ ] Recent trades update live
- [ ] PnL recalculates automatically (numbers change)
- [ ] "Connected" status shows green (or "Polling" if fallback)
- [ ] No console errors
- [ ] checkLiquidations runs every 5 seconds
- [ ] Price flash animation shows on update

---

## 🧪 TESTING STEPS

1. Open https://hl-simulator.vercel.app/trade
2. Watch top coin price - should change every 1-2 seconds
3. Open a Long position
4. Watch Unrealized PnL - should update as price changes
5. Check order book - numbers should change
6. Check recent trades - new trades appear
7. Check connection status - should be "Connected" or "Polling"

---

## 📊 ESTIMATED TIME
2-3 hours

---

## ⚠️ IMPORTANT NOTES

1. **Test locally first** before deploying to Vercel
2. **Commit after each task** - git commit after 1.1, 1.2, etc.
3. **If Hyperliquid API blocks**, simulation fallback is OK but it MUST update
4. **Don't break existing functionality** - market orders should still work

---

## 🚀 DEPLOYMENT

After all tasks complete and tested:
```bash
git add .
git commit -m "fix: implement real-time price updates and WebSocket reconnection"
git push origin main
```

Vercel will auto-deploy.

---

## 📝 REPORT BACK

When done, provide:
1. ✅ Confirmation all tasks complete
2. 📊 Screenshot showing live price updates
3. 🧪 Test results (all acceptance criteria passed)
4. 🐛 Any issues encountered
5. 📈 Connection status (WebSocket or Polling or Simulation)

---

**START EXECUTION NOW - This is the HIGHEST PRIORITY task!**
