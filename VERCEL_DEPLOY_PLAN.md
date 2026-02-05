# 🚀 VERCEL DEPLOYMENT PLAN - HL Simulator

## 📋 ЦЕЛЬ
Задеплоить hl-simulator на Vercel для тестирования на реальных устройствах (iPhone, MacBook).

---

## ✅ ЧТО УЖЕ ГОТОВО

1. ✅ Supabase проект настроен
   - URL: `https://spgalfxnmzxzzhcxdsuh.supabase.co`
   - Anon Key: `sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja`
   - SQL Schema применён (5 таблиц + RLS)

2. ✅ Next.js проект готов
   - Папка: `/hl-simulator`
   - 23 файла, 3470 строк кода
   - package.json с зависимостями

3. ✅ Environment variables
   - `.env.local` создан (для локальной разработки)
   - `vercel.json` создан (для деплоя)

---

## 📝 IMPLEMENTATION PLAN

### PHASE 1: Подготовка Git репозитория
**Executor**: Claude Code

**Шаги**:
1. Проверить текущий git status в `/simulator-trade`
2. Добавить `.env.local` в `.gitignore` (если не добавлен)
3. Stage все изменения: `git add .`
4. Сделать коммит: `git commit -m "feat: add Supabase integration and Vercel config"`
5. Проверить есть ли remote: `git remote -v`
6. Если remote нет - создать GitHub репозиторий

**Expected Output**:
```bash
✅ Git repo ready
✅ All files committed
✅ Remote set (if needed)
```

**Verification**:
- `git log` показывает последний коммит
- `git status` показывает "working tree clean"

---

### PHASE 2: Push в GitHub (если нужен новый repo)
**Executor**: Пользователь (ручная авторизация)

**Шаги**:
1. Создать новый приватный репозиторий на GitHub
   - Название: `hl-simulator`
   - Private: да
   - НЕ добавлять README, .gitignore, license

2. Добавить remote:
   ```bash
   git remote add origin https://github.com/[username]/hl-simulator.git
   ```

3. Push код:
   ```bash
   git push -u origin main
   ```

**Expected Output**:
```
✅ GitHub repo created
✅ Code pushed
✅ Repo URL: https://github.com/[username]/hl-simulator
```

---

### PHASE 3: Vercel Deployment
**Executor**: Пользователь (через Vercel UI)

**Шаги**:

1. **Создать Vercel аккаунт** (если нет)
   - Перейти: https://vercel.com/signup
   - Sign up через GitHub

2. **Import проект**
   - Dashboard → New Project
   - Import Git Repository
   - Выбрать `hl-simulator` из списка
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detect)
   - Root Directory: `./hl-simulator`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://spgalfxnmzxzzhcxdsuh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja
   ```

5. **Deploy**
   - Click "Deploy"
   - Ждать ~2-3 минуты

**Expected Output**:
```
✅ Build successful
✅ Deployment live
✅ URL: https://hl-simulator-[hash].vercel.app
```

---

### PHASE 4: Проверка деплоя
**Executor**: Архитектор (я) + Пользователь

**Шаги проверки**:

1. **Открыть URL** → https://hl-simulator-[hash].vercel.app

2. **Проверить Sign Up**
   - Создать тестовый аккаунт: test@test.com / password123
   - Должен создаться demo_account с балансом 10,000

3. **Проверить Trade Page**
   - График загружается?
   - Order Book обновляется?
   - WebSocket connected?
   - Открыть позицию (Long HYPE 100 @ market)
   - Позиция появилась в списке?

4. **Проверить Portfolio Page**
   - Account Overview показывает баланс?
   - Открытая позиция видна?
   - PnL рассчитывается?

5. **Проверить Faucet Page**
   - Request $10,000 → баланс увеличился?
   - История запросов записывается?

**Expected Result**:
```
✅ Sign Up/In работает
✅ Trade page работает
✅ WebSocket подключается
✅ Позиции открываются/закрываются
✅ Portfolio показывает данные
✅ Faucet пополняет баланс
```

---

### PHASE 5: Mobile Testing
**Executor**: Пользователь (на устройствах)

**Тестировать на**:
1. iPhone Safari
2. iPhone Chrome
3. MacBook Safari
4. MacBook Chrome

**Что проверить**:
- Responsive layout корректный?
- Touch работает?
- Навигация работает?
- Формы заполняются?
- Позиции открываются?

**Expected Result**:
```
✅ Mobile UI корректный
✅ Desktop UI корректный
✅ Touch interactions работают
✅ No critical bugs
```

---

## 🐛 TROUBLESHOOTING

### Проблема 1: Build Failed
**Симптом**: Vercel показывает build error

**Fix**:
1. Проверить в логах Vercel какая ошибка
2. Чаще всего: missing dependencies
3. Исправить в `package.json`
4. Push fix в GitHub
5. Vercel автоматически rebuild

### Проблема 2: Supabase connection failed
**Симптом**: "Failed to connect to Supabase" в консоли

**Fix**:
1. Проверить Environment Variables в Vercel
2. Убедиться что URL и Key правильные
3. Redeploy project

### Проблема 3: WebSocket не подключается
**Симптом**: "Disconnected" статус, fallback симуляция

**Fix**:
- Это нормально! Hyperliquid API может быть недоступен
- Fallback режим работает нормально
- Можно использовать симулированные данные

### Проблема 4: RLS блокирует запросы
**Симптом**: "Row level security policy violated"

**Fix**:
1. Проверить в Supabase SQL Editor что все policies применены
2. Проверить в Supabase Auth что пользователь создан
3. Проверить в Supabase Table Editor что demo_account создался

---

## 📊 SUCCESS CRITERIA

Deployment считается успешным если:

✅ Build прошёл без ошибок
✅ App открывается по URL
✅ Auth работает (sign up / sign in)
✅ Trade page загружается
✅ График показывает данные (real-time или fallback)
✅ Можно открыть позицию
✅ Можно закрыть позицию
✅ Portfolio показывает баланс и позиции
✅ Faucet пополняет баланс
✅ Mobile UI не сломан

---

## ⏱️ ESTIMATED TIME

| Phase | Time |
|-------|------|
| Phase 1: Git prep | 5 min |
| Phase 2: GitHub push | 5 min |
| Phase 3: Vercel deploy | 10 min |
| Phase 4: Verification | 10 min |
| Phase 5: Mobile testing | 15 min |
| **TOTAL** | **45 min** |

---

## 🎯 NEXT STEPS AFTER DEPLOY

После успешного деплоя:

1. **Собрать feedback** от тестирования
2. **Зафиксировать баги** (если найдены)
3. **Решить** что делать дальше:
   - Option A: Доделать limit orders
   - Option B: Добавить SL/TP
   - Option C: Улучшить UI/UX
   - Option D: Запустить в production

---

## 📝 NOTES

- Vercel даёт **unlimited deployments** на Free tier
- Preview deployments создаются автоматически для каждого PR
- Production URL: `hl-simulator.vercel.app` (можно настроить custom domain)
- Supabase Free tier: **500MB database, 50k auth users** - достаточно для demo

---

## 🚀 READY TO START?

Этот план готов к выполнению. Начинаем с **Phase 1**?

Скажи "GO" и я запущу Claude Code для выполнения Phase 1.

---

*Plan created: 5 февраля 2026*
