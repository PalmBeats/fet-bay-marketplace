# 🔐 GitHub Secrets Setup for Real Supabase Data

## ⚠️ IMPORTANT: Set these secrets in GitHub Repository

**Go to:** https://github.com/PalmBeats/fet-bay-marketplace/settings/secrets/actions

### Add these repository secrets:

1. **VITE_SUPABASE_URL**
   - Value: `https://ynfvzbefyfetseqkktqt.supabase.co`

2. **VITE_SUPABASE_ANON_KEY** 
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZnZ6YmVmeWZldHNlcWtrdHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjcxOTIsImV4cCI6MjA3NDkwMzE5Mn0.CzWX_U7fwVoP4g8qFo4h8lVrA5mUPJOjeZZRQxJaRMs`

3. **VITE_STRIPE_PUBLISHABLE_KEY**
   - Value: `pk_test_51SDXOZAqP9MGvDebCnOp4yIuanT5L1WiFsMaKgzB1a01hsUunolgeg3CMx1eTaVl0HBJqKneT0p0ljFRw5RFJEBp00FEineLpp`

## 🔄 After adding secrets:

1. Run this command to trigger redeployment:
   ```bash
   git commit --allow-empty -m "Trigger redeployment with real Supabase data"
   git push
   ```

2. Or manually run GitHub Actions workflow:
   https://github.com/PalmBeats/fet-bay-marketplace/actions

## ✅ Verification:

After deployment, the live site should show:
- Real Supabase database content
- User authentication works with real accounts
- Admin dashboard accessible
