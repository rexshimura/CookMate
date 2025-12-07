// Vercel Serverless Function Entry Point
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Import the Express app from server-src
const { createApp } = require('../server-src/index');

// Create the Express app instance
const app = express();

// Vercel Serverless Function handler
module.exports = (req, res) => {
  // Handle CORS for all origins in development
  const corsHandler = cors({ origin: true });
  corsHandler(req, res, () => {
    // Pass request to the Express app
    app(req, res);
  });
};