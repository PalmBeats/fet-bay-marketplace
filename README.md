# Fet-Bay Marketplace

A production-ready MVP marketplace web application built with React, Supabase, and Stripe Connect. Users can create listings (sellers) and purchase items (buyers) with secure payment processing.

## 🚀 Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Marketplace Listings**: Create, browse, and manage product listings
- **Stripe Connect Integration**: Secure payments with automatic seller payouts
- **Admin Dashboard**: User management, listing moderation, and analytics
- **Image Upload**: Supabase Storage for listing images
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live data with Supabase subscriptions

## 🏗️ Architecture

### Monorepo Structure
```
/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── supabase/     # Database schema and migrations
├── functions/        # Supabase Edge Functions (Deno)
└── .github/         # GitHub Actions workflows
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe Connect (Standard accounts)
- **Deployment**: GitHub Pages (static hosting)

## 📋 Prerequisites

- Node.js 18+ and Yarn
- Supabase account
- Stripe account (test mode)
- GitHub account

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd fet-bay-marketplace
yarn install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API and copy your project URL and anon key
3. Go to Settings > Database and copy your service role key

### 3. Database Setup

```bash
# Start Supabase locally (optional for development)
yarn workspace supabase start

# Apply database migrations
yarn db:push

# Seed with test data
yarn db:seed
```

### 4. Stripe Setup

1. Create a Stripe account and get your test API keys
2. Set up Stripe Connect in your dashboard
3. Create a webhook endpoint for payment events

### 5. Environment Variables

#### Frontend (apps/web/.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

#### Edge Functions (functions/.env.local)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CONNECT_APPLICATION_FEE_PERCENT=2.5
ADMIN_BOOTSTRAP_SECRET=your_secure_bootstrap_secret
SITE_URL=http://localhost:5173
```

### 6. Deploy Edge Functions

```bash
# Deploy all functions
yarn functions:deploy

# Or deploy individually
yarn functions:deploy:create-connect-link
yarn functions:deploy:create-checkout
yarn functions:deploy:stripe-webhook
yarn functions:deploy:admin-actions
```

### 7. Set Up Stripe Webhook

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Copy the webhook secret to your environment variables

### 8. Storage Setup

In Supabase Dashboard:
1. Go to Storage
2. Create a bucket named `listings`
3. Set it to public
4. Configure RLS policies for image uploads

### 9. Development

```bash
# Start frontend development server
yarn workspace web dev

# Start functions development server
yarn functions:dev

# Or start both concurrently
yarn dev
```

## 🚀 Deployment

### GitHub Pages Deployment

1. **Set up GitHub Secrets** in your repository settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`

2. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Source: GitHub Actions
   - The workflow will automatically deploy on push to main

3. **Update Environment Variables**:
   - Update `SITE_URL` in Edge Functions to your GitHub Pages URL
   - Redeploy functions: `yarn functions:deploy`

### Custom Domain (Optional)

1. Add your domain in GitHub Pages settings
2. Update `SITE_URL` in Edge Functions
3. Redeploy functions

## 🔧 Available Scripts

### Root Level
```bash
yarn dev              # Start both frontend and functions
yarn build            # Build frontend for production
yarn preview          # Preview production build
yarn db:push          # Apply database migrations
yarn db:seed          # Seed database with test data
yarn functions:deploy # Deploy all Edge Functions
```

### Frontend (apps/web)
```bash
yarn workspace web dev      # Start development server
yarn workspace web build    # Build for production
yarn workspace web preview  # Preview production build
yarn workspace web lint     # Run ESLint
yarn workspace web type-check # TypeScript type checking
```

### Database (apps/supabase)
```bash
yarn workspace supabase db:generate # Generate TypeScript types
yarn workspace supabase db:push     # Push schema changes
yarn workspace supabase db:seed     # Seed with test data
```

## 🧪 Testing

### Test Mode Setup

The application runs in test mode by default:

- **Stripe**: Use test API keys (pk_test_*, sk_test_*)
- **Test Card**: 4242 4242 4242 4242 (any future date, any CVC)
- **Supabase**: Use development project

### Admin Bootstrap

1. Go to `/__/newadmin`
2. Enter your `ADMIN_BOOTSTRAP_SECRET`
3. Your account will be promoted to admin
4. This can only be done once per installation

## 📊 Database Schema

### Core Tables
- `profiles`: User accounts and roles
- `listings`: Product listings
- `orders`: Purchase orders
- `shipping_addresses`: Delivery addresses
- `connect_accounts`: Stripe Connect accounts
- `bans`: User ban records

### Views
- `v_sales_overview`: Sales analytics by date
- `v_top_sellers`: Top performing sellers

### RLS Policies
- Users can only access their own data
- Admins have full access
- Banned users are restricted
- Public listings are viewable by all

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure user sessions
- **Input Validation**: Zod schemas for all forms
- **CORS Protection**: Configured for production domains
- **Environment Variables**: Secrets never exposed to client

## 🎯 Acceptance Criteria

✅ **User can create listing with images**
- Sign up/login required
- Image upload to Supabase Storage
- Form validation with Zod

✅ **Buyer can purchase items**
- Stripe test payment flow
- Shipping address collection
- Order status tracking

✅ **Admin dashboard functionality**
- Real-time metrics and charts
- User ban/unban capabilities
- Listing hide/unhide features

✅ **Bootstrap admin system**
- One-time admin promotion
- Secure secret-based access
- Prevents multiple admin creation

✅ **GitHub Pages deployment**
- Static site generation
- Environment variable injection
- SPA routing with 404.html fallback

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Supabase CORS settings include your domain
2. **Stripe Webhook Failures**: Check webhook secret and endpoint URL
3. **Image Upload Issues**: Verify Supabase Storage bucket permissions
4. **RLS Policy Errors**: Check user authentication and role assignments

### Debug Mode

Enable debug logging in Edge Functions:
```typescript
console.log('Debug info:', { user, data, error })
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Supabase and Stripe documentation
3. Open an issue in the repository

---

**Built with ❤️ using React, Supabase, and Stripe**
# Fet-Bay Marketplace
# Latest deployment test Thu Oct  2 18:12:27 CEST 2025
