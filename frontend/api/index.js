// Vercel Serverless Function Entry Point
const cors = require('cors');

// Import the Express app from server-src (Firebase already initialized there)
const app = require('../server-src/index');

// Vercel Serverless Function handler
module.exports = (req, res) => {
  // Handle CORS for all origins in development
  const corsHandler = cors({ origin: true });
  corsHandler(req, res, () => {
    // Pass request to the Express app
    app(req, res);
  });
};