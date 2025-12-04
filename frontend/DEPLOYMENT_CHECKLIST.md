# CookMate Vercel Deployment Checklist

## Pre-Deployment Checklist ✅

### Configuration Files
- [x] **vite.config.js** - Updated with proper build settings
  - Output directory: `dist` (not `../backend/dist`)
  - Build optimization with manual chunks
  - Proper base path configuration

- [x] **vercel.json** - Created with complete routing configuration
  - API routes proxy to Firebase Functions
  - SPA routing handled
  - Security headers configured
  - Build settings specified

- [x] **package.json** - Updated with deployment scripts
  - `deploy` script for one-click deployment
  - `build:vercel` for optimized builds
  - `deploy:check` for validation

### Environment Configuration
- [x] **.env.example** - Created with all required variables
- [x] **API Configuration** - Updated to work with production Firebase Functions
- [x] **Firebase Config** - Already configured in firebase.js

### Documentation
- [x] **VERCEL_DEPLOYMENT.md** - Comprehensive deployment guide
- [x] **Environment Variables Reference** - Complete documentation
- [x] **Troubleshooting Guide** - Common issues and solutions

## Deployment Steps

### Option 1: CLI Deployment
1. [ ] Navigate to frontend directory: `cd frontend`
2. [ ] Install dependencies: `npm install`
3. [ ] Test build locally: `npm run build`
4. [ ] Deploy to Vercel: `npm run deploy`

### Option 2: Vercel Dashboard
1. [ ] Go to [vercel.com](https://vercel.com) and sign in
2. [ ] Click "New Project" and import your repository
3. [ ] Select `frontend` directory as project root
4. [ ] Configure build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. [ ] Add environment variables:
   ```
   VITE_API_BASE_URL=https://us-central1-cookmate-cc941.cloudfunctions.net/api
   ```
6. [ ] Click "Deploy"

## Post-Deployment Verification

### Build Verification
- [ ] **Build Status** - Vercel shows "Ready" status
- [ ] **Build Logs** - No errors in build output
- [ ] **Function Logs** - Check Firebase Functions logs

### Functionality Testing
- [ ] **Homepage Loads** - App renders without errors
- [ ] **Authentication** - Sign up/sign in works
- [ ] **AI Chat** - Recipe generation and chat functionality
- [ ] **Collections** - Create, read, update, delete collections
- [ ] **Favorites** - Add/remove recipes from favorites
- [ ] **User Profile** - Profile management works

### Performance Testing
- [ ] **Load Speed** - Page loads in <3 seconds
- [ ] **API Response** - Backend calls complete successfully
- [ ] **Mobile Responsive** - App works on mobile devices

### Security Verification
- [ ] **HTTPS** - Site loads with secure connection
- [ ] **CORS** - No CORS errors in browser console
- [ ] **API Security** - Protected routes require authentication

## Environment Variables Setup

### Vercel Dashboard Configuration
1. Go to Project Settings → Environment Variables
2. Add the following variables:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_API_BASE_URL` | `https://us-central1-cookmate-cc941.cloudfunctions.net/api` | Production, Preview, Development |

### Local Development (Optional)
1. Copy `.env.example` to `.env.local`
2. Update values as needed
3. Restart development server

## Troubleshooting Quick Fixes

### Build Fails
**Quick Fix**: 
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Calls Fail
**Quick Fix**:
1. Check VITE_API_BASE_URL environment variable
2. Verify Firebase Functions are deployed
3. Check browser network tab for failed requests

### Environment Variables Not Working
**Quick Fix**:
1. Redeploy after adding env variables
2. Ensure variable names start with `VITE_`
3. Check Vercel dashboard shows correct values

### Routing Issues (404s)
**Quick Fix**: The vercel.json configuration should handle this automatically.

## Success Criteria

✅ **Deployment Status**: Ready to deploy  
✅ **Build Process**: Configured and tested  
✅ **Environment Variables**: Documented and set up  
✅ **Documentation**: Complete deployment guide provided  
✅ **Troubleshooting**: Common issues and solutions documented  

## Next Steps After Successful Deployment

1. [ ] **Test All Features** - Ensure complete functionality
2. [ ] **Set Up Custom Domain** - Optional, for production use
3. [ ] **Enable Analytics** - Add Vercel Analytics for monitoring
4. [ ] **Configure Monitoring** - Set up alerts for errors
5. [ ] **Backup Strategy** - Document data backup procedures

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html

---

**Deployment Ready**: ✅ Yes  
**Complexity**: Low  
**Estimated Time**: 15-30 minutes  
**Risk Level**: Low (frontend only, backend unchanged)