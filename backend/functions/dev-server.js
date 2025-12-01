const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }));
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
    environment: 'development'
  });
});

// AI Routes (simplified for testing)
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

async function callHuggingFace(prompt) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      { 
        inputs: prompt, 
        parameters: { 
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        } 
      },
      { 
        headers: { 
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        } 
      }
    );
    
    if (response.data && response.data.length > 0) {
      return response.data[0].generated_text.trim();
    }
    return null;
  } catch (error) {
    console.error("Hugging Face API Error:", error.response ? error.response.data : error.message);
    throw new Error('Failed to communicate with AI service');
  }
}

// Chat endpoint
app.post('/api/ai/chat', mockAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    const prompt = `<s>[INST] You are CookMate, a helpful and friendly AI kitchen assistant. 
    User: ${message}
    Assistant: [/INST]`;
    
    const aiReply = await callHuggingFace(prompt);
    
    const mockResponse = {
      message: aiReply || "Hello! I'm CookMate, your AI cooking assistant. How can I help you with recipes today?",
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({ response: mockResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Recipe endpoint
app.post('/api/ai/generate-recipe', mockAuth, async (req, res) => {
  try {
    const { ingredients, dietaryPreferences, recipeType } = req.body;
    
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: "No ingredients provided" });
    }

    const prompt = `<s>[INST] You are an expert chef. Create a recipe using these ingredients: ${ingredients.join(', ')}.
    ${dietaryPreferences ? `Dietary preferences: ${dietaryPreferences}.` : ''}
    ${recipeType ? `Recipe type: ${recipeType}.` : ''}
    
    IMPORTANT: Provide the response in valid JSON format with the following structure:
    {
      "title": "Recipe Name",
      "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
      "instructions": ["Step 1 description", "Step 2 description"],
      "cookingTime": "e.g. 30 minutes",
      "servings": "e.g. 4",
      "difficulty": "Easy/Medium/Hard"
    }
    Do not add any text outside the JSON object.
    [/INST]`;

    const generatedText = await callHuggingFace(prompt);

    if (!generatedText) {
      throw new Error("No response from AI");
    }

    let recipeData;
    try {
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = generatedText.substring(jsonStart, jsonEnd + 1);
        recipeData = JSON.parse(jsonString);
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (parseError) {
      recipeData = {
        title: "AI Recipe Suggestion",
        ingredients: ingredients,
        instructions: [generatedText],
        cookingTime: "30 minutes",
        servings: 4,
        difficulty: "Medium"
      };
    }
    
    res.status(200).json({ 
      message: 'Recipe generated successfully',
      recipe: recipeData
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest Ingredients endpoint
app.post('/api/ai/suggest-ingredients', mockAuth, async (req, res) => {
  try {
    const { availableIngredients } = req.body;
    
    const prompt = `<s>[INST] I have these ingredients: ${availableIngredients.join(', ')}. 
    Suggest 3 additional ingredients that would go well with them to make a complete meal.
    Output ONLY a comma-separated list of ingredients. Example: "Garlic, Olive Oil, Basil"
    [/INST]`;
    
    const suggestionText = await callHuggingFace(prompt);
    
    const suggestions = suggestionText ? suggestionText.split(',').map(s => s.trim()) : ['Garlic', 'Olive Oil', 'Salt'];
    
    res.status(200).json({ 
      suggestions,
      message: 'Ingredient suggestions generated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/ai/chat - AI chat`);
  console.log(`   POST /api/ai/generate-recipe - Generate recipe`);
  console.log(`   POST /api/ai/suggest-ingredients - Suggest ingredients`);
  console.log(`   GET  /api/users/profile - Get user profile`);
});

module.exports = app;