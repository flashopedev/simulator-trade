# HL Simulator - Deployment Instructions

This document provides step-by-step instructions for deploying the HL Simulator to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Git installed on your local machine

## Step 1: Create a GitHub Repository (if needed)

The code is already set to push to: `https://github.com/flashopedev/simulator-trade.git`

If you don't have this repository yet:

1. Go to https://github.com/new
2. Create a new repository named `simulator-trade`
3. Set it to public or private (your choice)
4. Do NOT initialize with README, .gitignore, or license (they already exist)

## Step 2: Push Code to GitHub

The code is currently committed locally and ready to push. To push to GitHub:

```bash
cd /sessions/adoring-determined-thompson/mnt/simulator-trade
git push origin main
```

If you get authentication errors:
- Use a GitHub Personal Access Token (PAT) as your password, or
- Configure SSH keys for authentication
- See: https://docs.github.com/en/authentication

## Step 3: Connect Vercel to Your GitHub Repository

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select "GitHub" and authorize Vercel to access your repositories
4. Find and select the `simulator-trade` repository
5. Click "Import"

## Step 4: Configure Environment Variables in Vercel

This is crucial! The app requires these environment variables:

1. In the Vercel project settings, go to **Settings → Environment Variables**

2. Add the following variables:

   - **NEXT_PUBLIC_SUPABASE_URL**
     - Value: `https://spgalfxnmzxzzhcxdsuh.supabase.co`
     - Scope: Production, Preview, Development

   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**
     - Value: `sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja`
     - Scope: Production, Preview, Development

3. Click "Save" after entering each variable

Note: These are public anon keys (safe to expose in browser). Actual credentials are managed by Supabase.

## Step 5: Configure Build Settings in Vercel

1. In **Settings → Build & Development Settings**:

   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: `.next`

2. The `vercel.json` in the project already contains these settings, so they may auto-configure

## Step 6: Deploy

1. After configuring environment variables, go to the **Deployments** tab
2. Click "Deploy" or wait for automatic deployment (triggered by git push)
3. Vercel will build and deploy the app
4. You'll receive a URL like: `https://simulator-trade.vercel.app`

## Step 7: Verify Deployment

1. Visit the deployment URL
2. Test the following features:
   - User authentication (Sign in / Sign up)
   - Trade page with live market data
   - Portfolio page
   - Faucet page for test tokens
   - Real-time WebSocket data from Hyperliquid API

## Troubleshooting

### Build Fails with "Module not found"

- Verify all dependencies are in `package.json`
- Check that `hl-simulator` folder is properly referenced
- Clear Vercel cache and redeploy

### Environment Variables Not Working

- Verify exact spelling of variable names (case-sensitive)
- Ensure they're set for Production environment
- Redeploy after changing variables

### Supabase Connection Issues

- Verify the URL and Anon Key are correct in environment variables
- Check that Supabase project is running
- Test connection locally first: `npm run dev` in hl-simulator folder

### WebSocket Connection Failed

- This is expected for real-time Hyperliquid data
- Check browser console for network errors
- Verify Hyperliquid API endpoint is accessible

## Local Testing Before Deployment

To test locally before deploying to Vercel:

```bash
cd /sessions/adoring-determined-thompson/mnt/simulator-trade/hl-simulator
npm install
npm run dev
```

Visit http://localhost:3000 and test all features.

## Project Structure

```
simulator-trade/
├── hl-simulator/          # Main Next.js application
│   ├── src/
│   │   ├── app/          # Pages (Trade, Portfolio, Faucet)
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities (Supabase, Hyperliquid)
│   ├── public/           # Static assets
│   ├── supabase/         # Database schema
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── vercel.json       # Vercel configuration
└── hl-app/               # Alternative version (reference)
```

## Important Notes

- **Environment Variables**: Never commit `.env.local` to git (already in .gitignore)
- **Supabase**: Database tables are auto-created via the schema in `supabase/schema.sql`
- **Authentication**: Uses Supabase Auth with magic links
- **Real-time**: WebSocket connection to Hyperliquid API (optional, gracefully degrades)

## Support

For issues with:
- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Hyperliquid API**: https://hyperliquid.gitbook.io/hyperliquid-docs

## Summary

The project is ready for deployment. Once you:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Trigger deployment

Your HL Simulator will be live on the internet!
