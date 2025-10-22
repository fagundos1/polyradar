# PolyRadar Deployment Guide

## Vercel Deployment

This project is configured for deployment on Vercel with the following setup:

### Required Environment Variables

Set these variables in your Vercel dashboard:

```
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
OAUTH_SERVER_URL=your_oauth_server_url
OWNER_OPEN_ID=your_owner_open_id
VITE_APP_ID=your_app_id
VITE_APP_TITLE=PolyRadar
VITE_APP_LOGO=https://placehold.co/40x40/3b82f6/ffffff?text=P
NODE_ENV=production
```

### Optional Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_analytics_website_id
BUILT_IN_FORGE_API_URL=your_forge_api_url
BUILT_IN_FORGE_API_KEY=your_forge_api_key
```

### Domain Configuration

To use the custom domain `polyradar.io`:

1. Add the domain in Vercel dashboard
2. Configure DNS records as instructed by Vercel
3. Enable SSL certificate (automatic)

### Build Process

The project uses:
- `pnpm` as package manager
- Vite for client-side bundling
- esbuild for server-side bundling
- Express.js server with tRPC API

### Project Structure

- `client/` - React frontend
- `server/` - Express.js backend with tRPC
- `shared/` - Shared types and constants
- `dist/` - Built application (generated)

### API Routes

- `/api/trpc/*` - tRPC API endpoints
- `/api/webhooks/*` - Webhook handlers
- `/api/oauth/*` - OAuth callbacks
- `/*` - React SPA (fallback to index.html)
