# HANDOFF — HL Simulator Project
# Полная конституция проекта для нового агента
# Дата: 2026-02-12

---

## 🚨 ПЕРВОЕ ЧТО НУЖНО СДЕЛАТЬ

1. Прочитай этот файл ПОЛНОСТЬЮ
2. Запусти `mcp__Claude_in_Chrome__tabs_context_mcp(createIfEmpty: true)` для подключения к Chrome
3. Запусти dev сервер: `cd /home/user/simulator-trade/hl-simulator && npm run dev`
4. Открой `http://localhost:3000/trade` через Chrome MCP
5. Проведи визуальный аудит — сравни с https://app.hyperliquid.xyz/trade

---

## 🔴 STRICT RULES (НИКОГДА НЕ НАРУШАЙ)

1. **ВСЁ проверяй через Chrome MCP** — пользователь ДОЛЖЕН видеть результат
2. **НИКОГДА не push/deploy без тестирования** на localhost
3. **Пользователь одобряет** перед git push или vercel deploy
4. **НИКОГДА не модифицируй settings.json mcpServers** — конфиг MCP должен оставаться: `npx chrome-devtools-mcp@latest`

### КРИТИЧЕСКАЯ ОШИБКА предыдущего агента (НЕ ПОВТОРЯЙ):
Предыдущий агент (в sandbox-сессии) изменил `/root/.claude/settings.json` mcpServers конфиг,
заменив `npx chrome-devtools-mcp@latest` на Linux-пути (`/opt/node22/bin/node`, `/root/.cache/ms-playwright/...`).
Это СЛОМАЛО MCP подключение к Chrome на Mac пользователя. Sandbox `/root/...` это удалённая среда,
MCP запускается на Mac пользователя через Claude Desktop App SDK. НИКОГДА не трогай этот конфиг.

---

## 📁 СТРУКТУРА ПРОЕКТА

```
/home/user/simulator-trade/          ← Git repo root
├── hl-simulator/                     ← Next.js 14 приложение (ОСНОВНОЕ)
│   ├── src/
│   │   ├── app/
│   │   │   ├── trade/page.tsx        ← Главная торговая страница
│   │   │   ├── portfolio/page.tsx    ← Портфолио
│   │   │   ├── earn/page.tsx         ← Earn страница
│   │   │   ├── faucet/page.tsx       ← Faucet (получение USDC)
│   │   │   └── globals.css           ← CSS переменные и глобальные стили
│   │   ├── components/
│   │   │   ├── CoinSelectorModal.tsx ← Модалка выбора монеты (ALL/PERPS/TRADFI)
│   │   │   ├── CoinInfoBar.tsx       ← Верхняя панель с инфо о монете
│   │   │   ├── OrderForm.tsx         ← Форма ордера (Buy/Sell)
│   │   │   ├── TradingViewChart.tsx  ← TradingView виджет графика
│   │   │   ├── ChartLegendOverlay.tsx← OHLC overlay на графике
│   │   │   ├── OrderBookTabs.tsx     ← Стакан (Order Book)
│   │   │   ├── BottomTabsPanel.tsx   ← Нижняя панель (Positions/Orders/History)
│   │   │   ├── ConfirmOrderModal.tsx ← Модалка подтверждения ордера
│   │   │   ├── MarketCloseModal.tsx  ← Модалка закрытия позиции
│   │   │   ├── Navigation.tsx        ← Верхняя навигация
│   │   │   ├── CoinIcon.tsx          ← Иконки монет (crypto + tradifi)
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useMarketData.ts      ← Цены, свечи, WebSocket + REST polling
│   │   │   ├── useCoinStats.ts       ← Статистика: funding, OI, volume, 24h change
│   │   │   ├── useTrading.ts         ← Логика торговли (позиции, ордера)
│   │   │   └── useAuth.ts            ← Авторизация (Supabase)
│   │   └── lib/
│   │       ├── utils.ts              ← SUPPORTED_COINS, TRADIFI_COINS, утилиты
│   │       ├── hyperliquid.ts        ← API клиент HL (REST + WebSocket)
│   │       └── supabase/             ← Supabase клиент и типы
│   ├── .env.local                    ← Supabase URL + Key (обязателен для билда)
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.ts
└── HANDOFF.md                        ← Этот файл
```

---

## 🔧 ТЕХНОЛОГИИ

- **Next.js 14** (App Router, React 18, TypeScript)
- **Tailwind CSS** (кастомные цвета через CSS variables)
- **Supabase** (авторизация, хранение позиций/ордеров/балансов)
- **Hyperliquid API** (реальные данные рынка)
- **TradingView Widget** (графики)
- **Vercel** (деплой)

---

## 🎨 ДИЗАЙН — PIXEL-PERFECT КАК HYPERLIQUID

Всё должно выглядеть **идентично** реальному https://app.hyperliquid.xyz/trade

### Цвета (CSS variables в globals.css):
```css
--bg: #04251F;     /* Body background — тёмно-зелёный, НЕ синий! */
--s1: #0F1A1F;     /* Cards background */
--s2: #1a2a28;     /* Input backgrounds */
--s3: #243432;     /* Active tab bg, hover */
--s4: #2e3e3c;
--s5: #384846;
--brd: #303030;    /* Borders */
--t1: #F6FEFD;     /* Primary text */
--t2: #949E9C;     /* Secondary text */
--t3: #878C8F;     /* Tertiary text */
--t4: #5a6260;     /* Muted text */
--acc: #50D2C1;    /* Accent (buttons, links) */
--grn: #1FA67D;    /* Green (profit, long) */
--red: #ED7088;    /* Red (loss, short) */
```

### Типографика:
- **Все тексты:** 12px, font-weight 400 (кроме заголовков)
- **Font:** system-ui, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif
- **Карточки:** только разница bg цвета, БЕЗ видимых бордеров
- **Nav active tab:** цвет #97FCE4 с border-bottom
- **Accent:** #50D2C1 для кнопок/ссылок

---

## 📊 HYPERLIQUID API

### Основной API:
- URL: `https://api.hyperliquid.xyz/info`
- Метод: POST с JSON body
- Без авторизации (публичный)

### Crypto Perps (основные монеты):
```json
POST {"type": "metaAndAssetCtxs"}
```
Возвращает: `[{universe: [{name: "BTC"}, ...]}, [assetCtx, ...]]`

### Tradifi Perps (акции, товары, FX — deployer xyz:):
```json
POST {"type": "metaAndAssetCtxs", "dex": "xyz"}
```
Возвращает то же но для xyz: deployer. Имена: `xyz:TSLA`, `xyz:GOLD`, `xyz:JPY` и т.д.

### Все цены:
```json
POST {"type": "allMids"}
```
Возвращает: `{"BTC": "97000.5", "ETH": "2700.1", ...}`
**Примечание:** allMids НЕ содержит tradifi монеты. Для tradifi цен нужен deployer API.

### Свечи:
```json
POST {"type": "candleSnapshot", "req": {"coin": "BTC", "interval": "15m", "startTime": ..., "endTime": ...}}
```
Для tradifi: coin = `"xyz:TSLA"` и т.д.

### WebSocket:
```
wss://api.hyperliquid.xyz/ws
```
Подписки: `allMids`, `l2Book`, `trades`, `candle`

### AssetCtx поля:
- `funding` — funding rate (hourly для tradifi, 8h для crypto)
- `openInterest` — в монетах, умножить на цену для USD
- `prevDayPx` — цена вчера (для расчёта 24h change)
- `dayNtlVlm` — дневной объём в USD
- `midPx` — mid price
- `markPx` — mark price
- `oraclePx` — oracle price

### TRADIFI_COINS список (utils.ts):
```typescript
// Stocks
"xyz:TSLA", "xyz:NVDA", "xyz:AAPL", "xyz:MSFT", "xyz:GOOGL", "xyz:AMZN",
"xyz:META", "xyz:HOOD", "xyz:PLTR", "xyz:COIN", "xyz:INTC", "xyz:AMD",
"xyz:MU", "xyz:SNDK", "xyz:MSTR", "xyz:CRCL", "xyz:NFLX", "xyz:ORCL",
"xyz:TSM", "xyz:BABA", "xyz:RIVN", "xyz:CRWV", "xyz:USAR", "xyz:URNM",
// Index
"xyz:XYZ100",
// Commodities
"xyz:GOLD", "xyz:SILVER", "xyz:CL", "xyz:COPPER", "xyz:NATGAS", "xyz:PLATINUM",
// FX
"xyz:JPY", "xyz:EUR"
```

### Отображение tradifi:
- В UI показывать `TSLA-USD` (не `xyz:TSLA-USDC`)
- Leverage из `TRADIFI_MAX_LEVERAGE` или из API `maxLeverage`
- Funding countdown: 1 час (не 8 часов как crypto)

---

## 🔀 GIT WORKFLOW

### Ветка разработки:
```
claude/hl-simulator-development-4q3oT
```

### Правила:
- Пушить ТОЛЬКО в `claude/*` ветки (403 на main)
- Для merge в main: создать PR через GitHub API

### Push команда:
```bash
git push -u origin claude/hl-simulator-development-4q3oT
```

### При ошибке сети — retry до 4 раз с backoff:
```
2s → 4s → 8s → 16s
```

### Коммит формат:
```bash
git commit -m "$(cat <<'EOF'
feat/fix/chore: описание

https://claude.ai/code/SESSION_ID
EOF
)"
```

### ВАЖНО: перед push
1. Убедись что build проходит: `npm run build`
2. Пользователь протестировал на localhost
3. Пользователь одобрил push

---

## 🚀 VERCEL DEPLOYMENT

### ПРАВИЛЬНЫЙ проект: `hl-simulator`
- URL: https://hl-simulator.vercel.app
- Деплой вручную из `hl-simulator/` subdirectory

### НЕПРАВИЛЬНЫЙ проект: `simulator-trade`
- Билдится из repo root, auto-deploy с main. НЕ ИСПОЛЬЗОВАТЬ.

### Deploy команда:
```bash
cd /home/user/simulator-trade/hl-simulator && vercel deploy --prod --yes --token CQAgtUWpUh7oEoi8oKXQ8D6f
```

### Перед деплоем:
1. Build проходит без ошибок
2. Пользователь протестировал на localhost через Chrome
3. Пользователь одобрил деплой

---

## 🔐 CREDENTIALS

### Supabase:
- URL: `https://spgalfxnmzxzzhcxdsuh.supabase.co`
- Anon Key: `sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja`
- `.env.local` в `hl-simulator/` обязателен для билда

### Vercel:
- Token: `CQAgtUWpUh7oEoi8oKXQ8D6f`
- Project: `flashdevgordons-projects/hl-simulator`

---

## ✅ ЧТО СДЕЛАНО (история работы)

### 1. Основной интерфейс (завершено)
- Pixel-perfect копия Hyperliquid trade page
- Навигация, графики TradingView, стакан, форма ордера
- Авторизация через Supabase (email/password)
- Торговля: рыночные ордера, лимитные ордера, TP/SL
- Позиции, история, открытые ордера
- Real-time цены через WebSocket + polling fallback

### 2. Tradifi пары (завершено в коде, ТРЕБУЕТ ТЕСТИРОВАНИЯ)
Добавлены все акции/товары/FX из HL xyz: deployer:

**Изменённые файлы:**
- `lib/utils.ts` — TRADIFI_COINS, TRADIFI_NAMES, TRADIFI_MAX_LEVERAGE, isTradifiCoin(), getTradifiSymbol()
- `lib/hyperliquid.ts` — fetchDeployerMetaAndAssetCtxs(), FALLBACK_PRICES для tradifi
- `components/CoinSelectorModal.tsx` — вкладка Tradfi, загрузка tradifi данных
- `components/CoinInfoBar.tsx` — отображение TSLA-USD вместо xyz:TSLA
- `components/OrderForm.tsx` — max leverage для tradifi
- `hooks/useMarketData.ts` — polling tradifi цен отдельно от allMids
- `hooks/useCoinStats.ts` — статистика из deployer API (funding 1h, volume, OI)
- `components/ChartLegendOverlay.tsx` — OHLC из HL candle API для tradifi
- `components/BottomTabsPanel.tsx` — чистые имена (без xyz: prefix)
- `components/ConfirmOrderModal.tsx` — tradifi имена
- `components/MarketCloseModal.tsx` — tradifi имена
- `components/TradingViewChart.tsx` — SYMBOL_MAP для TradingView (акции/товары/FX)
- `components/CoinIcon.tsx` — цветные иконки с тикерами для tradifi

### 3. Последние коммиты на ветке:
```
68ec68e chore: add .mcp.json to gitignore
d3be485 fix: improve CoinSelectorModal tab clickability and event handling
4584bdf fix: make Tradfi tab explicitly clickable with disabled:false
08e4877 feat: add Tradifi pairs (stocks, commodities, FX) from HL xyz: deployer
c688048 feat: major layout improvements matching real Hyperliquid
```

---

## 🐛 ИЗВЕСТНАЯ ПРОБЛЕМА: Tradfi Tab

### Симптом:
Пользователь жалуется что вкладка "Tradfi" в CoinSelectorModal серая и не кликабельна.

### Что было сделано:
1. Добавлен `disabled: false` явно — не помогло
2. Добавлен z-index на modal content — не помогло
3. Убран stopPropagation, backdrop onClick перенесён на backdrop div
4. Добавлен `type="button"`, `cursor-pointer`, `hover:bg-s2`
5. Код скомпилирован правильно (проверено в bundle)

### Возможные причины:
- Баг может быть уже исправлен последним коммитом (не протестировано!)
- Возможно tabClick работает но tradifiCoins пуст (API fail → пустой список)
- Возможно визуальная обратная связь недостаточна (tab становится active но пользователь не замечает)

### Что нужно сделать:
1. Открыть localhost:3000/trade в Chrome MCP
2. Кликнуть на имя монеты (HYPE-USDC) чтобы открыть модалку
3. Кликнуть на вкладку "Tradfi"
4. Проверить: отображаются ли TSLA, NVDA, GOLD и т.д.?
5. Если нет — проверить console.log на ошибки API
6. Если да — проверить клик на конкретную tradifi монету (переключается ли)

---

## 📋 CHECKLIST ДЛЯ НОВОГО АГЕНТА

### При старте:
- [ ] Прочитать HANDOFF.md
- [ ] Подключить Chrome MCP: `mcp__Claude_in_Chrome__tabs_context_mcp(createIfEmpty: true)`
- [ ] Запустить dev server: `cd /home/user/simulator-trade/hl-simulator && npm run dev`
- [ ] Открыть localhost:3000/trade через navigate
- [ ] Проверить что основной UI работает

### Текущая задача:
- [ ] Протестировать Tradfi tab через Chrome MCP
- [ ] Если не работает — починить
- [ ] Визуально сравнить с https://app.hyperliquid.xyz/trade
- [ ] Дать пользователю протестировать
- [ ] После одобрения: commit → push → deploy

### НИКОГДА:
- [ ] Не пушить без одобрения пользователя
- [ ] Не деплоить без тестирования на localhost
- [ ] Не менять settings.json mcpServers
- [ ] Не использовать Linux-пути для Mac MCP конфига

---

## 🏗️ ENVIRONMENT

### Если ты в sandbox (Linux `/root/...`):
- MCP Chrome НЕ БУДЕТ работать
- Нужна локальная сессия через Claude Desktop App без sandbox

### Если ты локально на Mac (`/Users/...`):
- MCP Chrome работает через SDK
- `mcp__Claude_in_Chrome__*` инструменты доступны
- Проект: `/Users/mac/...` (путь к git clone)

### Dev Server:
```bash
cd /home/user/simulator-trade/hl-simulator
npm run dev
# → http://localhost:3000
```

### Build:
```bash
cd /home/user/simulator-trade/hl-simulator
npm run build
```

### .env.local (обязателен):
```
NEXT_PUBLIC_SUPABASE_URL=https://spgalfxnmzxzzhcxdsuh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja
```
