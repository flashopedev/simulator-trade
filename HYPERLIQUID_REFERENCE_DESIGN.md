# 🎨 HYPERLIQUID REFERENCE DESIGN - Точные спецификации

## 📊 ИСТОЧНИК
Изучено через Claude in Chrome: https://app.hyperliquid.xyz/trade
Дата: 5 февраля 2026

---

## 🎯 TRADE PAGE LAYOUT

### Структура (Grid):
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Trade | Portfolio | ... | Connect | Settings    │
├─────────────────────────────────────────────────┬───────────────┤
│ Coin Info Bar:                                  │               │
│ HYPE/USDC | Price | 24H Change | Volume | etc  │               │
├─────────────────────────────────────────────────┤ ORDER FORM    │
│                                                 │ (Sticky       │
│                                                 │  Right        │
│            CHART (TradingView)                  │  Sidebar)     │
│                                                 │               │
│                                                 │ Market/Limit  │
│                                                 │ Buy/Sell      │
│  Left sidebar:                                  │ Size          │
│  - Drawing tools                                │ Slider        │
│  - Indicators                                   │ TIF           │
│  - Zoom                                         │ [Buy button]  │
│  - etc                                          │               │
│                                                 │ Connect btn   │
│                                                 │ Order Value   │
│  Volume chart below                             │ Slippage      │
│                                                 │ Fees          │
│                                                 │               │
│                                                 │ Order Book    │
│                                                 │ | Trades      │
│                                                 │ (tabs)        │
│                                                 │               │
│                                                 │ [Order book   │
│                                                 │  or Recent    │
│                                                 │  trades]      │
├─────────────────────────────────────────────────┴───────────────┤
│ BOTTOM TABS PANEL (Fixed height ~200px)                        │
│ [Balances] [Positions] [Open Orders] [TWAP] [Trade History]    │
│ [Funding History] [Order History] [Filter ▼]                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Active Tab Content (Table)                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 COLORS (EXACT)

### Background:
- Main BG: `#0a0f14` (очень тёмный, почти черный с зеленоватым оттенком)
- Secondary panels: `#0f1419` (чуть светлее)
- Third level: `#151b21`

### Text:
- Primary text: `#ffffff` (white)
- Secondary text: `#8a949e` (gray)
- Dimmed text: `#6b7280`

### Accent Colors:
- Primary (Buy button): `#00d8c4` (голубой/teal) - **НЕ зелёный!**
- Green (prices up): `#00c076`
- Red (prices down): `#ff4976`
- Blue (links/info): `#0066ff`

### Borders:
- Border color: `#1a1f2e` (очень тёмный)
- Hover border: `#2a3544`

---

## 📋 TOP BAR (Coin Selector)

### Layout:
```
┌─ HYPE/USDC ▼ ─┬─ Price ─┬─ 24H Change ─┬─ 24H Volume ─┬─ Market Cap ─┬─ Contract ─┐
│ Coin dropdown │ 32,569   │ -1,362/-4.02%│ 243M USDC    │ 9.7B USDC    │ 0x0d01..   │
└───────────────┴──────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

### Specs:
- Height: ~60px
- Background: `#0f1419`
- Border bottom: 1px solid `#1a1f2e`
- Coin selector: Dropdown с иконкой монеты
- Price: Large, white
- 24H Change: Red/Green зависит от значения
- Все в одной строке, равномерно распределены

---

## 📊 CHART AREA

### Specs:
- **TradingView embedded chart** (не lightweight-charts!)
- Occupies: ~60-70% высоты viewport
- Background: `#0a0f14`
- **Left sidebar (vertical):**
  - Drawing tools icons (line, trend, shapes, etc)
  - Indicators button
  - Settings
  - Fullscreen
  - Width: ~40px
  - Background: slightly lighter than chart

### Timeframes:
```
[5m] [1h] [D] [Settings icon]
```
- Position: Below coin selector, above chart
- Active timeframe: Highlighted

### Volume Chart:
- Below main chart
- Height: ~20% of chart height
- Green/Red bars
- Labeled "Volume 137,553K"

---

## 📝 ORDER FORM (Right Sidebar)

### Dimensions:
- Width: ~280px (fixed)
- Position: **Sticky right** (не скроллится)
- Height: 100vh (full height)
- Background: `#0f1419`
- Border left: 1px solid `#1a1f2e`

### Tabs:
```
[Market] [Limit] [Pro ▼]
```
- Active tab: White text
- Inactive: Gray text
- Bottom border on active

### Market Tab Content:
```
┌─────────────────────────┐
│ [Buy] [Sell]            │ ← Toggle buttons
│                         │
│ Available to Trade      │
│ 0.00 USDC              │
│                         │
│ Size             HYPE▼ │ ← Input + dropdown
│ [___________]           │
│                         │
│ [●━━━━━━━━━━] 0%       │ ← Slider
│                         │
│ [     Buy Market     ]  │ ← Large button (teal)
└─────────────────────────┘
```

### Limit Tab Content (добавляет):
```
Price (USDC)      [Mid]
[32,533]

TIF              [GTC ▼]
```

### Below Order Form:
```
┌─────────────────────────┐
│ [   Connect Wallet   ]  │ ← If not connected
│                         │
│ Order Value      N/A    │
│ Slippage   0% / Max 8%  │
│ Fees    0.07% / 0.04%   │
└─────────────────────────┘
```

---

## 📖 ORDER BOOK (Right Sidebar, Below Form)

### Tabs:
```
[Order Book] [Trades]
```

### Order Book Tab:
```
Precision: [0,001 ▼]     HYPE ▼

Price        Size (HYPE)   Total (HYPE)
32,711       322,57        1 840,16      ← Red (asks)
32,710       274,78        1 517,59
32,708       13,43         1 242,81
32,706       0,37          1 229,38
─────────────────────────────────────
Spread   0,030   0,092%               ← Highlighted row
─────────────────────────────────────
32,613       245,10        245,10       ← Green (bids)
32,612       93,36         338,46
32,611       66,67         405,13
```

### Specs:
- Height: ~300-400px
- Scrollable
- **Spread row:** Different background, centered text
- Asks: Red text
- Bids: Green text
- Depth bars: Background bars за текстом (width = cumulative volume)

### Trades Tab:
```
Price        Size (HYPE)   Time
32,665       3,00          11:29:17 🕐
32,663       0,92          11:29:16 🕐
32,663       0,42          11:29:14 🕐
```

### Specs:
- Green/Red text зависит от Buy/Sell
- Time с точностью до секунды
- Clock icon справа
- Live updates (новые trades flash)

---

## 📊 BOTTOM TABS PANEL

### Tabs (Horizontal):
```
[Balances] [Positions] [Open Orders] [TWAP] [Trade History]
[Funding History] [Order History] [Filter ▼] [☑ Hide Small Balanc]
```

### Specs:
- Height: **Fixed ~200px** (не resizable)
- Background: `#0f1419`
- Border top: 1px solid `#1a1f2e`
- Tabs: Horizontal, small text
- Active tab: White text + bottom border
- Right aligned: Filter dropdown + checkbox

---

### Balances Tab:
```
Coin | Total Balance | Available Balance | USDC Value | PNL (ROE %) | Contract
────────────────────────────────────────────────────────────────────────────
No balances yet
```

---

### Positions Tab:
```
Coin | Size | Position Value↕ | Entry Price | Mark Price | PNL (ROE %) | Liq. Price | Margin | Funding
─────────────────────────────────────────────────────────────────────────────────────────────────────────
No open positions yet
```

### Specs:
- Sortable columns (arrows on hover)
- PNL: Green/Red text with percentage
- Actions column (не показана): Close, Edit buttons

---

### Open Orders Tab:
```
Time | Type | Coin | Direction | Size | Original Size | Order Value↕ | Price | Reduce Only | Trigger Conditions | TP/SL
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
No open orders yet
```

### Specs:
- **Важно:** TP/SL это отдельная колонка (не в order form!)
- Reduce Only - checkbox column
- Trigger Conditions - для trigger orders

---

## 🎨 PORTFOLIO PAGE

### Layout:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Header: PORTFOLIO                                                    │
│ Buttons: [Link Staking] [Swap] ... [Deposit]                        │
├───────────────┬──────────────────────────────┬───────────────────────┤
│ 14 Day Volume │ Perps + Spot + Vaults ▼      │                       │
│ $0            │                              │                       │
│ View Volume   │ PNL         $0,00            │     [PNL Chart]       │
│               │ Volume      $0,00            │                       │
│ Fees          │ Max Drawdown 0,00%           │                       │
│ 0,0450%/      │ Total Equity $0,00           │                       │
│ 0,0150%       │ Perps Acct   $0,00           │                       │
│ View Fee Sched│ Spot Acct    $0,00           │                       │
│               │ Earn Balance $0,00           │                       │
├───────────────┴──────────────────────────────┴───────────────────────┤
│ TABS: [Balances] [Positions] [Open Orders] [TWAP] [Trade History]   │
│ [Funding History] [Order History] [Interest] [Deposits] [Filter]    │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Active Tab Content                                             │  │
│ └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Specs:
- **Title:** "Portfolio" - Large (32px+), left aligned
- **3-column layout:**
  - Left: Stats (200px width)
  - Center: Metrics list (300px width)
  - Right: Chart (flex-grow)
- **Tabs:** Same as trade page bottom panel
- **Background:** Darker green gradient (#0a1a1a to #0a0f14)

---

## 🔧 ФУНКЦИОНАЛ (ВАЖНОЕ!)

### TP/SL Система:
**ВАЖНО:** TP/SL **НЕ** в order form при создании!
- TP/SL устанавливается **на уже открытую позицию**
- В таблице Positions есть actions (edit/close)
- Clicking Edit → popup/modal для установки TP/SL

### Докупить Позицию:
- **НЕТ** отдельной кнопки "Add to Position"
- Просто открываешь ещё один ордер в том же direction
- Система автоматически увеличивает размер позиции
- Entry price пересчитывается (average)

### Закрыть Частично:
- В Positions table есть кнопка "Close"
- Clicking Close → popup с полем Size
- Можно ввести частичный размер
- Остаток позиции остаётся открытым

### Reduce Only:
- Checkbox в order form (появляется при Limit orders)
- Если checked - ордер только уменьшает позицию
- Не может открыть новую или увеличить

---

## 🎯 КЛЮЧЕВЫЕ ОТЛИЧИЯ ОТ ТЕКУЩЕЙ РЕАЛИЗАЦИИ

### 1. Layout:
❌ **Current:** Order form не sticky, bottom panel маленький
✅ **Target:** Order form sticky справа, bottom panel 200px fixed

### 2. Bottom Panel:
❌ **Current:** Только Positions + History в одном компоненте
✅ **Target:** 9 tabs (Balances, Positions, Open Orders, TWAP, Trade History, Funding History, Order History, Interest, Deposits)

### 3. Order Book:
❌ **Current:** Простой список, нет spread highlight
✅ **Target:** Spread выделен отдельной строкой, precision selector, tabs Order Book/Trades

### 4. Chart:
❌ **Current:** lightweight-charts
✅ **Target:** TradingView embedded

### 5. TP/SL:
❌ **Current:** В order form (не работает)
✅ **Target:** Устанавливается на позицию через Edit action

### 6. Portfolio:
❌ **Current:** Простые карточки, нет графика
✅ **Target:** 3-column layout, PNL chart, stats panel

### 7. Colors:
❌ **Current:** Cyan/Teal accent
✅ **Target:** `#00d8c4` teal для Buy, darker backgrounds

### 8. Positions Actions:
❌ **Current:** Только Close (весь размер)
✅ **Target:** Close (с partial size), Edit (для TP/SL)

---

## 📏 РАЗМЕРЫ (Pixels)

- **Header height:** 60px
- **Coin info bar:** 60px
- **Order form width:** 280px
- **Order book height:** 300-400px
- **Bottom panel height:** 200px (fixed)
- **Chart left sidebar:** 40px
- **Font sizes:**
  - Large price: 24px
  - Normal text: 13px
  - Small text: 11px
  - Tiny text: 9px

---

## 🎨 TYPOGRAPHY

- **Primary font:** Inter, -apple-system, sans-serif
- **Numbers font:** Tabular nums (monospace digits)
- **Font weights:**
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700

---

## ⚡ ANIMATIONS

- **Price updates:** Flash green/red background (300ms)
- **New trades:** Slide in from top with fade
- **Button hover:** Brightness 1.1 (10% brighter)
- **Tab switching:** Instant (no animation)

---

*Reference created: 5 февраля 2026*
*Source: https://app.hyperliquid.xyz/trade*
