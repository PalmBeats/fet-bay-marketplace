# GitHub Pages Deployment Guide

## Setup GitHub Pages

### 1. Push to GitHub
```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 2. Configure GitHub Secrets
Go to: `https://github.com/YOUR_USERNAME/Fet-Bay/settings/secrets/actions`

Add these secrets:
- `VITE_SUPABASE_URL` = Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key  
- `VITE_STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key

### 3. Enable GitHub Pages
1. Go to: `https://github.com/YOUR_USERNAME/Fet-Bay/settings/pages`
2. Source: "GitHub Actions"
3. Save

### 4. Automatic Deployment
- Push to `main` branch → Automatic deployment
- Site will be available at: `https://YOUR_USERNAME.github.io/Fet-Bay`

## Your Environment Variables
Replace these values in GitHub Secrets:

```bash
VITE_SUPABASE_URL=https://ynfvzbefyfetseqkktqt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZnZ6YmVmeWZldHNlcWtrdHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjcxOTIsImV4cCI6MjA3NDkwMzE5Mn0.CzWX_U7fwVoP4g8qFo4h8lVrA5mUPJOjeZZRQxJaRMs
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SDXOZAqP9MGvDebCnOp4yIuanT5L1WiFsMaKgzB1a01hsUunolgeg3CMx1eTaVl0HBJqKneT0p0ljFRw5RFJEBp00FEineLpp
```

## Production Features
✅ **Frontend:** React + TypeScript + Tailwind
✅ **Backend:** Supabase (Database + Auth + Functions)
✅ **Payments:** Stripe Connect with 10% platform fee
✅ **UI:** DKK pricing, responsive design
✅ **Deployment:** GitHub Pages with automatic CI/CD
