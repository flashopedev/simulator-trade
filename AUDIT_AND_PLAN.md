# 🔍 ПОЛНЫЙ АУДИТ ПРОЕКТА HL SIMULATOR

## 📁 ТЕКУЩЕЕ СОСТОЯНИЕ

### Структура проекта
```
/simulator-trade
├── .git/           # Git репозиторий (2 коммита)
└── index.html      # Единственный файл - монолит ~736 строк
```

### Что уже реализовано ✅

| Функция | Статус | Качество |
|---------|--------|----------|
| График свечей (Canvas) | ✅ | Хорошо |
| WebSocket к Hyperliquid API | ✅ | Хорошо |
| Order Book (bid/ask) | ✅ | Хорошо |
| Recent Trades | ✅ | Хорошо |
| Market/Limit ордера | ✅ | Базово |
| Long/Short позиции | ✅ | Хорошо |
| Leverage 1x-50x | ✅ | Хорошо |
| Cross/Isolated margin | ✅ | UI только |
| Расчёт ликвидации | ✅ | Базово |
| PnL расчёт | ✅ | Хорошо |
| История сделок | ✅ | В памяти |
| Мульти-пары (HYPE, BTC, ETH, SOL) | ✅ | Хорошо |
| Мобильная адаптивность | ✅ | Хорошо |
| Fallback симуляция | ✅ | Хорошо |

### Критические проблемы ❌

1. **Нет персистентности данных**
   - Баланс = `10000` захардкожен
   - Позиции теряются при F5
   - История в `let S = {...}` (память)

2. **Нет страницы Portfolio**
   - Навигация есть, но кнопки не работают

3. **Нет Request Demo Funds**
   - Нельзя пополнить баланс

4. **Нет базы данных**
   - Всё в localStorage/памяти браузера

5. **Нет аутентификации**
   - Нет разделения пользователей

---

## 🎯 ТРЕБУЕМЫЙ ФУНКЦИОНАЛ

### 1. Trade Page (расширить существующую)
- [x] График с реальными данными
- [x] Order Book
- [x] Order Form (Market/Limit)
- [ ] **Stop-Loss / Take-Profit ордера**
- [ ] **Trailing Stop**
- [ ] **Reduce-Only опция**
- [ ] **TPSL на позицию**
- [ ] **История ордеров (Orders tab)**
- [ ] **Сохранение в БД**

### 2. Portfolio Page (новая)
- [ ] Account Overview (Equity, Available, Margin Used)
- [ ] Open Positions с PnL
- [ ] Open Orders
- [ ] Trade History
- [ ] PnL Chart/Statistics
- [ ] Funding History
- [ ] Transfer History

### 3. Request Demo Funds (новая)
- [ ] Форма запроса USDC
- [ ] Лимиты (например 10,000 USDC max)
- [ ] Cooldown между запросами
- [ ] История пополнений

---

## 🏗️ РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА

### Вариант A: Next.js + Supabase (РЕКОМЕНДУЮ)
```
Плюсы:
✅ Быстрый деплой на Vercel
✅ Supabase = БД + Auth + Realtime бесплатно
✅ SSR для SEO (не критично для трейдинга)
✅ API Routes встроены
✅ Хорошо работает mobile/desktop

Минусы:
❌ Больше файлов и сложнее структура
❌ Требует миграцию текущего кода
```

### Вариант B: Vanilla HTML + Supabase JS SDK
```
Плюсы:
✅ Минимальные изменения текущего кода
✅ Просто добавить Supabase client
✅ Можно захостить где угодно

Минусы:
❌ Нет SSR
❌ Код быстро станет нечитаемым
❌ Сложнее масштабировать
```

### Вариант C: React SPA + Supabase
```
Плюсы:
✅ Современный стек
✅ Компонентный подход
✅ Хорошая экосистема

Минусы:
❌ Полная переписка
❌ Нужен build step
```

---

## 📊 СХЕМА БАЗЫ ДАННЫХ (Supabase)

```sql
-- Пользователи (используем Supabase Auth)
-- auth.users автоматически

-- Демо аккаунты
CREATE TABLE demo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  balance DECIMAL(20,2) DEFAULT 10000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Позиции
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES demo_accounts(id),
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL, -- 'Long' | 'Short'
  size DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  leverage INTEGER NOT NULL,
  margin_mode VARCHAR(10) DEFAULT 'cross',
  liquidation_price DECIMAL(20,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- История ордеров
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES demo_accounts(id),
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL,
  order_type VARCHAR(10) NOT NULL, -- 'market' | 'limit'
  size DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  status VARCHAR(10) DEFAULT 'filled', -- 'filled' | 'cancelled'
  fee DECIMAL(20,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- История сделок (закрытые позиции)
CREATE TABLE trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES demo_accounts(id),
  position_id UUID,
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL,
  size DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  exit_price DECIMAL(20,8) NOT NULL,
  pnl DECIMAL(20,8) NOT NULL,
  leverage INTEGER,
  liquidated BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Запросы демо средств
CREATE TABLE demo_fund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES demo_accounts(id),
  amount DECIMAL(20,2) NOT NULL,
  status VARCHAR(10) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (безопасность)
ALTER TABLE demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_fund_requests ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои данные
CREATE POLICY "Users see own account" ON demo_accounts
  FOR ALL USING (auth.uid() = user_id);
-- ... аналогично для остальных таблиц
```

---

## 🚀 ПЛАН РЕАЛИЗАЦИИ (БЫСТРЫЙ)

### Фаза 1: Подготовка (30 мин)
1. Создать Supabase проект
2. Настроить схему БД
3. Включить Auth (magic link / email)
4. Получить API ключи

### Фаза 2: Миграция на Next.js (2-3 часа)
```
/app
  /page.tsx              # Редирект на /trade
  /trade/page.tsx        # Trade page (порт текущего HTML)
  /portfolio/page.tsx    # Portfolio page
  /faucet/page.tsx       # Request Demo Funds
  /layout.tsx            # Общий layout + nav
/components
  /Chart.tsx
  /OrderBook.tsx
  /OrderForm.tsx
  /Positions.tsx
  /TradeHistory.tsx
  /Navigation.tsx
/lib
  /supabase.ts           # Supabase client
  /trading.ts            # Trading logic
  /websocket.ts          # WS to Hyperliquid
/hooks
  /usePrice.ts
  /usePositions.ts
  /useAccount.ts
```

### Фаза 3: Интеграция Supabase (2 часа)
1. Auth flow (sign up / sign in)
2. CRUD для позиций
3. История ордеров
4. Баланс и пополнения

### Фаза 4: Portfolio Page (1.5 часа)
1. Account overview
2. Positions list
3. Trade history
4. PnL stats

### Фаза 5: Faucet Page (30 мин)
1. Request form
2. Cooldown logic
3. History

### Фаза 6: Тестирование + Деплой (1 час)
1. Тест на iPhone
2. Тест на MacBook
3. Деплой на Vercel
4. Подключить домен (опционально)

---

## ⚡ БЫСТРЫЙ СТАРТ (АЛЬТЕРНАТИВА)

Если хотите **минимум изменений** текущего кода:

1. **Добавить Supabase JS SDK** в текущий HTML
2. **Добавить localStorage backup** + sync с Supabase
3. **Создать 2 новых HTML файла** (portfolio.html, faucet.html)
4. **Захостить на Vercel** как статику

```javascript
// Добавить в текущий index.html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
const supabase = window.supabase.createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);
// Sync state with Supabase...
</script>
```

---

## 🎯 МОЯ РЕКОМЕНДАЦИЯ

**Выбрать Next.js + Supabase** потому что:

1. ✅ Vercel + Supabase = полностью бесплатно для demo
2. ✅ Лучше масштабируется
3. ✅ Проще поддерживать
4. ✅ Mobile-first из коробки
5. ✅ Auth решён за 5 минут
6. ✅ TypeScript для безопасности

**Общее время: ~8 часов** для полной реализации

---

## ❓ ВОПРОСЫ ПЕРЕД НАЧАЛОМ

1. **Нужна ли авторизация?** (email/пароль или анонимно?)
2. **Какой начальный баланс?** (10,000 USDC?)
3. **Лимиты на faucet?** (сколько можно запросить, как часто?)
4. **Нужны ли уведомления?** (email при ликвидации?)
5. **Домен есть?** (или использовать vercel.app?)

---

## 📱 СОВМЕСТИМОСТЬ

| Устройство | Текущий код | После рефакторинга |
|------------|-------------|-------------------|
| iPhone Safari | ✅ | ✅ |
| iPhone Chrome | ✅ | ✅ |
| MacBook Safari | ✅ | ✅ |
| MacBook Chrome | ✅ | ✅ |
| Android | ✅ | ✅ |
| Windows | ✅ | ✅ |

---

*Аудит выполнен: 5 февраля 2026*
