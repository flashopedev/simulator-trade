# HANDOFF — HL Simulator Project
# Полная конституция проекта для нового агента
# Дата: 2026-02-12

---

## 🌐 ОПРЕДЕЛИ СВОЮ СРЕДУ

Проект работает в ДВУХ средах. Определи где ты:

### Среда A: Mac (Claude Code CLI на Mac пользователя)
- **Путь проекта:** `/Users/mac/Desktop/гит/simulator-trade/`
- **MCP префикс:** `mcp__Claude_in_Chrome__*`
- **MCP инструменты:** `tabs_context_mcp`, `navigate`, `screenshot`, `click`, `evaluate`, и т.д.
- **Dev server:** `cd /Users/mac/Desktop/гит/simulator-trade/hl-simulator && npm run dev`
- **Chrome:** управляется через Claude Desktop App SDK → Chrome Extension

### Среда B: Sandbox (удалённый Linux)
- **Путь проекта:** `/home/user/simulator-trade/`
- **MCP префикс:** `mcp__chrome-devtools__*`
- **MCP инструменты:** `list_pages`, `navigate_page`, `take_screenshot`, `click`, `evaluate_script`, и т.д.
- **Dev server:** `cd /home/user/simulator-trade/hl-simulator && npm run dev`
- **Chrome:** управляется через `npx chrome-devtools-mcp@latest` → Chrome DevTools Protocol

### Как определить:
- Запусти `pwd` — если `/Users/mac/...` → Среда A (Mac), если `/home/user/...` → Среда B (Sandbox)
- Проверь доступные MCP: если есть `mcp__Claude_in_Chrome__*` → Mac, если `mcp__chrome-devtools__*` → Sandbox

**В обоих случаях:** localhost:3000 = dev server, все MCP команды работают с Chrome на Mac пользователя.

---

## 🚨 ПЕРВОЕ ЧТО НУЖНО СДЕЛАТЬ

1. Прочитай этот файл ПОЛНОСТЬЮ
2. Определи свою среду (Mac или Sandbox) — см. секцию выше
3. Проверь Chrome MCP:
   - Mac: `mcp__Claude_in_Chrome__tabs_context_mcp({ createIfEmpty: true })`
   - Sandbox: `mcp__chrome-devtools__list_pages()`
4. Запусти dev сервер: `cd <путь-проекта>/hl-simulator && npm run dev`
5. Открой `http://localhost:3000/trade` через Chrome MCP
6. Проведи визуальный аудит — сравни с https://app.hyperliquid.xyz/trade

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

## 🔍 ИЗВЛЕЧЕНИЕ ВИЗУАЛЬНОЙ ИНФОРМАЦИИ С РЕАЛЬНОГО HYPERLIQUID

Это самый важный навык для pixel-perfect копирования. Используй Chrome MCP чтобы открывать реальный HL и извлекать ВСЁ.

> **ПРИМЕЧАНИЕ:** Примеры ниже используют `mcp__chrome-devtools__*` (Sandbox). Если ты на Mac, замени на `mcp__Claude_in_Chrome__*` и соответствующие названия инструментов (navigate вместо navigate_page, screenshot вместо take_screenshot, и т.д.)

### Шаг 1: Открой реальный HL для сравнения

```
mcp__chrome-devtools__new_page({ url: "https://app.hyperliquid.xyz/trade" })
```

Держи ДВУХ вкладки одновременно:
- Вкладка 1: `http://localhost:3000/trade` (наш симулятор)
- Вкладка 2: `https://app.hyperliquid.xyz/trade` (реальный HL)

Переключайся между ними через `mcp__chrome-devtools__select_page({ pageId: N })`.

### Шаг 2: Скриншоты для визуального сравнения

**Полная страница:**
```
mcp__chrome-devtools__take_screenshot()
mcp__chrome-devtools__take_screenshot({ fullPage: true })
```

**Конкретный элемент по uid:**
```
// Сначала получи snapshot
mcp__chrome-devtools__take_snapshot()
// Найди uid нужного элемента, потом скриншот именно его
mcp__chrome-devtools__take_screenshot({ uid: "abc123" })
```

**Сравнение: делай скриншоты ОБЕИХ вкладок и сравнивай:**
1. `select_page({ pageId: 1 })` → `take_screenshot()` → наш UI
2. `select_page({ pageId: 2 })` → `take_screenshot()` → реальный HL
3. Сравни визуально: шрифты, цвета, отступы, размеры, расположение

### Шаг 3: Извлечение CSS стилей через JavaScript

Используй `evaluate_script` чтобы вытащить computed styles любого элемента:

```javascript
// Получить все computed styles элемента
mcp__chrome-devtools__evaluate_script({
  function: `(el) => {
    const s = getComputedStyle(el);
    return {
      color: s.color,
      backgroundColor: s.backgroundColor,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontFamily: s.fontFamily,
      padding: s.padding,
      margin: s.margin,
      border: s.border,
      borderRadius: s.borderRadius,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      gap: s.gap,
      width: s.width,
      height: s.height,
    };
  }`,
  args: [{ uid: "element-uid" }]
})
```

**Пример: вытащить стиль кнопки Buy/Sell на реальном HL:**
1. Открой реальный HL
2. `take_snapshot()` — найди uid кнопки
3. `evaluate_script(...)` с uid — получи все CSS свойства
4. Примени к нашему компоненту

### Шаг 4: Извлечение SVG иконок

**Получить innerHTML SVG элемента:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `(el) => {
    // Если сам элемент SVG
    if (el.tagName === 'svg' || el.tagName === 'SVG') return el.outerHTML;
    // Если SVG внутри
    const svg = el.querySelector('svg');
    return svg ? svg.outerHTML : 'no SVG found';
  }`,
  args: [{ uid: "icon-uid" }]
})
```

**Найти ВСЕ SVG на странице:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const svgs = document.querySelectorAll('svg');
    return Array.from(svgs).map((svg, i) => ({
      index: i,
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      viewBox: svg.getAttribute('viewBox'),
      classList: Array.from(svg.classList),
      parentText: svg.parentElement?.textContent?.trim()?.slice(0, 50)
    }));
  }`
})
```

**Скачать SVG как файл:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `(el) => {
    const svg = el.querySelector('svg') || el;
    return svg.outerHTML;
  }`,
  args: [{ uid: "svg-container-uid" }]
})
// Затем сохрани результат в файл через Write tool
```

### Шаг 5: Извлечение структуры DOM

**Получить HTML-структуру секции:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `(el) => {
    return el.innerHTML.slice(0, 5000); // первые 5000 символов
  }`,
  args: [{ uid: "section-uid" }]
})
```

**Получить список классов и атрибутов:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `(el) => {
    const children = el.querySelectorAll('*');
    return Array.from(children).slice(0, 30).map(c => ({
      tag: c.tagName,
      classes: c.className,
      text: c.textContent?.slice(0, 40)
    }));
  }`,
  args: [{ uid: "container-uid" }]
})
```

### Шаг 6: Извлечение цветовой палитры

**Собрать все уникальные цвета на странице:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const elements = document.querySelectorAll('*');
    const colors = new Set();
    const bgColors = new Set();
    elements.forEach(el => {
      const s = getComputedStyle(el);
      if (s.color !== 'rgb(0, 0, 0)') colors.add(s.color);
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColors.add(s.backgroundColor);
    });
    return {
      textColors: [...colors].slice(0, 20),
      bgColors: [...bgColors].slice(0, 20)
    };
  }`
})
```

### Шаг 7: Snapshot + Click для навигации

**Текстовый snapshot вместо скриншота (быстрее, содержит uid):**
```
mcp__chrome-devtools__take_snapshot()
```
Возвращает дерево a11y элементов с uid. Используй uid для click, fill, hover.

**Клик по элементу:**
```
mcp__chrome-devtools__click({ uid: "element-uid" })
```

**Hover для проверки hover-стилей:**
```
mcp__chrome-devtools__hover({ uid: "element-uid" })
// Потом take_screenshot() чтобы увидеть hover state
```

### Шаг 8: Полный workflow визуального аудита

1. Открой обе вкладки (наш + реальный HL)
2. На реальном HL: `take_snapshot()` → изучи структуру
3. На реальном HL: `take_screenshot()` → визуальный референс
4. На реальном HL: `evaluate_script()` → извлеки стили, SVG, цвета
5. Переключись на наш: `take_screenshot()` → текущее состояние
6. Сравни и найди отличия
7. Внеси правки в код
8. Перезагрузи нашу вкладку: `navigate_page({ type: "reload" })`
9. `take_screenshot()` → проверь что стало лучше
10. Повтори пока не будет pixel-perfect

### Шаг 9: Если элемент не виден на скриншоте

**Скролл к элементу:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `(el) => { el.scrollIntoView({ block: 'center' }); return 'scrolled'; }`,
  args: [{ uid: "element-uid" }]
})
```

**Изменить viewport для мобильного вида:**
```
mcp__chrome-devtools__emulate({ viewport: { width: 375, height: 812 } })
```

**Вернуть обычный viewport:**
```
mcp__chrome-devtools__emulate({ viewport: null })
```

### ВАЖНО: Правила визуального аудита

- **ВСЕГДА** делай скриншот ПОСЛЕ каждого изменения кода
- **ВСЕГДА** сравнивай с реальным HL а не "по памяти"
- Реальный HL может обновиться — если что-то выглядит иначе чем в HANDOFF, верь скриншоту
- Если не можешь разглядеть деталь — увеличь конкретный элемент через uid screenshot
- Сохраняй скриншоты для показа пользователю

---

## 📋 CHECKLIST ДЛЯ НОВОГО АГЕНТА

### При старте:
- [ ] Прочитать HANDOFF.md
- [ ] Определить среду (Mac или Sandbox) — запустить `pwd`
- [ ] Проверить Chrome MCP (Mac: `mcp__Claude_in_Chrome__tabs_context_mcp`, Sandbox: `mcp__chrome-devtools__list_pages`)
- [ ] Запустить dev server: `cd <путь-проекта>/hl-simulator && npm run dev`
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

### Chrome MCP — ДВА варианта (зависит от среды):

**Mac (Claude Code CLI):**
- Префикс: `mcp__Claude_in_Chrome__*`
- Инструменты: `tabs_context_mcp`, `navigate`, `screenshot`, `click`, `evaluate`, `fill`
- Подключение: `mcp__Claude_in_Chrome__tabs_context_mcp({ createIfEmpty: true })`
- MCP работает через Claude Desktop App SDK → Chrome Extension
- Путь проекта: `/Users/mac/Desktop/гит/simulator-trade/`

**Sandbox (Linux):**
- Префикс: `mcp__chrome-devtools__*`
- Инструменты: `list_pages`, `select_page`, `navigate_page`, `new_page`, `take_screenshot`, `take_snapshot`, `click`, `fill`, `hover`, `evaluate_script`, `press_key`, `emulate`
- MCP сервер: `npx chrome-devtools-mcp@latest`
- Путь проекта: `/home/user/simulator-trade/`

**В обоих случаях:** `localhost:3000` в Chrome = dev server. Все MCP управляют Chrome на Mac пользователя.

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
