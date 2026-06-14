# Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Add Environment Variables in Vercel Dashboard**
- Go to Project Settings → Environment Variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

4. **Deploy to Production**
```bash
vercel --prod
```

### Option 2: Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build the project**
```bash
npm run build
```

3. **Deploy**
```bash
netlify deploy
```

4. **Add Environment Variables**
- Go to Site Settings → Environment Variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

5. **Deploy to Production**
```bash
netlify deploy --prod
```

### Option 3: GitHub Pages (Static)

1. **Install gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **Update package.json**
```json
{
  "scripts": {
    "deploy": "vite build && gh-pages -d dist"
  }
}
```

3. **Deploy**
```bash
npm run deploy
```

**Note**: You'll need to add environment variables during build.

### Option 4: Custom Server

1. **Build the project**
```bash
npm run build
```

2. **Upload `dist/` folder** to your web server

3. **Configure web server**
- Point document root to `dist/`
- Enable SPA routing (redirect all routes to index.html)

**Nginx Example**:
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/g6-admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache Example** (.htaccess in dist/):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Environment Variables

All deployment platforms need these environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Setting Environment Variables

**Vercel**:
- Dashboard → Project Settings → Environment Variables

**Netlify**:
- Site Settings → Build & Deploy → Environment

**GitHub Actions**:
- Repository Settings → Secrets and Variables → Actions

## Security Checklist

Before deploying to production:

- [ ] Change default password in `src/AdminPanel.jsx` line 22
- [ ] Use environment variables for Supabase credentials
- [ ] Enable HTTPS on your domain
- [ ] Configure Supabase RLS policies for admin access
- [ ] Set up proper authentication (Supabase Auth)
- [ ] Add rate limiting
- [ ] Enable audit logging
- [ ] Restrict admin panel to specific IP addresses (optional)
- [ ] Set up monitoring and alerts

## Post-Deployment

1. **Test the deployment**
   - Access your admin panel URL
   - Login with credentials
   - Test CRUD operations
   - Verify data sync with main app

2. **Configure custom domain** (optional)
   - Add DNS records
   - Configure SSL certificate
   - Update CORS settings in Supabase

3. **Set up monitoring**
   - Error tracking (Sentry, LogRocket)
   - Analytics (Google Analytics, Plausible)
   - Uptime monitoring (UptimeRobot, Pingdom)

## Recommended Architecture

```
Main App:        app.yourdomain.com
Admin Panel:     admin.yourdomain.com
Supabase:        [your-project].supabase.co
```

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Troubleshooting

### Build fails with missing environment variables
- Ensure all VITE_* variables are set in deployment platform

### Admin panel shows blank page
- Check browser console for errors
- Verify Supabase credentials are correct
- Check CORS settings in Supabase

### Cannot save/update data
- Verify RLS policies in Supabase
- Check network tab for API errors
- Ensure Supabase anon key has correct permissions

## Support

For deployment issues:
- Check the platform's documentation
- Review build logs
- Test locally with `npm run build && npm run preview`
