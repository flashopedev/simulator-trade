# PHASE 4 — PIXEL-PERFECT: Финальная доводка до 100% соответствия Hyperliquid PERP

ВАЖНО: Предыдущие промты были ЧАСТИЧНО ОШИБОЧНЫМИ! Я сравнивал с SPOT версией HL, а надо с PERP версией. Теперь у меня правильный скриншот для сравнения.

Открой в Chrome рядом:
- НАШ: https://hl-simulator.vercel.app/trade
- HL PERP: https://app.hyperliquid.xyz/trade (убедись что выбран HYPE, это perp view)

Сверяй КАЖДЫЙ элемент визуально. Ниже 18 конкретных отличий с точными инструкциями.

---

## FIX 1 — ПРАВЫЙ САЙДБАР: Добавить Cross | 10x | Classic СВЕРХУ

### Как у HL (правый сайдбар, самый верх):
```
┌─────────────────────────────────────┐
│  [Cross]    [10x]    [Classic]      │  ← ТРИ кнопки в ряд, ВЫШЕ всего
├─────────────────────────────────────┤
│  Market  |  Limit  |  Pro ▽        │  ← табы ордеров
│  ...                                │
```

### Реализация:
В `OrderForm.tsx` — добавить ПЕРВЫМ элементом (до табов Market/Limit) ряд из трёх кнопок:

```tsx
{/* Margin Mode & Leverage — TOP OF SIDEBAR */}
<div className="flex border-b border-brd">
  <button
    className={`flex-1 py-2.5 text-[13px] font-medium text-center border-r border-brd
      ${marginMode === 'cross' ? 'text-t1 bg-s2' : 'text-t3 hover:text-t2'}`}
    onClick={() => setMarginMode('cross')}
  >
    Cross
  </button>
  <button
    className={`flex-1 py-2.5 text-[13px] font-medium text-center border-r border-brd text-t1 bg-s2`}
  >
    {leverage}x
  </button>
  <button
    className={`flex-1 py-2.5 text-[13px] font-medium text-center
      ${marginMode === 'isolated' ? 'text-t1 bg-s2' : 'text-t3 hover:text-t2'}`}
    onClick={() => setMarginMode('isolated')}
  >
    Classic
  </button>
</div>
```

Leverage (10x) — при клике открывает popup для изменения. Пока можно оставить просто display.

---

## FIX 2 — Добавить таб "Pro ▽"

### Как у HL:
```
Market | Limit | Pro ▽
```

### Реализация в `OrderForm.tsx`:
Добавить третий таб "Pro" с dropdown иконкой, disabled:
```tsx
<button className="px-4 py-2.5 text-[13px] text-t4 cursor-not-allowed flex items-center gap-1">
  Pro <ChevronDown size={12} />
</button>
```

---

## FIX 3 — Кнопки "Buy / Long" и "Sell / Short"

### Как у HL:
- Левая кнопка: **"Buy / Long"** (бирюзовый фон когда активна)
- Правая кнопка: **"Sell / Short"** (красный фон когда активна)

### НЕ просто "Buy" и "Sell"! У HL написано двойное название через слэш.

### Реализация в `OrderForm.tsx`:
```tsx
<button className={isBuy ? 'bg-acc text-black ...' : 'bg-s3 text-t3 ...'}>
  Buy / Long
</button>
<button className={!isBuy ? 'bg-red text-white ...' : 'bg-s3 text-t3 ...'}>
  Sell / Short
</button>
```

---

## FIX 4 — Добавить "Current Position" поле

### Как у HL (под Available to Trade):
```
Available to Trade          0,00 USDC
Current Position            0,00 HYPE
```

### Реализация в `OrderForm.tsx`:
После строки "Available to Trade" добавить:
```tsx
<div className="flex justify-between text-[12px] px-3">
  <span className="text-t3">Current Position</span>
  <span className="text-t1">
    {currentPosition ? `${currentPosition.size.toFixed(2)} ${coin}` : `0.00 ${coin}`}
  </span>
</div>
```

Получать currentPosition из props (передавать из trade/page.tsx — найти позицию для текущей монеты).

---

## FIX 5 — ВЕРНУТЬ Reduce Only + Take Profit / Stop Loss

### ОШИБКА предыдущего промта! У реального HL PERP эти чекбоксы ЕСТЬ! Я ранее сказал убрать — это было НЕПРАВИЛЬНО.

### Как у HL:
```
☐ Reduce Only
☐ Take Profit / Stop Loss
```

### Реализация в `OrderForm.tsx`:
Добавить обратно ДВА чекбокса перед кнопкой Buy/Sell:
```tsx
<div className="flex items-center gap-4 px-3 py-1">
  <label className="flex items-center gap-1.5 text-[12px] text-t2 cursor-pointer">
    <input type="checkbox" className="w-3.5 h-3.5 rounded border-brd accent-acc" />
    Reduce Only
  </label>
  <label className="flex items-center gap-1.5 text-[12px] text-t2 cursor-pointer">
    <input type="checkbox" className="w-3.5 h-3.5 rounded border-brd accent-acc" />
    Take Profit / Stop Loss
  </label>
</div>
```

Функционал — декоративный (state но без логики).

---

## FIX 6 — Order details: ВЕРНУТЬ полный список

### ОШИБКА предыдущего промта! У HL показывается ПОЛНЫЙ список. Я ранее сказал убрать — это НЕПРАВИЛЬНО.

### Как у HL (под кнопкой):
```
Liquidation Price          N/A
Order Value                N/A
Margin Required            N/A
Slippage            Est: 0% / Max: 8,00%
```

### Реализация в `OrderForm.tsx`:
Вернуть ВСЕ 4 поля:
```tsx
<div className="space-y-1.5 px-3 pt-3 border-t border-brd text-[12px]">
  <div className="flex justify-between">
    <span className="text-t3">Liquidation Price</span>
    <span className="text-t1">{liqPrice || 'N/A'}</span>
  </div>
  <div className="flex justify-between">
    <span className="text-t3">Order Value</span>
    <span className="text-t2">N/A</span>
  </div>
  <div className="flex justify-between">
    <span className="text-t3">Margin Required</span>
    <span className="text-t2">N/A</span>
  </div>
  <div className="flex justify-between">
    <span className="text-t3">Slippage</span>
    <span className="text-acc">Est: 0% / Max: 8.00%</span>
  </div>
</div>
```

---

## FIX 7 — COIN INFO BAR: Переделать под PERP формат (ДВЕ СТРОКИ!)

### КРИТИЧНО! У HL Perp coin info bar — ЭТО ДВЕ СТРОКИ, не одна!

### Строка 1 (высокая, ~40px):
```
[⭐] [●● icon] HYPE-USDC ▽  [10x badge]     │ Mark: 32,850 │ Oracle: 32,804 │ 24H Change: -2,602 / -7.34% │ ...
```

### Строка 2 (остальные поля, если не помещаются):
```
24H Volume: $827M │ Open Interest: $776M │ Funding / Countdown: 0.0028% 00:06:45
```

### Конкретные изменения в `CoinInfoBar.tsx`:

1. **Формат монеты:** "HYPE-USDC" (через ДЕФИС, не слэш!) — это perp формат
   - Или можно оставить "HYPE/USDC" — разница минимальная

2. **Добавить "10x" badge** рядом с названием монеты:
```tsx
<span className="px-1.5 py-0.5 bg-acc/20 text-acc text-[11px] font-medium rounded">
  {leverage}x
</span>
```

3. **ДОБАВИТЬ поля (которых нет):**
   - **Mark** price — большим шрифтом (это текущая рыночная цена)
   - **Oracle** price — рядом с Mark
   - **Open Interest** — значение в USD
   - **Funding / Countdown** — процент + таймер обратного отсчёта (HH:MM:SS)

4. **УБРАТЬ:**
   - Market Cap — в perp view HL его НЕ показывает

5. **Формат подписей у HL:**
   - Мелкий label СВЕРХУ: `text-[10px] text-t3` с подчёркиванием (dotted underline как у HL!)
   - Значение СНИЗУ: `text-[13px] text-t1`
   - Labels у HL подчёркнуты пунктиром: `border-b border-dotted border-t3`

### Итоговые поля (слева направо):
```
⭐ | [icon] HYPE/USDC ▽ [10x] | Mark: 33,07 | Oracle: 33,05 | 24H Change: -1.06 / -3.22% | 24H Volume: $254M | Open Interest: $450M | Funding: 0.0100% / 07:12:34
```

### Для Mark и Oracle — использовать текущую цену (mark = price, oracle = price * 0.999 или тоже price).

---

## FIX 8 — Звёздочка: отдельная строка, жёлтая

### Как у HL:
⭐ находится на ОТДЕЛЬНОЙ строке ВЫШЕ coin info bar, в левом углу. Цвет — **жёлтый** (filled).

### Наш:
Звёздочка inline в coin info bar, outline.

### Реализация:
Вынести звёздочку из CoinInfoBar в trade/page.tsx как отдельный элемент:
```tsx
<div className="px-4 pt-1">
  <Star size={16} className="text-yellow-500 fill-yellow-500 cursor-pointer hover:opacity-80" />
</div>
<CoinInfoBar ... />
```

Или внутри CoinInfoBar — сделать её на отдельной строке сверху.

---

## FIX 9 — TradingView: включить Drawing Tools sidebar

### Как у HL:
Слева от чарта — вертикальная панель с ~15 иконками инструментов рисования (линии, фибоначчи, прямоугольники, etc).

### Наш:
Только 2 маленькие иконки сверху. Drawing toolbar СКРЫТ.

### Реализация в `TradingViewChart.tsx`:
В конфигурации виджета ДОБАВИТЬ параметры:
```json
{
  "hide_side_toolbar": false,
  "studies_overrides": {},
  "enabled_features": ["drawing_tools_on_all_timeframes"],
  "disabled_features": [],
  "drawings_access": { "type": "black", "tools": [] }
}
```

Или проще — в конфигурации виджета поменять:
```json
"hide_side_toolbar": false
```

Если используется `embed-widget-advanced-chart`, параметр:
```json
"show_popup_button": true,
"withdateranges": true,
"details": true,
"studies": ["Volume@tv-basicstudies"]
```

---

## FIX 10 — TradingView: убрать "Bybit" источник, настроить символ

### Проблема:
У нас написано "HYPEUSDT SPOT · 15 · **Bybit**"
У HL написано "HYPEUSD · 1h · **Hyperliquid**"

### Реализация:
Нельзя подключить Hyperliquid как источник в TradingView widget (это их приватный фид). Но можно:

1. Попробовать символ `HYPEUSD` вместо `BYBIT:HYPEUSDT` — может TradingView найдёт
2. Или использовать `BINANCE:HYPEUSDT.P` (perp) вместо spot
3. Или `OKX:HYPEUSDT.P`
4. Главное — убрать SPOT из названия, использовать perp контракт

В TradingViewChart.tsx поменять mapping:
```typescript
const symbolMap: Record<string, string> = {
  HYPE: "BYBIT:HYPEUSDT.P",   // .P = perpetual
  BTC: "BINANCE:BTCUSDT.P",
  ETH: "BINANCE:ETHUSDT.P",
  SOL: "BINANCE:SOLUSDT.P",
};
```

---

## FIX 11 — Chart timeframes

### Как у HL:
```
5m  1h  D  ▽
```
Три основных + dropdown для остальных.

### Наш:
```
1m  30m  1h  15m  ▽  [icons]
```

### Реализация:
TradingView widget сам рисует свои timeframe кнопки. Если мы используем embedded widget, это настраивается через:
```json
"interval": "60",
"time_frames": [
  { "text": "5m", "resolution": "5" },
  { "text": "1h", "resolution": "60" },
  { "text": "D", "resolution": "1D" }
]
```

Убрать НАШИ кнопки timeframe (1M, 5M, 15M, 1H, 4H, 1D) из CoinInfoBar или trade page — TradingView widget их рисует сам.

---

## FIX 12 — Кнопка Buy/Sell внизу формы

### Как у HL:
Когда НЕ залогинен: большая кнопка **"Connect"** (бирюзовая)
Когда залогинен: **"Buy / Long"** (бирюзовая) или **"Sell / Short"** (красная)

### Наш "Buy Market" — заменить на:
```tsx
// Когда залогинен:
<button className={`w-full py-3 rounded font-bold text-[14px] ${
  isBuy ? 'bg-acc text-black' : 'bg-red text-white'
}`}>
  {isBuy ? 'Buy / Long' : 'Sell / Short'}
</button>

// Когда НЕ залогинен:
<button className="w-full py-3 rounded font-bold text-[14px] bg-acc text-black">
  Connect
</button>
```

НЕ показывать тип ордера в кнопке (не "Buy Market", просто "Buy / Long").

---

## FIX 13 — Labels подписей с пунктирным подчёркиванием

### Как у HL:
Labels типа "Mark", "Oracle", "24H Change", "Open Interest" имеют **пунктирное подчёркивание** (dotted border-bottom). Это стиль tooltips — при наведении можно показать подсказку.

### Реализация:
Добавить CSS класс:
```css
.label-dotted {
  border-bottom: 1px dotted var(--t4);
  cursor: help;
}
```

Применить к labels в CoinInfoBar:
```tsx
<span className="text-[10px] text-t3 uppercase tracking-wider border-b border-dotted border-t4 cursor-help">
  Mark
</span>
```

---

## FIX 14 — Fees формат

### Наш: `0.0350% / 0.0100%`
### HL: Fees не показывает напрямую в форме. Вместо этого:
- `Slippage: Est: 0% / Max: 8.00%` (бирюзовый текст)

### Заменить "Fees" на "Slippage" с правильным форматом и цветом:
```tsx
<div className="flex justify-between">
  <span className="text-t3">Slippage</span>
  <span className="text-acc">Est: 0% / Max: 8.00%</span>
</div>
```

---

## FIX 15 — Order Book header

### Наш: "Order Book" + precision selector на одной строке
### HL: НЕТ текста "Order Book" над таблицей когда он в сайдбаре. Просто PRICE | SIZE | TOTAL headers сразу.

### Реализация:
- Убрать заголовок "Order Book" с бирюзовым текстом
- Оставить только precision selector (0.01 ↕) маленьким в углу
- Сразу начинать с PRICE | SIZE | TOTAL

Или: если Order Book находится в отдельном tabbed view, то оставить tab "Order Book" | "Trades", но сделать его компактнее.

---

## FIX 16 — Шрифт заголовка "Hyperliquid"

### Как у HL:
"Hyperliquid" — **более тонкий**, italic, lightweight. Почти как handwriting/script.

### Наш:
"Hyperliquid" — bold italic, слишком жирный.

### Реализация в `Navigation.tsx`:
```tsx
<span className="text-[16px] italic font-light text-t1 tracking-tight">
  Hyperliquid
</span>
```
Заменить `font-bold` на `font-light` или `font-normal`.

---

## FIX 17 — Equity display в header

### Как у HL (когда залогинен):
Не показывает Equity в header навигации. Показывает только "Connect" / address.

### Наш:
`Equity 141,646.56` в ярко-зелёном — слишком выделяется.

### Реализация:
- Убрать из текста "Equity" — оставить только сумму
- Или стиль: `text-t1` вместо `text-acc` (белый вместо бирюзового)
- Формат: `$141,646.56` (добавить знак доллара)

---

## FIX 18 — Убрать "24H CHANGE" и другие UPPERCASE labels из CoinInfoBar

### Как у HL:
Labels написаны **маленькими буквами с подчёркиванием**: `Mark`, `Oracle`, `24H Change` — НЕ капсом.

### Наш:
`24H CHANGE`, `24H VOLUME`, `MARKET CAP` — ВСЁ В ВЕРХНЕМ РЕГИСТРЕ.

### Реализация:
Убрать `uppercase` из CSS labels или написать labels с нормальным регистром:
- `24H Change` (не `24H CHANGE`)
- `24H Volume` (не `24H VOLUME`)
- `Mark` (не `MARK`)

---

## ПОРЯДОК ВЫПОЛНЕНИЯ:

```
КРИТИЧНЫЕ (меняют общий вид):
1.  FIX 1  — Cross/10x/Classic сверху сайдбара
2.  FIX 7  — CoinInfoBar переделка (Mark, Oracle, OI, Funding)
3.  FIX 3  — "Buy / Long" | "Sell / Short"
4.  FIX 5  — Вернуть Reduce Only + TP/SL
5.  FIX 6  — Вернуть полные order details
6.  FIX 9  — TradingView drawing tools
7.  FIX 12 — Кнопка "Buy / Long" вместо "Buy Market"

СРЕДНИЕ (улучшают точность):
8.  FIX 2  — Pro таб
9.  FIX 4  — Current Position поле
10. FIX 8  — Звёздочка на отдельной строке
11. FIX 10 — TradingView символ (perp вместо spot)
12. FIX 11 — Chart timeframes
13. FIX 14 — Slippage вместо Fees

МЕЛКИЕ (polish):
14. FIX 13 — Dotted underline labels
15. FIX 15 — Order Book header
16. FIX 16 — Шрифт "Hyperliquid"
17. FIX 17 — Equity display
18. FIX 18 — Убрать UPPERCASE из labels
```

## ПОСЛЕ ВСЕХ ФИКСОВ:
1. `npm run build` — чистый билд
2. `git add src/`
3. `git commit -m "fix: Phase 4 — pixel-perfect match to Hyperliquid PERP view"`
4. `git push origin main` (ОБЯЗАТЕЛЬНО ЗАПУШИТЬ! В прошлый раз не запушил!)
5. Подождать Vercel deploy (1-2 мин)
6. Открыть https://hl-simulator.vercel.app/trade
7. Рядом открыть https://app.hyperliquid.xyz/trade
8. Сделать скриншоты ОБОИХ → показать мне

## КРИТЕРИЙ:
Положи скриншоты рядом — если нельзя отличить (кроме badge "SIM" и демо-данных), значит готово.
