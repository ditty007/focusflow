# FocusFlow Deployment Guide

This guide covers how to build and deploy FocusFlow to various hosting platforms.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## Building for Production

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting for better caching
- Source maps for debugging
- Optimized assets

### 3. Preview Production Build Locally

```bash
npm run preview
```

This serves the production build locally at `http://localhost:4173/`

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel offers the easiest deployment with automatic builds and previews.

#### Via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

#### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel auto-detects Vite - no configuration needed
5. Click "Deploy"

**Environment Variables:**
- Add environment variables in Project Settings → Environment Variables
- Use `.env.example` as a reference

### Option 2: Netlify

#### Via Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

#### Via Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click "Deploy site"

**Environment Variables:**
- Add in Site Settings → Build & Deploy → Environment

### Option 3: GitHub Pages

1. Install the `gh-pages` package:
```bash
npm install -D gh-pages
```

2. Update `vite.config.ts` to set the base path:
```typescript
export default defineConfig({
  base: '/focusflow/', // Replace with your repo name
  // ... rest of config
})
```

3. Add deploy script to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages in repository settings (Settings → Pages → Source: gh-pages branch)

### Option 4: Static Hosting (AWS S3, Google Cloud Storage, etc.)

1. Build the application:
```bash
npm run build
```

2. Upload the contents of the `dist/` directory to your hosting provider

**Important configurations:**
- Set up redirects for single-page application routing
- Configure CORS if needed
- Enable HTTPS
- Set proper cache headers for static assets

## Environment Configuration

### Development

Create a `.env` file in the project root:

```env
VITE_APP_NAME=FocusFlow
VITE_APP_VERSION=1.0.0
VITE_STORAGE_KEY=focusflow-tasks
```

### Production

For production deployments, set environment variables through your hosting provider's dashboard or CLI.

**Available Environment Variables:**
- `VITE_APP_NAME` - Application name (default: "FocusFlow")
- `VITE_APP_VERSION` - Version number (default: "1.0.0")
- `VITE_STORAGE_KEY` - LocalStorage key for tasks (default: "focusflow-tasks")

## Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Netlify
1. Go to Site Settings → Domain management
2. Add custom domain
3. Configure DNS records as instructed

## Performance Optimization

The production build includes:

✅ **Code Splitting** - Vendor libraries separated for better caching
✅ **Tree Shaking** - Unused code removed
✅ **Minification** - JavaScript and CSS compressed
✅ **Asset Optimization** - Images and fonts optimized
✅ **Source Maps** - Available for debugging production issues

## Monitoring and Analytics

To add analytics or error monitoring:

1. Choose a service (Google Analytics, Plausible, Sentry, etc.)
2. Add the tracking code to `index.html` or create a wrapper component
3. Set `VITE_ENABLE_ANALYTICS=true` in environment variables

## Troubleshooting

### Build Fails

- Check Node.js version: `node --version` (should be v18+)
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run build`

### Blank Page After Deployment

- Check browser console for errors
- Verify base path is correct in `vite.config.ts`
- Ensure all assets are loading (check Network tab)
- Check hosting provider's routing configuration

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_`
- Rebuild after changing environment variables
- Check hosting provider's environment variable settings

## Data Persistence

FocusFlow uses browser LocalStorage for data persistence. Data is stored locally on each user's device and is not synced across devices.

**Backup Recommendations:**
- Encourage users to use the Export feature regularly
- Export creates a JSON backup file that can be imported later
- Users should store backups securely (cloud storage, email, etc.)

## Security Considerations

- ✅ All data stored locally (no server-side storage)
- ✅ No external API calls or data transmission
- ✅ HTTPS enforced on production deployments
- ✅ Content Security Policy headers recommended
- ✅ No sensitive data collection

## Support

For issues or questions:
- Check the main README.md
- Review GitHub issues
- Contact the development team

---

**Last Updated:** December 2024
**Version:** 1.0.0
