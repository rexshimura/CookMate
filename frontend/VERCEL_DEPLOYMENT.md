# CookMate Vercel Deployment Guide

## Overview
This guide will help you deploy the CookMate frontend to Vercel while keeping your Firebase Functions backend intact. The app will be fully functional with fast global CDN distribution.

## Prerequisites
- [ ] Vercel account (free tier works)
- [ ] GitHub/GitLab repository (recommended)
- [ ] Your Firebase project is already set up (it is!)

## Quick Deployment Steps

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
Navigate to the frontend directory and run:
```bash
cd frontend
npm run deploy
```

Or use Vercel CLI directly:
```bash
cd frontend
vercel
```

### 3. Set Environment Variables in Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings > Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://us-central1-cookmate-cc941.cloudfunctions.net/api` | Production, Preview, Development |

### 4. Configure Custom Domain (Optional)
1. In Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain
3. Configure DNS records as instructed

## Manual Deployment via Vercel Dashboard

### Step 1: Connect Repository
1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Select the `frontend` directory as the project root

### Step 2: Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables
See the environment variables table above.

### Step 4: Deploy
Click "Deploy" and wait for the build to complete.

## Environment Variables Reference

### Required Variables
| Variable | Description | Value | Required |
|----------|-------------|-------|----------|
| `VITE_API_BASE_URL` | Your Firebase Functions API endpoint | `https://us-central1-cookmate-cc941.cloudfunctions.net/api` | ✅ Yes |

### Optional Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_FORCE_PROXY` | Force specific proxy settings | `false` | ❌ No |
| `VITE_DEV_MODE` | Enable development mode features | `false` | ❌ No |

## How It Works

### Architecture
```
User Browser → Vercel CDN (React App) → Firebase Functions → Firestore/Auth
```

### API Routing
- Frontend requests to `/api/*` are automatically routed to your Firebase Functions
- No CORS issues as requests come from the same domain
- Firebase Functions handle all business logic and data

### Benefits
✅ **Fast Loading**: Global CDN distribution  
✅ **Automatic HTTPS**: SSL certificates handled by Vercel  
✅ **Easy Rollbacks**: One-click deployment rollbacks  
✅ **Cost Effective**: Free tier covers most usage  
✅ **Scalable**: Handles traffic spikes automatically  

## Troubleshooting

### Build Fails
**Issue**: `npm run build` fails
**Solution**: 
```bash
cd frontend
npm install
npm run build
```
Run locally first to identify issues.

### API Calls Fail
**Issue**: App loads but API calls fail
**Solution**: 
1. Check `VITE_API_BASE_URL` environment variable is set correctly
2. Verify Firebase Functions are deployed and accessible
3. Check browser console for CORS errors

### Environment Variables Not Working
**Issue**: Changes to env vars don't take effect
**Solution**: 
1. Redeploy the project after changing environment variables
2. Make sure variable names start with `VITE_`
3. Check Vercel dashboard shows the correct values

### Routing Issues (404s)
**Issue**: Direct URLs show 404 errors
**Solution**: Vercel automatically handles SPA routing with the `vercel.json` config.

### Performance Issues
**Issue**: App loads slowly
**Solution**: 
1. Check Vercel Analytics in dashboard
2. Verify assets are being cached properly
3. Consider enabling Vercel Pro for advanced analytics

## Development vs Production

### Development
- Run locally: `cd frontend && npm run dev`
- Uses Vite proxy to connect to Firebase Emulator
- Hot reload enabled

### Production
- Deployed to Vercel
- Connects to live Firebase Functions
- Optimized builds with code splitting

## Rollback Procedure

### Quick Rollback
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** tab
4. Click **...** on any deployment
5. Select **Promote to Production**

### Automated Rollbacks
Vercel automatically rolls back if a deployment fails health checks.

## Monitoring & Analytics

### Vercel Analytics
- Enable in Vercel dashboard for performance insights
- View real-time metrics and Core Web Vitals

### Firebase Console
- Monitor Functions execution and errors
- Check Firestore usage and performance

## Support & Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)

### Getting Help
1. Check Vercel deployment logs
2. Review Firebase Functions logs
3. Use browser developer tools for debugging

## Next Steps

After successful deployment:
1. Test all features (auth, AI chat, collections)
2. Set up custom domain (optional)
3. Configure monitoring alerts
4. Consider enabling Vercel Pro for advanced features

---

**Deployment Status**: ✅ Ready to deploy
**Last Updated**: December 2025
**Version**: 1.0.0