const functions = require('firebase-functions');
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

// Import routes
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const sessionRoutes = require('./routes/sessions');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', sessionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'CookMate Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

// Export the Express app as a single Cloud Function
exports.api = functions.https.onRequest(app);