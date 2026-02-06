# PHASE 5 — ФИНАЛЬНАЯ ДОВОДКА: Пропорции, цвета, размеры, Coin Selector

У меня 4 детальных скриншота реального Hyperliquid PERP view и 1 скриншот нашего симулятора. Ниже КАЖДОЕ отличие с точными размерами, цветами и пропорциями.

МЕТОД РАБОТЫ: Открой https://app.hyperliquid.xyz/trade в Chrome. Сверяй ВИЗУАЛЬНО каждый элемент ПИКСЕЛЬ В ПИКСЕЛЬ. Если сомневаешься — сделай скриншот в Chrome и сравни.

---

## === БЛОК А: КРИТИЧЕСКИЕ ПРОПУЩЕННЫЕ ФИЧИ ===

## A1 — COIN SELECTOR DROPDOWN (Самое важное упущение!)

При клике на "HYPE-USDC ▽" у HL открывается ПОЛНОЭКРАННЫЙ dropdown с поиском и таблицей ВСЕХ монет. Этого у нас НЕТ ВООБЩЕ.

### Как выглядит у HL:
```
┌──────────────────────────────────────────────────────────────────┐
│ 🔍 Search                                    [Strict] [All]  ⚙ ⛶│
├──────────────────────────────────────────────────────────────────┤
│ All │ Perps │ Spot │ Crypto │ Tradfi │ HIP-3 │ Trending │ Pre..│
├──────────────────────────────────────────────────────────────────┤
│ Symbol            Last Price  24H Change▽  8H Funding  Volume  OI│
│ ⭐ ADA-USDE 10x hyna  0.34550  +19.53%     -7.6619%   $218K  $27K│
│ ⭐ SKR-USDC 3x       0.020757  +19.38%     -0.0209%   $6M    $1.4M│
│ ⭐ ANTHROPIC-USDH 3x vntl  537.42  +5.38%   0.0319%  $78K   $354K│
│ ⭐ USBOND-USDH 10x km   87.602  +1.28%     0.0046%   $566K  $142K│
│ ...                                                              │
├──────────────────────────────────────────────────────────────────┤
│ ⌘K Open  ⚙ Navigate  Enter Select  ⌘S Favorite  Esc Close      │
└──────────────────────────────────────────────────────────────────┘
```

### Реализация — создать `CoinSelectorModal.tsx`:

**Компонент:** Модальное окно которое открывается поверх всей страницы при клике на coin name.

**Структура:**
1. **Search input** (top): `🔍 Search...` — фильтрует список в реальном времени
2. **Strict / All toggle** (top right): две кнопки, All = красный фон активен
3. **Category tabs**: All | Perps | Spot | Crypto | Tradfi | HIP-3 | Trending | Pre-launch
   - Для нашего симулятора достаточно: All | Perps (активный по дефолту)
   - Остальные — disabled/серые
4. **Таблица монет** с колонками:
   - ⭐ (star toggle)
   - Symbol: `BTC-USDC` + badges `10x` (cyan)
   - Last Price: `98,000`
   - 24H Change: `+2.34%` (зелёный) / `-1.5%` (красный)
   - 8H Funding: `0.0100%`
   - Volume: `$1.2B`
   - Open Interest: `$450M`
5. **Keyboard shortcuts bar** (bottom): ⌘K Open | Navigate | Enter Select | ⌘S Favorite | Esc Close

**Данные для таблицы (захардкодить для наших 4 монет):**
```typescript
const COINS_DATA = [
  { symbol: "HYPE-USDC", leverage: "10x", price: 33.07, change: -3.22, funding: 0.01, volume: "$254M", oi: "$156M" },
  { symbol: "BTC-USDC", leverage: "50x", price: 98000, change: +1.5, funding: 0.005, volume: "$1.2B", oi: "$890M" },
  { symbol: "ETH-USDC", leverage: "50x", price: 3200, change: -0.8, funding: 0.008, volume: "$450M", oi: "$320M" },
  { symbol: "SOL-USDC", leverage: "25x", price: 180, change: +2.1, funding: 0.012, volume: "$120M", oi: "$78M" },
];
```

**Стили модалки:**
```css
position: fixed;
inset: 0;
z-index: 100;
background: rgba(0, 0, 0, 0.7);
```

**Внутренний контейнер:**
```css
width: 800px (или 60vw);
max-height: 70vh;
background: var(--s1);
border: 1px solid var(--brd);
border-radius: 8px;
margin: 10vh auto;
overflow: hidden;
```

**При выборе монеты:** закрыть модалку + переключить coin в state.

**При нажатии Esc:** закрыть модалку.

---

## === БЛОК Б: ПРОПОРЦИИ И РАЗМЕРЫ ===

## B1 — Правый сайдбар: ШИРИНА 380px (не 300px!)

У HL правый сайдбар заметно ШИРЕ нашего. Примерно 370-380px.

### Исправить в `trade/page.tsx`:
```
// Было:
md:grid-cols-[1fr_300px]

// Стало:
md:grid-cols-[1fr_380px]
```

---

## B2 — CoinInfoBar: другой layout

### Как у HL (точный формат):
```
ROW 1 (отдельная линия, 20px от top):
⭐ (жёлтая, filled)

ROW 2 (основная строка, ~55px):
[●● icon 28px] [HYPE-USDC ▽ text-[18px] font-bold] [10x badge cyan bg]  |  Mark       |  Oracle    |  24H Change      |  24H Volume        |  Open Interest       |  Funding / Countdown
                                                                            32,848        32,830       -2,437 / -6.91%    $889,067,106.26      $776,444,885.12        0.0013%  00:27:53
```

### Формат каждого stat поля у HL (стек вертикально):
```
┌────────────────┐
│ Mark           │  ← label: text-[11px] text-t3, dotted underline, cursor-help
│ 32,848         │  ← value: text-[14px] text-t1
└────────────────┘
```

### Что НЕПРАВИЛЬНО у нас:
1. **"HYPE-PERP"** → должно быть **"HYPE-USDC"** (перп пары в HL пишутся через дефис: HYPE-USDC, не HYPE-PERP!)
2. **Цена 32.87 вынесена крупно рядом с названием** → У HL цены нет рядом с названием! Цена — это "Mark" в статах.
3. **Текст "Favorite"** рядом со звёздочкой → У HL звёздочка ОДНА, без текста, на ОТДЕЛЬНОЙ строке ВЫШЕ
4. **Labels в UPPERCASE** ("24H CHANGE") → У HL: "24H Change" (не капс, с dotted underline)
5. **Нет Oracle поля**
6. **Нет "10x" badge** рядом с именем монеты

### Исправления в `CoinInfoBar.tsx`:

**Убрать:**
- Крупную цену рядом с названием (переместить в "Mark")
- Текст "Favorite"
- UPPERCASE из labels
- "HYPE-PERP" формат

**Добавить:**
- "10x" badge: `<span className="ml-2 px-1.5 py-0.5 bg-acc text-black text-[11px] font-bold rounded">10x</span>`
- Oracle поле (oracle = mark price, или чуть отличается)
- Dotted underline на labels: `border-b border-dotted border-t4`

**Формат coin name:**
```tsx
<div className="flex items-center gap-2">
  {/* Coin icon */}
  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-acc to-blu flex items-center justify-center text-[11px] font-bold text-white">
    {selectedCoin.charAt(0)}
  </div>
  {/* Name + dropdown */}
  <span className="text-[18px] font-bold text-t1">{selectedCoin}-USDC</span>
  <ChevronDown size={16} className="text-t3" />
  {/* Leverage badge */}
  <span className="px-1.5 py-0.5 bg-acc text-black text-[11px] font-bold rounded">
    {leverage}x
  </span>
</div>
```

**Labels с dotted underline:**
```tsx
<div className="flex flex-col">
  <span className="text-[11px] text-t3 border-b border-dotted border-t4 cursor-help pb-0.5">
    Mark
  </span>
  <span className="text-[14px] text-t1 font-medium mt-0.5">
    {formatPrice(markPrice)}
  </span>
</div>
```

---

## B3 — Cross | 10x | Classic: точные пропорции

### Как у HL:
Три кнопки **РАВНОЙ ШИРИНЫ**, занимают **ВСЮ ширину** сайдбара, с **borders между ними**:
```
┌──────────┬──────────┬──────────┐
│  Cross   │   10x    │ Classic  │
└──────────┴──────────┴──────────┘
```
- Высота: ~40px
- Текст: text-[14px] font-medium
- Active (Cross и Classic): `text-t1 bg-s1`
- "10x": `text-acc` (бирюзовый текст!)
- Borders: `border border-brd`
- НЕТ скруглённых углов у отдельных кнопок — общий border вокруг всей группы

### Реализация:
```tsx
<div className="flex border-b border-brd">
  <button className="flex-1 py-2.5 text-[14px] font-medium text-center text-t1 border-r border-brd">
    Cross
  </button>
  <button className="flex-1 py-2.5 text-[14px] font-medium text-center text-acc border-r border-brd">
    {leverage}x
  </button>
  <button className="flex-1 py-2.5 text-[14px] font-medium text-center text-t1">
    Classic
  </button>
</div>
```

---

## B4 — Market | Limit | Pro: размер и стиль табов

### Как у HL:
```
    Market          Limit         Pro ▽
  ─────────────   ─────────     ────────
  (underline)
```
- Активный таб: `text-t1` + underline (border-bottom-2 border-t1)
- Неактивный: `text-t3`
- "Pro ▽": `text-t3` с dropdown arrow
- Текст: `text-[14px]`
- Padding: `px-6 py-3`
- Разделитель: `border-b border-brd` под всей строкой

---

## B5 — "Buy / Long" | "Sell / Short" кнопки: точный стиль

### Как у HL:
```
┌────────────────┬────────────────┐
│   Buy / Long   │  Sell / Short  │
└────────────────┴────────────────┘
```
- **Buy/Long активна**: `bg-acc text-black font-bold rounded-l-md py-2.5`
- **Sell/Short неактивна**: `bg-transparent text-t3 border border-brd rounded-r-md py-2.5`
- **Sell/Short активна**: `bg-red text-white font-bold rounded-r-md py-2.5`
- **Buy/Long неактивна**: `bg-transparent text-t3 border border-brd rounded-l-md py-2.5`
- Текст: `text-[14px]`
- СКРУГЛЕНИЕ: только left у Buy, только right у Sell. Между ними стыкуются.

---

## B6 — Size input и slider

### Как у HL:
- Label "Size" слева, `≈ $0.00` справа — text-[12px] text-t3
- Input: `bg-transparent border border-brd rounded px-3 py-2 text-[14px]`
- Справа в input: "HYPE ▽" dropdown
- Slider НИЖЕ: range input + text input "0" + "%" label
- Slider dots: тонкий трэк с МАЛЕНЬКИМИ точками на 0, 25, 50, 75, 100%

---

## B7 — Главная кнопка "Buy / Long" (submit)

### Как у HL:
- БОЛЬШАЯ кнопка во всю ширину
- Текст: **"Buy / Long"** (не "Buy Market"!)
- Buy: `bg-acc text-black py-3.5 rounded font-bold text-[15px]`
- Sell: `bg-red text-white py-3.5 rounded font-bold text-[15px]`
- Когда не залогинен: `bg-acc text-black` с текстом **"Connect"**

---

## === БЛОК В: ЦВЕТА ТЕКСТА ===

## C1 — Иерархия текста (важнейшее для "ощущения" правильности)

### HL использует чёткую иерархию:
- **Заголовки/значения**: `#ffffff` (text-t1) — белый
- **Вторичный текст**: `#8a949e` (text-t2) — серо-голубой
- **Labels/подписи**: `#6b7280` (text-t3) — тёмно-серый
- **Disabled/placeholder**: `#4b5563` (text-t4) — самый тёмный серый
- **Accent**: `#00d8c4` (text-acc) — бирюзовый (для active links, Buy, leverage)
- **Profit/positive**: `#00c076` (text-grn) — зелёный
- **Loss/negative**: `#ff4976` (text-red) — красно-розовый

### Где у нас НЕПРАВИЛЬНЫЕ цвета:
1. **"Equity $237,821.96"** в хедере — слишком яркий бирюзовый. Должен быть `text-t1` (белый) для суммы
2. **Labels в CoinInfoBar** — должны быть `text-t3` (тёмно-серый), не `text-t2`
3. **"Funding / Countdown"** label — у HL это `text-t3` с dotted underline
4. **10x в Cross/10x/Classic** — должен быть `text-acc` (бирюзовый), остальные `text-t1`
5. **"Available to Trade" label** — `text-t3`, значение `text-t1`
6. **"Current Position" label** — `text-t3`, значение `text-t1`
7. **Bottom panel tabs** — active: `text-t1 border-b-2 border-t1`, inactive: `text-t3`
8. **Order details labels** ("Liquidation Price", "Order Value") — `text-t3` с dotted underline!
9. **Slippage value** — `text-acc` (бирюзовый): "Est: 0% / Max: 8.00%"

---

## C2 — Dotted underline на ВСЕ интерактивные labels

У HL почти все labels в CoinInfoBar и Order Details имеют **пунктирное подчёркивание** (показывает что можно навести для tooltip). Это КРИТИЧНО для визуального ощущения.

Добавить глобальный CSS класс:
```css
.hl-label {
  font-size: 11px;
  color: var(--t3);
  border-bottom: 1px dotted var(--t4);
  cursor: help;
  padding-bottom: 1px;
}
```

Применить к: Mark, Oracle, 24H Change, 24H Volume, Open Interest, Funding/Countdown, Liquidation Price, Order Value, Margin Required, Slippage, Position Value, PNL (ROE %).

---

## === БЛОК Г: ПРОПУЩЕННЫЕ ЭЛЕМЕНТЫ ===

## D1 — Добавить "Fees" строку в order details

### HL показывает (screenshot 3, внизу правого сайдбара):
```
Liquidation Price          N/A
Order Value                N/A
Margin Required            N/A
Slippage           Est: 0% / Max: 8,00%
Fees              0,0450% / 0,0150%     ← ЭТО ТОЖЕ ЕСТЬ!
```

### Добавить в OrderForm.tsx ПОСЛЕ Slippage:
```tsx
<div className="flex justify-between">
  <span className="hl-label">Fees</span>
  <span className="text-t2 text-[12px]">0.0350% / 0.0100%</span>
</div>
```

---

## D2 — Order Book: ОТДЕЛЬНАЯ СЕКЦИЯ с табами "Order Book | Trades"

### Как у HL (screenshot 3):
```
┌─────────────────────────────────────┐
│  Order Book          Trades       ⋮ │  ← tabs + menu
├─────────────────────────────────────┤
│  0,001 ▽                    HYPE ▽  │  ← precision + unit
├─────────────────────────────────────┤
│  Price      Size (HYPE)  Total(HYPE)│
│  32,869       116.62      6,198.73  │  ← red asks
│  ...                                │
│  Spread      0,008       0,024%     │
│  ...                                │  ← green bids
└─────────────────────────────────────┘
```

### Что исправить:
1. Добавить tab **"Trades"** рядом с "Order Book"
2. Добавить иконку **⋮** (menu) справа от табов
3. Добавить **precision dropdown**: "0,001 ▽" (декоративный)
4. Добавить **unit dropdown**: "HYPE ▽" (декоративный)
5. Колонки: **Price | Size (HYPE) | Total (HYPE)** — показать "(HYPE)" в header!

---

## D3 — Bottom panel: колонка "Funding" в таблице Positions

### Как у HL (screenshot 3):
Positions table имеет колонки:
```
Coin | Size | Position Value ▽ | Entry Price | Mark Price | PNL (ROE %) | Liq. Price | Margin | Funding
```

### У нас нет колонки "Funding". Добавить:
- **Funding**: `+$0.00` / `−$0.00` — текущий накопленный funding для позиции
- Можно захардкодить `$0.00` для начала

---

## D4 — "Position Value" с dropdown сортировки

У HL "Position Value ▽" и "PNL (ROE %)" имеют **dropdown arrow** для сортировки. Добавить визуальную стрелку (▽) к этим заголовкам в таблице — декоративно.

---

## D5 — Logo "Hyperliquid" ТОНЬШЕ

### Как у HL:
"Hyperliquid" — `font-weight: 300` (light), `font-style: italic`, tracking-tight

### У нас:
Слишком жирный. Заменить:
```tsx
<span className="text-[16px] italic font-light text-t1 tracking-tight">Hyperliquid</span>
```

---

## D6 — Equity в header: формат

### Как у HL (когда залогинен):
Equity не показывается ярко-бирюзовым. Это просто число.

### Наш: "Equity **$237,821.96**" — бирюзовые цифры

### Исправить:
```tsx
<span className="text-[13px] text-t3 mr-1">Equity</span>
<span className="text-[13px] text-t1 font-medium">${balance.toLocaleString()}</span>
```
Убрать `text-acc` с цифры. Использовать `text-t1` (белый).

---

## === БЛОК Д: CHART НАСТРОЙКИ ===

## E1 — TradingView symbol: использовать Perpetual Contract

### Сейчас: `BYBIT:HYPEUSDT` → показывает "HYPEUSDT SPOT"
### Нужно: `BYBIT:HYPEUSDT.P` → покажет "HYPEUSDT Perpetual Contract"

Или попробовать:
- `BYBIT:HYPEUSDT.P`
- `BINANCE:HYPEUSDT.P`
- `OKX:HYPEUSDT.P`

В `TradingViewChart.tsx`:
```typescript
const symbolMap: Record<string, string> = {
  HYPE: "BYBIT:HYPEUSDT.P",
  BTC: "BINANCE:BTCUSDT.P",
  ETH: "BINANCE:ETHUSDT.P",
  SOL: "BINANCE:SOLUSDT.P",
};
```

---

## E2 — TradingView drawing tools sidebar: убедиться что видна

В конфигурации виджета убедиться:
```json
{
  "hide_side_toolbar": false,
  "hide_top_toolbar": false,
  "withdateranges": true,
  "allow_symbol_change": false
}
```

---

## === ПОРЯДОК ВЫПОЛНЕНИЯ ===

```
КРИТИЧЕСКИЕ (самое заметное визуально):
1. A1 — CoinSelectorModal (поиск + таблица монет) — НОВЫЙ КОМПОНЕНТ
2. B1 — Sidebar width 380px
3. B2 — CoinInfoBar: убрать крупную цену, переделать layout
4. C1+C2 — Цвета текста + dotted underlines
5. B5 — Buy/Long | Sell/Short точный стиль кнопок

ВАЖНЫЕ:
6. B3 — Cross/10x/Classic пропорции
7. D1 — Fees строка
8. D2 — Order Book с табами и precision
9. D5 — Тонкий шрифт logo
10. D6 — Equity формат в header
11. E1 — TradingView perp symbol

СРЕДНИЕ:
12. B4 — Market/Limit/Pro табы
13. B7 — Главная кнопка формат
14. D3 — Funding колонка
15. D4 — Sortable headers
16. B6 — Size input стиль
```

## ПОСЛЕ ВСЕХ ФИКСОВ:
1. `npm run build`
2. `git add src/`
3. `git commit -m "fix: Phase 5 — pixel-perfect proportions, colors, coin selector"`
4. **`git push origin main`** ← КРИТИЧНО! БЕЗ PUSH НИЧЕГО НЕ ИЗМЕНИТСЯ!
5. Подождать Vercel deploy
6. Сделать скриншоты нашего + HL рядом
7. Показать мне

## КРИТЕРИЙ:
Положи два скриншота рядом. Если сощуриться — не отличить.
