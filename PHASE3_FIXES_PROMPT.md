# PHASE 3 HOTFIX — Исправление 10 критических отличий от реального Hyperliquid

Я сравнил наш симулятор со скриншотом реального Hyperliquid (https://app.hyperliquid.xyz/trade). Есть 10 серьёзных отличий которые нужно исправить. Открой реальный HL в Chrome и сверяйся ВИЗУАЛЬНО при каждом изменении.

ПРАВИЛО: Если сомневаешься как должно выглядеть — открой https://app.hyperliquid.xyz/trade в Chrome, сделай скриншот и скопируй ТОЧНО.

---

## FIX 1 — LAYOUT: Вернуть 2 колонки, убрать OrderBook из средней колонки

### Проблема:
Сейчас у нас 3 колонки: `grid-cols-[1fr_280px_300px]` (Chart | OrderBook | OrderForm).
У реального HL — **2 колонки**: Chart (всё левое пространство) | Правый сайдбар (~300px).
OrderBook находится ВНУТРИ правого сайдбара, под OrderForm, а НЕ как отдельная колонка.

### Исправление в `src/app/trade/page.tsx`:

Заменить grid на:
```
md:grid-cols-[1fr_300px]
```

Правый сайдбар содержит СВЕРХУ ВНИЗ:
1. OrderForm (верхняя часть)
2. OrderBook (нижняя часть, flex-1, scroll)

```
┌────────────────────────────────┬──────────────┐
│                                │ OrderForm    │
│   Chart (весь левый блок)      │              │
│   (lightweight-charts)         ├──────────────┤
│                                │ OrderBook    │
│                                │ (scroll)     │
├────────────────────────────────┴──────────────┤
│ Bottom Panel (tabs + table)                    │
├────────────────────────────────────────────────┤
│ Footer                                         │
└────────────────────────────────────────────────┘
```

Правый сайдбар: `flex flex-col h-full border-l border-brd`
- OrderForm: `flex-shrink-0` (не сжимается)
- OrderBook: `flex-1 min-h-0 overflow-y-auto` (занимает оставшееся место, скроллится)

---

## FIX 2 — Кнопки "Long/Short" → "Buy/Sell"

### Проблема:
У нас кнопки "Long" (зелёный) и "Short". У HL — "Buy" (бирюзовый #00d8c4) и "Sell".

### Исправление в `src/components/OrderForm.tsx`:

1. Заменить текст: "Long" → **"Buy"**, "Short" → **"Sell"**
2. Цвет Buy кнопки: `bg-acc text-black` (бирюзовый #00d8c4, НЕ зелёный!)
3. Цвет Sell кнопки: `bg-red text-white` (красный #ff4976) когда активна, `bg-s3 text-t3` когда неактивна
4. Основная кнопка внизу: "Long HYPE" → **"Buy Market"** или **"Buy Limit"** (в зависимости от таба)
   - Цвет: `bg-acc text-black` для Buy, `bg-red text-white` для Sell
   - НЕ зелёный! Бирюзовый (#00d8c4)!

---

## FIX 3 — Убрать Cross/Isolated/Leverage из основной формы

### Проблема:
У нас Cross | Isolated | 10x ▽ торчат прямо в форме. У реального HL этих элементов НЕ видно в основном потоке формы.

### Исправление в `src/components/OrderForm.tsx`:

УБРАТЬ из видимой части формы:
- Cross / Isolated toggle
- Leverage selector (10x ▽)

Вместо этого:
- Добавить маленький badge "10x" рядом с "Available to Trade" или в header формы — при клике открывает popup для настройки leverage
- Или просто СКРЫТЬ эти контролы — leverage по дефолту 10x, Cross по дефолту

Важно: НЕ удалять функционал! Просто скрыть из основного flow формы. Логика leverage должна остаться.

---

## FIX 4 — Убрать Reduce Only и TP/SL чекбоксы

### Проблема:
У нас видны чекбоксы "Reduce Only" и "TP/SL". У реального HL их НЕТ в основной форме.

### Исправление в `src/components/OrderForm.tsx`:

УДАЛИТЬ из UI:
- Checkbox "Reduce Only"
- Checkbox "TP/SL"

Полностью убрать эти элементы из рендера. Они не нужны для симулятора.

---

## FIX 5 — "HYPE-PERP" → "HYPE/USDC"

### Проблема:
У нас написано "HYPE-PERP". У HL написано "HYPE/USDC".

### Исправление в `src/components/CoinInfoBar.tsx`:

Заменить формат отображения:
- Было: `HYPE-PERP`
- Стало: **`HYPE/USDC`**

Для всех монет: `{COIN}/USDC` (BTC/USDC, ETH/USDC, SOL/USDC)

---

## FIX 6 — Coin Info Bar: убрать лишние поля, привести к формату HL

### Проблема:
Наш бар: 24H CHANGE | 24H HIGH | 24H LOW | 24H VOLUME | OPEN INTEREST | FUNDING/COUNTDOWN
HL бар: Price | 24H Change | 24H Volume | Market Cap | Contract

### Исправление в `src/components/CoinInfoBar.tsx`:

Оставить ТОЛЬКО эти поля (в этом порядке слева направо):
1. **⭐ Star** (иконка избранного)
2. **Coin icon + "HYPE/USDC" ▽** (dropdown)
3. **Contract: 0x1f98...F984** с иконками copy + external link (маленький текст, text-t3)
4. **Price** — крупный: 33.33 (text-[20px] font-bold)
5. **24H Change** — показать значение + процент: "-1.60 / -4.79%" (красный если минус)
6. **24H Volume** — "$254M USDC" (text-t2)
7. **Market Cap** — "$9.9B USDC" (text-t2)

УБРАТЬ: 24H HIGH, 24H LOW, OPEN INTEREST, FUNDING/COUNTDOWN

Формат подписей:
- Мелкий label сверху: `text-[10px] text-t4 uppercase tracking-wider`
- Значение снизу: `text-[13px] text-t1`

Для Volume и Market Cap — можно захардкодить красивые значения если API не даёт.

---

## FIX 7 — Order details внизу формы

### Проблема:
У нас: Order Value | Margin Required | Est. Fee | Est. Liq. Price
У HL: Order Value | Slippage | Fees

### Исправление в `src/components/OrderForm.tsx`:

Показывать ТОЛЬКО:
1. **Order Value** → значение или "—"
2. **Fees** → "0.0700% / 0.0400%" (или "Est: 0% / Max: 8.00%" — ТОЧНО как у HL)

УБРАТЬ из видимой части:
- Margin Required
- Est. Fee (заменить на просто "Fees")
- Est. Liq. Price (УБРАТЬ из основной формы — можно показывать в tooltip)

Формат:
```
Order Value                    N/A
Fees                 0,0700% / 0,0400%
```

Текст: `text-[12px]`, labels: `text-t3`, values: `text-t2`, разделитель `border-t border-brd mt-3 pt-3`

---

## FIX 8 — Bottom tabs: исправить порядок и названия

### Проблема:
Наш порядок: Positions | Open Orders | TWAP | TP/SL | Trade History | Funding History | Transfers | Balances | Vaults
HL порядок: Balances | Positions | Open Orders | TWAP | Trade History | Funding History | Order History

### Исправление в `src/components/BottomTabsPanel.tsx`:

Установить ТОЧНЫЙ порядок табов:
1. **Balances** (активный по дефолту)
2. **Positions** (с badge count)
3. **Open Orders** (с badge count)
4. **TWAP** (disabled/серый)
5. **Trade History**
6. **Funding History** (disabled/серый)
7. **Order History**

УБРАТЬ табы:
- TP/SL (не существует у HL)
- Transfers (не существует у HL на trade page)
- Vaults (не существует у HL на trade page)

Справа от табов добавить:
- **Filter ▽** — dropdown кнопка (декоративная)
- **☑ Hide Small Balances** — checkbox (декоративный)

Стиль disabled табов: `text-t4 cursor-default` (серые, не кликабельные)

---

## FIX 9 — Заменить chart на TradingView widget

### Проблема:
У нас базовый lightweight-charts. У HL полноценный TradingView с drawing tools, indicators, volume bars.

### Исправление:

Заменить текущий chart на **TradingView Advanced Chart Widget**. Это бесплатный embeddable виджет.

В `src/components/Chart.tsx` (или новый `src/components/TradingViewChart.tsx`):

```tsx
"use client";
import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  coin: string;
  theme?: "dark" | "light";
}

export default function TradingViewChart({ coin, theme = "dark" }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Очистить предыдущий виджет
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Маппинг наших монет на TradingView символы
    const symbolMap: Record<string, string> = {
      HYPE: "BYBIT:HYPEUSDT",
      BTC: "BINANCE:BTCUSDT",
      ETH: "BINANCE:ETHUSDT",
      SOL: "BINANCE:SOLUSDT",
    };

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbolMap[coin] || "BINANCE:BTCUSDT",
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0a0f14",
      gridColor: "#1a1f2e",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
      container_id: "tradingview_chart",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [coin]);

  return (
    <div className="w-full h-full" id="tradingview_chart" ref={containerRef}>
      <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}
```

В `trade/page.tsx` заменить:
```tsx
// Было:
<Chart ... />

// Стало:
<TradingViewChart coin={coin} />
```

Это даст нам:
- Полноценный TradingView chart
- Drawing tools (линии, фибоначчи, etc)
- Indicators (MACD, RSI, Bollinger)
- Volume bars внизу
- Тёмная тема с нашими цветами
- OHLC overlay

Если TradingView widget не грузится (CORS или другие проблемы), оставить lightweight-charts как fallback.

**ВАЖНО:** Не удалять текущий Chart.tsx — переименовать в ChartFallback.tsx и использовать как запасной вариант.

---

## FIX 10 — Footer: "Offline" → корректный статус

### Проблема:
Footer показывает "Offline" с красной точкой. У HL — "Online" с зелёной.

### Исправление в `src/components/Footer.tsx`:

Footer должен получать prop `isConnected` и показывать:
- `isConnected === true`: зелёная точка + "Online"
- `isConnected === false`: красная точка + "Offline"

Передать `isConnected` из trade/page.tsx (из useMarketData hook).

---

## ПОРЯДОК ВЫПОЛНЕНИЯ:

```
1. FIX 1 — Layout 2 колонки (САМОЕ ВАЖНОЕ — меняет весь вид)
2. FIX 2 — Buy/Sell вместо Long/Short
3. FIX 3 — Убрать Cross/Isolated/Leverage из формы
4. FIX 4 — Убрать Reduce Only / TP/SL
5. FIX 5 — HYPE/USDC вместо HYPE-PERP
6. FIX 6 — Coin Info Bar поля
7. FIX 7 — Order details
8. FIX 8 — Bottom tabs порядок
9. FIX 9 — TradingView chart
10. FIX 10 — Footer статус
```

После КАЖДОГО фикса — `npm run build` проверка!

После ВСЕХ фиксов:
1. `npm run build` — чистый билд без ошибок
2. `git add` все изменённые файлы (только src/ и package*)
3. `git commit -m "fix: Phase 3 hotfix — match exact Hyperliquid layout and UI"`
4. `git push origin main`
5. Подождать Vercel deploy
6. Открой https://hl-simulator.vercel.app/trade в Chrome
7. Рядом открой https://app.hyperliquid.xyz/trade
8. Сделай скриншот ОБОИХ и покажи мне для финальной проверки

## КРИТЕРИЙ УСПЕХА:
Если поставить скриншот нашего симулятора рядом со скриншотом реального HL, человек без подготовки должен сказать "это одно и то же". Единственное отличие — badge "SIM" и наши демо-данные.
