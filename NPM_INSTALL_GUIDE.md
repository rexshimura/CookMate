# CookMate App - NPM Installation Guide

This guide provides all the npm install commands needed to set up the CookMate AI Kitchen Assistant application.

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher

Check your versions:
```bash
node --version
npm --version
```

## 🚀 Complete Installation

### Option 1: Install Everything at Once
```bash
npm run install:all
```

This single command installs dependencies for:
- Root workspace
- Frontend
- Backend functions

### Option 2: Manual Installation by Component

#### 1. Root Level Dependencies
```bash
# Install root dependencies (concurrently for running both frontend and backend)
npm install
```

#### 2. Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### 3. Backend Dependencies
```bash
cd backend/functions
npm install
cd ../..
```

## 📦 Dependency Breakdown

### Frontend Dependencies (`frontend/package.json`)

#### Production Dependencies:
```bash
# UI Framework
npm install react@^19.2.0 react-dom@^19.2.0

# Routing
npm install react-router-dom@^7.9.6

# Styling
npm install tailwindcss@^4.1.17 @tailwindcss/vite@^4.1.17

# Icons
npm install lucide-react@^0.553.0

# HTTP Client
npm install axios@^1.6.0

# Firebase
npm install firebase@^10.7.1
```

#### Development Dependencies:
```bash
# Build Tool
npm install vite@^7.2.2

# React Plugin
npm install @vitejs/plugin-react@^5.1.0

# TypeScript Support
npm install @types/react@^19.2.2 @types/react-dom@^19.2.2

# Linting
npm install eslint@^9.39.1 @eslint/js@^9.39.1
npm install eslint-plugin-react-hooks@^7.0.1
npm install eslint-plugin-react-refresh@^0.4.24

# Additional Tools
npm install globals@^16.5.0
```

### Backend Dependencies (`backend/functions/package.json`)

#### Production Dependencies:
```bash
# Web Framework
npm install express@^4.21.2

# Firebase
npm install firebase-admin@^11.11.1
npm install firebase-functions@^4.6.0

# Environment Management
npm install dotenv@^16.6.1

# HTTP Client
npm install axios@^1.13.2

# CORS Support
npm install cors@^2.8.5

# Authentication & Security
npm install bcryptjs@^2.4.3
npm install jsonwebtoken@^9.0.2

# AI Services
npm install @google/generative-ai@^0.24.1
npm install openai@^6.9.1
npm install replicate@^1.4.0
npm install langchain@^1.1.1

# Validation
npm install joi@^17.11.0
```

#### Development Dependencies:
```bash
# Type Definitions
npm install @types/node@^18.0.0

# Testing
npm install firebase-functions-test@^3.1.0
```

### Root Dependencies (`package.json`)

#### Development Dependencies:
```bash
# Process Manager (for running frontend and backend simultaneously)
npm install concurrently@^8.2.2
```

## 🔧 Quick Start Commands

After installation, you can run the app in different modes:

### Development Mode
```bash
# Run both frontend and backend
npm run dev

# Or run individually:
npm run dev:frontend  # Frontend only (port 5173)
npm run dev:backend   # Backend only (Firebase emulators)
```

### Production Build
```bash
npm run build
```

### Deploy
```bash
npm run deploy
```

## 🛠️ Common Issues & Solutions

### Issue: Permission Errors
```bash
# Fix with sudo (not recommended) or use npx
sudo npm install <package>

# Better approach - use npx
npx create-vite@latest my-app
```

### Issue: Version Conflicts
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules frontend/node_modules backend/functions/node_modules
npm install
```

### Issue: Node Version Compatibility
```bash
# Use Node Version Manager (nvm) - macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# For Windows - use nvm-windows
# Download from: https://github.com/coreybutler/nvm-windows
```

## 📋 Environment Setup

After installing dependencies, make sure to set up your environment variables:

### Frontend (.env.local)
```bash
# Optional - for custom API endpoints
VITE_API_BASE_URL=http://localhost:5001/your-project/us-central1/api
```

### Backend (.env)
```bash
# Required for AI features
GROQ_API_KEY=your_groq_api_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
# ... other Firebase config vars
```

## ✅ Verification

After installation, verify everything works:

```bash
# Check if all dependencies are installed
npm ls --depth=0

# Check if the app starts
npm run dev
```

The frontend should be available at `http://localhost:5173` and the backend at the Firebase emulator URLs.

## 📚 Additional Resources

- [Frontend Setup Documentation](./SETUP_CHATGPT_AI.md)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Need Help?** If you encounter issues during installation, check the logs for specific error messages and ensure your Node.js and npm versions meet the requirements.