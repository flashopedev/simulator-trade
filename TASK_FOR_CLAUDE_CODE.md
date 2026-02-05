# 🚀 TASK: Git Push + Vercel Deployment

## OBJECTIVE
Push all project code to Git and prepare deployment instructions for Vercel.

---

## CONTEXT

**Project**: HL Simulator (Hyperliquid Trading Simulator)
**Location**: `/sessions/adoring-determined-thompson/mnt/simulator-trade`
**Target**: Deploy `hl-simulator` folder to Vercel

**Supabase Credentials**:
- URL: `https://spgalfxnmzxzzhcxdsuh.supabase.co`
- Anon Key: `sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja`

---

## TASKS

### Task 1: Prepare .gitignore
**Action**: Ensure `.gitignore` includes:
```
# dependencies
node_modules/
.npm/

# next.js
.next/
out/
build/

# env files
.env
.env.local
.env.*.local

# misc
.DS_Store
*.pem
```

**Verification**: `.env.local` should NOT be tracked by git

---

### Task 2: Git Commit All Changes
**Actions**:
1. Navigate to project root: `cd /sessions/adoring-determined-thompson/mnt/simulator-trade`
2. Check status: `git status`
3. Add all files: `git add .`
4. Commit: `git commit -m "feat: complete HL Simulator with Supabase integration

- Migrated from HTML monolith to Next.js + TypeScript
- Added Supabase database (5 tables with RLS)
- Implemented Trade, Portfolio, Faucet pages
- Added real-time WebSocket to Hyperliquid API
- Mobile responsive design
- Ready for Vercel deployment"`

**Verification**:
- `git log` shows new commit
- `git status` shows "working tree clean"

---

### Task 3: Check Remote Repository
**Actions**:
1. Check if remote exists: `git remote -v`
2. If no remote exists:
   - Output: "⚠️ No remote found. User needs to create GitHub repo first."
   - Provide instructions for user

**Expected Output**:
- Either: Remote exists (origin) ✅
- Or: Instructions for user to create GitHub repo

---

### Task 4: Create Deployment Instructions
**Action**: Create a file `DEPLOYMENT_INSTRUCTIONS.md` with step-by-step Vercel deployment guide for the user.

**Content should include**:
1. How to create GitHub repo (if needed)
2. How to push code to GitHub
3. How to connect Vercel to GitHub repo
4. How to configure environment variables in Vercel
5. How to deploy

---

### Task 5: Create Vercel Configuration
**Action**: Verify/create `vercel.json` in `/hl-simulator` folder:

```json
{
  "framework": "nextjs",
  "buildCommand": "cd hl-simulator && npm install && npm run build",
  "outputDirectory": "hl-simulator/.next",
  "installCommand": "cd hl-simulator && npm install"
}
```

**Note**: Environment variables should be added in Vercel UI, NOT in vercel.json

---

## IMPORTANT NOTES

1. **DO NOT commit .env.local** - it contains credentials
2. **DO NOT push to GitHub** - user will do it manually (requires auth)
3. **DO NOT try to deploy to Vercel** - user will do it via UI
4. **DO focus on**: Git prep, commit, and creating user instructions

---

## SUCCESS CRITERIA

✅ All project files committed to Git
✅ `.gitignore` properly configured
✅ `.env.local` NOT tracked by Git
✅ Commit message descriptive
✅ Remote status checked
✅ User instructions created
✅ Vercel config verified

---

## OUTPUT REQUIRED

At the end, provide:
1. Git commit hash
2. Number of files committed
3. Whether remote exists or needs to be created
4. Path to deployment instructions file
5. Confirmation that project is ready for user to push + deploy

---

## ESTIMATED TIME
5-10 minutes

---

START EXECUTION NOW.
