# Environment Variables Configuration

This document lists all environment variables required for the PolyRadar application.

## Required Variables

### Supabase Configuration
These variables are **required** for the application to work properly:

```bash
VITE_SUPABASE_URL=https://ghfywkldzzgpyoxkiydt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZnl3a2xkenpncHlveGtpeWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODE2NDIsImV4cCI6MjA3NjY1NzY0Mn0.90pJCE21tmJoDVpnAmzpFrCJaf_lCLtnUkxU74_0_N8
```

## Optional Variables

### Application Branding
```bash
VITE_APP_TITLE=PolyRadar
VITE_APP_LOGO=https://placehold.co/40x40/3b82f6/ffffff?text=P
VITE_APP_ID=proj_polyradar
```

### OAuth Configuration
```bash
VITE_OAUTH_PORTAL_URL=https://vida.butterfly-effect.dev
```

### Analytics (Optional)
```bash
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## Setting Variables on Vercel

### Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project (polyradar)
3. Go to Settings → Environment Variables
4. Add each variable for all environments (Production, Preview, Development)

### Via Vercel CLI
```bash
# Add Supabase URL
vercel env add VITE_SUPABASE_URL production
# Paste: https://ghfywkldzzgpyoxkiydt.supabase.co

# Add Supabase Anon Key
vercel env add VITE_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZnl3a2xkenpncHlveGtpeWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODE2NDIsImV4cCI6MjA3NjY1NzY0Mn0.90pJCE21tmJoDVpnAmzpFrCJaf_lCLtnUkxU74_0_N8

# Repeat for preview and development environments
```

## Local Development

For local development, create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Then add the required variables to `.env.local`.

## Notes

- The `VITE_` prefix is required for variables that need to be accessible in the frontend
- Environment variables without the `VITE_` prefix are only available in API routes (serverless functions)
- The Supabase anon key is safe to expose in the frontend as it only provides row-level security access
- Never commit `.env.local` or `.env` files to version control

