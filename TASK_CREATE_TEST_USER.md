# 🎯 TASK: Create Test User in Supabase

## OBJECTIVE
Create a test user account in Supabase with:
- Email: `admin@gmail.com`
- Password: `anal123`

---

## CONTEXT

**Supabase Project**: https://spgalfxnmzxzzhcxdsuh.supabase.co
**App URL**: https://hl-simulator.vercel.app

Supabase Auth uses special `auth.users` table that requires specific API calls or UI.

---

## SOLUTION OPTIONS

### Option 1: Manual via Supabase Dashboard (FASTEST - 1 min)
**Instructions for user**:

1. Open: https://spgalfxnmzxzzhcxdsuh.supabase.co
2. Go to: **Authentication** → **Users**
3. Click: **Add user** → **Create new user**
4. Fill:
   - Email: `admin@gmail.com`
   - Password: `anal123`
   - Auto Confirm User: ✅ YES (important!)
5. Click: **Create user**
6. Done! User created ✅

**After user is created**:
- User will appear in Authentication → Users
- Can immediately sign in at https://hl-simulator.vercel.app
- Demo account will be auto-created on first login

---

### Option 2: Via Production App Signup (SIMPLE - 1 min)
**Instructions for user**:

1. Open: https://hl-simulator.vercel.app
2. Click: **Sign Up**
3. Enter:
   - Email: `admin@gmail.com`
   - Password: `anal123`
4. Click: **Sign Up**
5. Done! ✅

**This creates**:
- User in `auth.users`
- Demo account in `demo_accounts` with $10,000 balance
- Ready to use immediately

---

### Option 3: SQL Script (ADVANCED - requires service_role key)
**Note**: This requires Supabase service_role key (not recommended for security)

If user wants SQL approach, they need to:
1. Get service_role key from Supabase Settings
2. Use Supabase client with service_role
3. Call `supabase.auth.admin.createUser()`

**NOT RECOMMENDED** - use Option 1 or 2 instead.

---

## RECOMMENDED APPROACH

**OPTION 2** (via app signup) because:
- ✅ Fastest (1 minute)
- ✅ Tests the actual signup flow
- ✅ Auto-creates demo_account
- ✅ No need for admin panel

---

## INSTRUCTIONS FOR USER

**Just do this**:
1. Open: https://hl-simulator.vercel.app
2. Click "Sign Up"
3. Enter: admin@gmail.com / anal123
4. Click "Sign Up"
5. You're in! ✅

**That's it!** The app will:
- Create user in Supabase Auth
- Create demo_account with $10,000
- Log you in automatically

---

## VERIFICATION

After user is created, check:
1. Supabase → Authentication → Users → should see admin@gmail.com
2. Supabase → Table Editor → demo_accounts → should see account with balance 10000
3. Can sign in at https://hl-simulator.vercel.app

---

## ALTERNATIVE: If signup doesn't work

Then use **Option 1** (Supabase Dashboard):
1. https://spgalfxnmzxzzhcxdsuh.supabase.co
2. Authentication → Users → Add user
3. Email: admin@gmail.com
4. Password: anal123
5. Auto Confirm: YES ✅
6. Create user

Then sign in at app - demo_account will be created on first login.

---

## OUTPUT REQUIRED

Provide user with:
1. Clear instructions which option to use
2. Step-by-step guide
3. Verification steps

---

**RECOMMENDATION**: Tell user to use Option 2 (signup via app) - it's the simplest and tests the real flow!

---

START EXECUTION NOW.
