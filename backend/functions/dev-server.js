const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Note: Routes now handle their own authentication with secure verifyAuthToken middleware

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'CookMate Backend API is running!',
    timestamp: new Date().toISOString(),
    environment: 'development',
    aiService: 'AI-Powered Cooking Assistant (Multi-Service Fallback)'
  });
});

// 🔍 Firebase Health Check Endpoint
app.get('/api/health/firebase', (req, res) => {
  console.log('🔍 Firebase Health Check Request');
  
  try {
    const { admin } = require('./src/config/firebase');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      firebase: {
        adminInitialized: admin.apps.length > 0,
        adminAppsCount: admin.apps.length,
        environment: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
          FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING',
          FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ? 'SET' : 'MISSING',
          FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
          FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID ? 'SET' : 'MISSING',
          FIREBASE_CLIENT_X509_CERT_URL: process.env.FIREBASE_CLIENT_X509_CERT_URL ? 'SET' : 'MISSING',
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT
        }
      }
    };
    
    console.log('✅ Firebase Health Check Response:', healthStatus);
    res.json(healthStatus);
  } catch (error) {
    console.error('❌ Firebase Health Check Error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
  }
});

// Import the routes
const aiRouter = require('./src/routes/ai');
const userRouter = require('./src/routes/users');
const collectionsRouter = require('./src/routes/collections');

// Use AI routes (AI routes don't need authentication for now)
app.use('/api/ai', aiRouter);

// Use user routes (for favorites functionality) - routes have built-in verifyAuthToken
app.use('/api/users', userRouter);

// Use collections routes - routes have built-in verifyAuthToken
app.use('/api/collections', collectionsRouter);

// Mock user endpoints (no auth required for this specific endpoint)
app.get('/api/users/profile', (req, res) => {
  res.status(200).json({
    user: {
      uid: 'mock-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      plan: 'free',
      favorites: []
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CookMate Backend API running on http://localhost:${PORT}`);
  console.log(`🤖 AI Service: Dynamic AI-Powered Cooking Assistant`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/ai/chat - Smart cooking conversations`);
  console.log(`   POST /api/ai/generate-recipe - Dynamic recipe generation`);
  console.log(`   POST /api/ai/suggest-ingredients - Intelligent ingredient suggestions`);
  console.log(`   GET  /api/users/profile - Get user profile`);
  console.log(`✨ Dynamic responses - NO hardcoded responses!`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;