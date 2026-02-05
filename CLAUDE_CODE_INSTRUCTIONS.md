# 🤖 CLAUDE CODE — ИНСТРУКЦИИ ДЛЯ ВЫПОЛНЕНИЯ

> **Проект:** HL Simulator (демо-торговля)
> **Задача:** Миграция index.html → Next.js + Supabase
> **Референс:** `index.html` (40KB) — полностью рабочий UI

---

## 📋 КОНТЕКСТ

У нас есть `index.html` с готовым торговым интерфейсом:
- ✅ График свечей (Canvas)
- ✅ WebSocket к Hyperliquid API
- ✅ Order Book, Recent Trades
- ✅ Order Form (Market/Limit, Long/Short)
- ✅ Positions + History
- ✅ Mobile responsive CSS

**Проблема:** данные хранятся в `let S = {}` и теряются при перезагрузке.

**Решение:** Мигрировать на Next.js + Supabase для персистентности.

---

## 🎯 ПОРЯДОК ВЫПОЛНЕНИЯ

### STEP 1: Создать Next.js проект

```bash
cd /path/to/simulator-trade
npx create-next-app@latest hl-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd hl-app
```

**Проверка:** `npm run dev` запускается без ошибок

---

### STEP 2: Установить зависимости

```bash
npm install @supabase/supabase-js @supabase/ssr clsx tailwind-merge
```

**Проверка:** `package.json` содержит все пакеты

---

### STEP 3: Настроить Tailwind

Открой `tailwind.config.ts` и добавь кастомные цвета из `index.html`:

```typescript
// Скопируй цвета из :root в index.html
colors: {
  bg: "#000",
  s1: "#060809",
  s2: "#0d0f10",
  // ... остальные из index.html строки 9-16
}
```

**Референс:** `index.html` строки 9-16 (CSS переменные)

---

### STEP 4: Создать структуру папок

```bash
mkdir -p src/lib/supabase
mkdir -p src/hooks
mkdir -p src/components
mkdir -p supabase
```

---

### STEP 5: Supabase клиенты

Создай файлы:
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server client
- `src/lib/supabase/types.ts` — TypeScript типы

**Референс:** папка `hl-simulator/src/lib/supabase/` (я уже создал примеры)

---

### STEP 6: Утилиты

Создай `src/lib/utils.ts`:
- `cn()` — className merge
- `formatNumber()`, `formatPnl()`, `formatPercent()`
- `calculateLiquidationPrice()`, `calculatePnl()`, `calculateRoe()`
- `COIN_DECIMALS`, `SUPPORTED_COINS`, `TIMEFRAMES`

**Референс:** `index.html` строки 385-389 (константы), 597-600 (формулы)

---

### STEP 7: Hyperliquid API

Создай `src/lib/hyperliquid.ts`:
- `fetchCandles(coin, interval)` — POST к api.hyperliquid.xyz/info
- `fetchL2Book(coin)` — получить ордербук
- `HyperliquidWebSocket` class — подписки на trades, candles, l2Book
- Fallback генераторы для симуляции

**Референс:** `index.html` строки 392-493 (API логика)

---

### STEP 8: Хуки

Создай хуки:

**`src/hooks/useAuth.ts`**
- Supabase auth state
- Авто-создание demo_account при регистрации
- `updateBalance()` функция

**`src/hooks/useMarketData.ts`**
- WebSocket подключение
- State: candles, price, asks, bids, trades
- Fallback симуляция при отсутствии WS

**`src/hooks/useTrading.ts`**
- CRUD для positions через Supabase
- `placeOrder()`, `closePosition()`
- `checkLiquidations()` — проверка ликвидаций

**Референс:** `index.html` строки 450-500 (WS), 600-660 (trading logic)

---

### STEP 9: Компоненты

Создай компоненты, портируя HTML/CSS из `index.html`:

| Компонент | Референс в index.html |
|-----------|----------------------|
| `Navigation.tsx` | строки 245-256 (.nav) |
| `CoinSelector.tsx` | строки 258-277 (.sub) |
| `Chart.tsx` | строки 280-296, 504-575 (canvas логика) |
| `OrderBook.tsx` | строки 299-308, 577-584 |
| `RecentTrades.tsx` | строки 309-313, 586-594 |
| `OrderForm.tsx` | строки 314-352, 666-676 |
| `Positions.tsx` | строки 355-367, 639-655 |
| `AuthForm.tsx` | новый (login/signup modal) |
| `Notification.tsx` | строки 19-25 (.noti) |

**ВАЖНО:** Сохраняй CSS классы и стили из index.html!

---

### STEP 10: Страницы

**`src/app/page.tsx`**
```tsx
redirect("/trade")
```

**`src/app/trade/page.tsx`**
- Главная торговая страница
- Layout как в index.html строки 55, 279

**`src/app/portfolio/page.tsx`**
- Account overview
- Positions table
- Trade history

**`src/app/faucet/page.tsx`**
- Request demo USDC
- История запросов

**`src/app/auth/callback/route.ts`**
- OAuth callback handler

---

### STEP 11: SQL схема

Создай `supabase/schema.sql` с таблицами:
- `demo_accounts` (user_id, balance)
- `positions` (account_id, coin, side, size, entry_price, leverage, liquidation_price)
- `order_history`
- `trade_history`
- `demo_fund_requests`

Включи RLS policies!

**Референс:** `hl-simulator/supabase/schema.sql`

---

### STEP 12: Environment

Создай `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

### STEP 13: Тестирование

```bash
npm run build  # Проверить билд
npm run dev    # Запустить локально
```

Проверить:
- [ ] Signup/Login работает
- [ ] График показывает данные
- [ ] Можно открыть позицию
- [ ] Позиция сохраняется после F5
- [ ] Можно закрыть позицию
- [ ] Portfolio показывает данные
- [ ] Faucet добавляет USDC
- [ ] Работает на мобильном (375px)

---

## 📁 РЕФЕРЕНС ФАЙЛЫ

```
simulator-trade/
├── index.html              ← ГЛАВНЫЙ РЕФЕРЕНС (CSS + JS логика)
├── hl-simulator/           ← Примеры кода (я создал)
│   ├── src/
│   │   ├── lib/           ← utils, supabase, hyperliquid
│   │   ├── hooks/         ← useAuth, useTrading, useMarketData
│   │   └── components/    ← все компоненты
│   └── supabase/
│       └── schema.sql     ← SQL схема
```

---

## ⚠️ КРИТИЧЕСКИЕ МОМЕНТЫ

1. **Сохраняй CSS из index.html** — дизайн уже идеальный
2. **Canvas chart** — портируй drawChart() из строк 508-559
3. **WebSocket** — портируй connectWS() из строк 452-492
4. **Формулы PnL/Liq** — строки 597-600, не меняй логику
5. **Mobile CSS** — строки 161-239, @media queries важны

---

## ✅ DEFINITION OF DONE

- [ ] `npm run build` без ошибок
- [ ] Auth работает (email/password)
- [ ] Trade page идентична index.html визуально
- [ ] Данные сохраняются в Supabase
- [ ] Portfolio page показывает equity, positions, history
- [ ] Faucet добавляет USDC без лимитов
- [ ] Responsive: iPhone (375px) + MacBook (1440px)
- [ ] Готов к деплою на Vercel

---

**НАЧИНАЙ СО STEP 1**

При вопросах — спрашивай архитектора (меня).
