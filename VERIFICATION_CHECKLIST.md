# ✅ VERIFICATION CHECKLIST - HL Simulator

## 🎯 ЦЕЛЬ
Проверить что всё работает на production: https://hl-simulator.vercel.app

---

## PHASE 1: Supabase Database ✅ (скорее всего готово)

### Проверка:
1. Открыть: https://spgalfxnmzxzzhcxdsuh.supabase.co
2. Table Editor → проверить наличие таблиц:
   - ✅ demo_accounts
   - ✅ positions
   - ✅ order_history
   - ✅ trade_history
   - ✅ demo_fund_requests

3. SQL Editor → если таблиц нет, выполнить:
   - Файл: `/hl-simulator/supabase/schema.sql`
   - Скопировать весь SQL
   - Вставить в SQL Editor
   - Run

**Expected**: Все 5 таблиц созданы + RLS policies активны

---

## PHASE 2: Production Site Testing

### Test 1: Открытие сайта ✅
1. Открыть: https://hl-simulator.vercel.app
2. Проверить:
   - Страница загружается?
   - Нет ошибок в консоли (F12)?
   - Дизайн корректный?

**Expected**: Сайт открывается, показывает Auth форму

---

### Test 2: Sign Up / Sign In ✅
1. Кликнуть "Sign Up"
2. Ввести:
   - Email: `test@example.com`
   - Password: `password123`
3. Кликнуть "Sign Up"

**Expected**:
- ✅ Регистрация успешна
- ✅ Перенаправление на /trade
- ✅ В Supabase создан user + demo_account

**Проверка в Supabase**:
- Authentication → Users → должен появиться test@example.com
- Table Editor → demo_accounts → должна быть запись с balance = 10000

---

### Test 3: Trade Page ✅
**После авторизации:**

1. **Навигация**:
   - Balance показывается в хедере? (должно быть $10,000)
   - Кнопки Trade / Portfolio / Faucet кликабельны?

2. **Coin Selector**:
   - Можно переключить на BTC?
   - На ETH?
   - На SOL?
   - Статистика обновляется?

3. **График**:
   - График загружается?
   - Timeframe меняется (1m, 5m, 15m, 1h)?
   - Свечи видны?
   - Статус: "Connected" (зелёный) или "Disconnected" (жёлтый)?
   - **Fallback mode это ОК** - симуляция работает

4. **Order Book**:
   - Asks (красные) видны?
   - Bids (зелёные) видны?
   - Mid price показывается?

5. **Recent Trades**:
   - Список сделок показывается?
   - Цены обновляются?

6. **Order Form**:
   - Market/Limit tabs переключаются?
   - Long/Short кнопки работают?
   - Leverage slider двигается (1x - 50x)?
   - Available balance показывается?

7. **Открытие позиции**:
   - Выбрать: Long
   - Size: 100
   - Leverage: 10x
   - Кликнуть "Long Market"

   **Expected**:
   - ✅ Toast notification: "Long 100 HYPE @ [price] | 10x"
   - ✅ Позиция появилась внизу в Positions
   - ✅ Показывается Unrealized PnL
   - ✅ Кнопка "Close" видна

8. **Закрытие позиции**:
   - Кликнуть "Close" на открытой позиции

   **Expected**:
   - ✅ Toast: "Closed Long HYPE | PnL: +XX.XX"
   - ✅ Позиция исчезла из Positions
   - ✅ Появилась в History tab
   - ✅ Balance обновился

**Проверка в Supabase**:
- Table Editor → positions → должна быть пуста (если закрыли)
- Table Editor → trade_history → должна быть запись
- Table Editor → order_history → должна быть запись

---

### Test 4: Portfolio Page ✅
1. Кликнуть "Portfolio" в навигации
2. Проверить:
   - **Account Overview**:
     - Total Equity показывается?
     - Available Balance?
     - Unrealized PnL?
     - Realized PnL?

   - **Margin Overview**:
     - Used Margin?
     - Free Margin?
     - Margin Ratio?

   - **Open Positions**:
     - Если есть открытые позиции - они видны?
     - PnL обновляется?
     - ROE показывается?
     - Кнопка Close работает?

   - **Trade History**:
     - Закрытые позиции показываются?
     - PnL / ROE / Time корректны?
     - Индикатор ликвидации 💀 (если была)?

**Expected**: Все данные из Supabase отображаются корректно

---

### Test 5: Faucet Page ✅
1. Кликнуть "Faucet" в навигации
2. Проверить:
   - Current Balance показывается?
   - Можно выбрать сумму (1k, 5k, 10k, 50k)?
   - Кликнуть "Request $10,000 USDC"

**Expected**:
- ✅ Toast: "+10,000 USDC added to your account!"
- ✅ Balance обновился (было 10k, стало 20k)
- ✅ Request появился в Recent Requests
- ✅ В навигации balance = 20,000

3. Кликнуть "Reset Balance to $10,000"

**Expected**:
- ✅ Toast: "Balance reset to 10,000 USDC"
- ✅ Balance = 10,000

**Проверка в Supabase**:
- Table Editor → demo_fund_requests → должны быть записи
- Table Editor → demo_accounts → balance обновляется

---

### Test 6: Sign Out ✅
1. Кликнуть кнопку Sign Out (иконка выхода в навигации)

**Expected**:
- ✅ Перенаправление на Auth форму
- ✅ Можно войти снова

---

## PHASE 3: Mobile Testing 📱

### iPhone / iPad Safari:
1. Открыть https://hl-simulator.vercel.app
2. Проверить:
   - Layout корректный?
   - Кнопки кликабельны?
   - Trade page удобен?
   - График работает?
   - Форма ордеров заполняется?
   - Можно открыть/закрыть позицию?

### MacBook Safari/Chrome:
1. Открыть https://hl-simulator.vercel.app
2. Проверить те же пункты

**Expected**:
- ✅ Responsive дизайн работает
- ✅ Все функции доступны
- ✅ Touch interactions работают на mobile
- ✅ No critical UI bugs

---

## PHASE 4: Performance Check ⚡

### Проверить в Chrome DevTools:
1. F12 → Network tab
2. Reload страницы
3. Проверить:
   - Время загрузки < 3 секунды?
   - Supabase requests успешны (200)?
   - WebSocket подключается (или fallback)?
   - Нет 404 ошибок?

4. F12 → Console tab
5. Проверить:
   - Нет красных ошибок?
   - Warnings можно игнорировать (viewport metadata)

**Expected**: Нет критических ошибок

---

## SUCCESS CRITERIA ✅

Deployment считается успешным если:

- [x] Supabase таблицы созданы
- [x] Production site загружается
- [x] Sign Up/In работает
- [x] Trade page функционален
- [x] Можно открыть позицию
- [x] Можно закрыть позицию
- [x] Portfolio показывает данные
- [x] Faucet пополняет баланс
- [x] Mobile UI корректный
- [x] Нет критических багов

---

## KNOWN ISSUES (некритичные)

1. **WebSocket может быть Disconnected**
   - Это нормально! Fallback симуляция работает
   - Hyperliquid API может блокировать connections

2. **Viewport metadata warning**
   - Build warning, не влияет на функциональность
   - Можно исправить позже

3. **Limit ордера исполняются как Market**
   - Это known limitation (см. AUDIT)
   - Не баг, а отсутствие фичи

---

## TROUBLESHOOTING 🐛

### Ошибка: "Failed to fetch"
**Fix**: Проверить Supabase credentials в Vercel env vars

### Ошибка: "Row level security policy"
**Fix**: Запустить schema.sql в Supabase

### Ошибка: Auth не работает
**Fix**:
1. Supabase → Authentication → Settings
2. Проверить что Email provider включен
3. Site URL: https://hl-simulator.vercel.app
4. Redirect URLs: https://hl-simulator.vercel.app/auth/callback

### График не загружается
**Fix**: Это ОК если WebSocket disconnected - fallback работает

---

## NEXT STEPS AFTER VERIFICATION

После успешной проверки:

1. ✅ **Share URL** с тестерами
2. 📊 **Собрать feedback**
3. 🐛 **Зафиксировать баги** (если есть)
4. 🚀 **Решить** что делать дальше:
   - Доделать limit orders?
   - Добавить SL/TP?
   - Улучшить UI?
   - Custom domain?

---

## 📝 TESTING LOG

Заполни после тестирования:

**Date**: _______
**Tester**: _______

| Test | Status | Notes |
|------|--------|-------|
| Sign Up | ⬜ Pass / ⬜ Fail | |
| Sign In | ⬜ Pass / ⬜ Fail | |
| Open Position | ⬜ Pass / ⬜ Fail | |
| Close Position | ⬜ Pass / ⬜ Fail | |
| Portfolio | ⬜ Pass / ⬜ Fail | |
| Faucet | ⬜ Pass / ⬜ Fail | |
| Mobile UI | ⬜ Pass / ⬜ Fail | |

**Critical Bugs Found**: _______
**Overall Status**: ⬜ PASS / ⬜ FAIL

---

*Checklist created: 5 февраля 2026*
