const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 [BACKEND ERROR]:', error);
  console.error('🚨 [BACKEND ERROR] Stack:', error.stack);
  
  // Handle Firebase/Firestore errors
  if (error.code) {
    console.error('🚨 [BACKEND ERROR] Firebase error code:', error.code);
  }
  
  // Database connection errors
  if (error.code === 'PERMISSION_DENIED') {
    return res.status(403).json({ 
      error: 'Permission denied',
      message: 'You don\'t have permission to access this resource',
      code: 'PERMISSION_DENIED'
    });
  }
  
  if (error.code === 'NOT_FOUND') {
    return res.status(404).json({ 
      error: 'Resource not found',
      message: 'The requested resource was not found',
      code: 'NOT_FOUND'
    });
  }
  
  if (error.code === 'UNAVAILABLE') {
    return res.status(503).json({ 
      error: 'Service unavailable',
      message: 'Database service is temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
  
  if (error.code === 'RESOURCE_EXHAUSTED') {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please wait a moment before trying again',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  // Network/Firebase connection errors
  if (error.message.includes('Failed to get access token') || 
      error.message.includes('Credential implementation provided to Firebase') ||
      error.message.includes('Could not load the default credentials')) {
    return res.status(500).json({ 
      error: 'Database connection failed',
      message: 'Unable to connect to the database. Please try again later',
      code: 'DATABASE_CONNECTION_ERROR'
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError' || error.code === 'invalid-argument') {
    return res.status(400).json({ 
      error: 'Validation error',
      message: error.message || 'Invalid request data',
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Default server error
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const sessionRoutes = require('./routes/sessions');
const collectionRoutes = require('./routes/collections');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', sessionRoutes);
app.use('/api/collections', collectionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'CookMate Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

// Export the Express app for Vercel
module.exports = app;