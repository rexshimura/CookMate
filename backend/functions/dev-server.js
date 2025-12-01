const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'] }));
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.userId = 'mock-user-id';
  req.user = { uid: 'mock-user-id', email: 'test@example.com' };
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'CookMate Backend API is running!',
    timestamp: new Date().toISOString(),
    environment: 'development',
    aiService: 'AI-Powered Cooking Assistant (Multi-Service Fallback)'
  });
});

// Import the AI routes (using the dynamic version)
const aiRouter = require('./src/routes/ai');

// Use AI routes
app.use('/api/ai', mockAuth, aiRouter);

// Mock user endpoints
app.get('/api/users/profile', mockAuth, (req, res) => {
  res.status(200).json({
    user: {
      uid: req.userId,
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