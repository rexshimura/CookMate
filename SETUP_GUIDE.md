# CookMate Project Setup Guide

## 📁 New Folder Structure

Your CookMate project has been successfully reorganized with a clear frontend/backend separation:

```
CookMate/                    # Root directory
├── package.json            # Monorepo configuration
├── README.md              # Project documentation
├── .gitignore             # Root gitignore
├── frontend/              # React frontend application
│   ├── src/               # Frontend source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite configuration with API proxy
│   ├── .env.local         # Frontend environment variables
│   └── .gitignore         # Frontend gitignore
├── backend/               # Node.js backend with Firebase
│   ├── firebase.json      # Firebase configuration
│   └── functions/         # Firebase Cloud Functions
│       ├── src/           # Backend source code
│       ├── package.json   # Backend dependencies
│       └── .env           # Backend environment variables
└── main/                  # Original frontend (to be migrated)
    └── [original files]   # Your existing React code
```

## 🚀 Quick Start

### 1. Complete Frontend Migration

Your frontend structure is partially migrated. To finish the migration:

```bash
# Copy remaining files from main/ to frontend/
cp -r main/src/* frontend/src/
cp -r main/public/* frontend/public/
cp main/package-lock.json frontend/
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend/functions && npm install
```

### 3. Environment Configuration

Update the environment files with your actual credentials:

**Backend (.env):**
```env
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY=your-actual-private-key
FIREBASE_CLIENT_EMAIL=your-actual-client-email
HUGGING_FACE_API_KEY=your-actual-hf-api-key
```

**Frontend (.env.local):**
```env
VITE_FIREBASE_API_KEY=your-actual-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-actual-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-actual-project-id
# ... other Firebase config values
```

### 4. Development Commands

```bash
# Start both frontend and backend simultaneously
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5001

# Build for production
npm run build

# Deploy to Firebase
npm run deploy
```

## 🔧 Backend Architecture

Your backend is structured as Firebase Cloud Functions with Express.js:

- **API Endpoints**: `/api/health`, `/api/auth/*`, `/api/recipes/*`, `/api/users/*`, `/api/ai/*`
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI Integration**: Hugging Face Inference API
- **Deployment**: Firebase Cloud Functions

## 🎨 Frontend Architecture

Your React frontend includes:
- **Router**: React Router with routes for Landing, Auth, and Main pages
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API Client**: Axios for backend communication
- **Firebase**: Client-side Firebase SDK

## 📋 Next Steps

1. **Complete Migration**: Copy remaining files from `main/` to `frontend/`
2. **Setup Firebase**: Create Firebase project and update configuration
3. **Setup Hugging Face**: Get API key and update backend configuration
4. **Migrate Components**: Update component imports and routing
5. **Test Integration**: Verify frontend-backend communication
6. **Deploy**: Use Firebase deployment configuration

## 🔗 Important Notes

- The `main/` folder contains your original code that needs to be migrated
- The `backend/` folder contains the complete Firebase Functions setup
- The `frontend/` folder is your new organized React application
- All API calls are automatically proxied from frontend to backend during development
- Production builds will be served from the backend Firebase hosting configuration

## 🎯 Benefits of This Structure

✅ **Clear Separation**: Frontend and backend are cleanly separated  
✅ **Scalable**: Easy to add new features to either side  
✅ **Firebase Ready**: Configured for Firebase deployment  
✅ **AI Integration**: Ready for Hugging Face API integration  
✅ **Development Friendly**: Hot reload for both frontend and backend  
✅ **Production Ready**: Optimized build and deployment configuration  

Your CookMate project is now properly organized and ready for full-stack development!