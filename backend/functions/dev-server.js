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
    environment: 'development',
    aiService: 'Google Gemini'
  });
});

// Google Gemini AI service
async function callGeminiAI(prompt, conversationHistory = []) {
  try {
    console.log('🔍 Debug: GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured. Using fallback responses.');
    }

    // Build conversation context
    let context = '';
    if (conversationHistory.length > 0) {
      context = conversationHistory
        .slice(-8) // Keep last 8 messages for context
        .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
        .join('\n') + '\n';
    }

    const fullPrompt = `You are CookMate, a friendly and knowledgeable AI cooking assistant. You help people discover recipes, cooking techniques, meal planning, and make the most of their available ingredients.

${context}Human: ${prompt}
Assistant:`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const generatedText = response.data.candidates[0].content.parts[0].text.trim();
      return generatedText;
    }
    
    throw new Error('Invalid response from Gemini API');
  } catch (error) {
    console.error('Gemini AI Error:', error.response?.data || error.message);
    
    // Fallback response if AI fails
    const fallbackResponses = [
      "I'm having a small technical hiccup right now. Could you try asking that again?",
      "I'm experiencing some difficulties connecting to my knowledge base. Let me try that once more!",
      "I'm experiencing a brief moment of confusion - could you rephrase that question?",
      "I'm having trouble accessing my cooking knowledge right now. Can you try asking again?"
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

// Content detection function
function isOffTopic(message) {
  const lowerMessage = message.toLowerCase();
  
  const offTopicKeywords = [
    'politics', 'religion', 'sports', 'gaming', 'technology', 'programming', 
    'coding', 'software', 'apps', 'movies', 'music', 'entertainment', 
    'celebrities', 'relationships', 'dating', 'work', 'job', 'school',
    'math', 'science', 'history', 'news', 'stocks', 'investing'
  ];
  
  return offTopicKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Smart ingredient extraction
function extractIngredients(message) {
  const ingredientPatterns = [
    /\b(chicken|beef|pork|lamb|turkey|fish|salmon|shrimp|tuna|tofu|eggs?)\b/gi,
    /\b(rice|pasta|noodles|spaghetti|macaroni|bread|flour|oats|quinoa)\b/gi,
    /\b(potato|tomato|onion|garlic|pepper|bell pepper|carrot|celery|lettuce|spinach|kale|cucumber)\b/gi,
    /\b(mushroom|zucchini|eggplant|broccoli|cauliflower|green beans|peas|corn)\b/gi,
    /\b(cheese|mozzarella|parmesan|cheddar|milk|cream|butter|yogurt|sour cream)\b/gi,
    /\b(oil|olive oil|vegetable oil|canola oil|sesame oil)\b/gi,
    /\b(salt|pepper|garlic powder|onion powder|paprika|cumin|oregano|thyme|basil)\b/gi,
    /\b(sugar|honey|maple syrup|brown sugar)\b/gi,
    /\b(lemon|lime|orange|apple|banana|berries|grapes)\b/gi,
    /\b(vanilla|almond|coconut|chocolate|cocoa)\b/gi
  ];
  
  const foundIngredients = new Set();
  ingredientPatterns.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) {
      matches.forEach(match => foundIngredients.add(match.toLowerCase()));
    }
  });
  
  return Array.from(foundIngredients);
}

// Smart recipe generation
async function generateSmartRecipe(ingredients, dietaryPreferences = '') {
  if (!ingredients || ingredients.length === 0) {
    return {
      title: "Simple Chicken Stir-Fry",
      ingredients: [
        "2 chicken breasts, cubed",
        "1 bell pepper, sliced",
        "1 onion, diced",
        "2 cloves garlic, minced",
        "2 tbsp soy sauce",
        "1 tbsp olive oil",
        "1 cup cooked rice"
      ],
      instructions: [
        "Heat olive oil in a large pan over medium-high heat",
        "Add chicken and cook until golden brown",
        "Add garlic, onion, and bell pepper, cook until vegetables are tender",
        "Pour in soy sauce and toss everything together",
        "Serve hot over cooked rice"
      ],
      cookingTime: "20 minutes",
      servings: "4",
      difficulty: "Easy"
    };
  }

  const ingredientList = ingredients.join(', ');
  const dietaryNote = dietaryPreferences ? ` Dietary preferences: ${dietaryPreferences}.` : '';
  
  const prompt = `Create a delicious recipe using these ingredients: ${ingredientList}.${dietaryNote}

Provide a complete recipe with:
- Appetizing title
- All ingredients with measurements
- Clear step-by-step instructions
- Cooking time and servings
- Difficulty level

Format as JSON:
{
  "title": "Recipe Name",
  "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
  "instructions": ["Step 1", "Step 2"],
  "cookingTime": "e.g. 30 minutes",
  "servings": "e.g. 4", 
  "difficulty": "Easy/Medium/Hard"
}`;

  try {
    const response = await callGeminiAI(prompt);
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = response.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonString);
    }
    
    throw new Error('Could not parse recipe JSON');
  } catch (error) {
    console.error('Recipe generation error:', error);
    // Return a basic recipe based on the main ingredient
    const mainIngredient = ingredients[0] || 'chicken';
    return {
      title: `Simple ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`,
      ingredients: ingredients.map(ing => `1 cup ${ing}`).concat(['Salt and pepper to taste', '2 tbsp oil']),
      instructions: [
        `Season ${mainIngredient} with salt and pepper`,
        "Heat oil in a large pan over medium heat",
        `Cook ${mainIngredient} until golden and cooked through`,
        "Taste and adjust seasonings",
        "Serve hot"
      ],
      cookingTime: "25 minutes",
      servings: "4",
      difficulty: "Easy"
    };
  }
}

// Chat endpoint - enhanced with AI
app.post('/api/ai/chat', mockAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Check for off-topic content
    if (isOffTopic(message)) {
      const redirectPrompt = `The user asked about: "${message}". As CookMate, redirect them back to cooking topics in a friendly way, asking what ingredients they have or what they'd like to cook.`;
      
      const aiReply = await callGeminiAI(redirectPrompt, history);
      
      return res.status(200).json({
        response: {
          message: aiReply,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Extract ingredients and provide helpful response
    const ingredients = extractIngredients(message);
    let aiReply;
    
    if (ingredients.length > 0) {
      const cookingPrompt = `The user mentioned these ingredients: ${ingredients.join(', ')}. ${message}. As CookMate, provide helpful cooking advice, suggest recipes, or ask follow-up questions about their cooking goals. Be conversational and enthusiastic about cooking!`;
      aiReply = await callGeminiAI(cookingPrompt, history);
    } else {
      aiReply = await callGeminiAI(message, history);
    }
    
    res.status(200).json({
      response: {
        message: aiReply,
        timestamp: new Date().toISOString(),
        detectedIngredients: ingredients
      }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Chat service temporarily unavailable. Please try again.',
      message: "I'm having a technical issue right now. Can you try asking that again?"
    });
  }
});

// Generate Recipe endpoint
app.post('/api/ai/generate-recipe', mockAuth, async (req, res) => {
  try {
    const { userMessage, ingredients: providedIngredients, dietaryPreferences, recipeType } = req.body;
    
    let ingredients = providedIngredients;
    
    // Extract ingredients from user message if not provided
    if (userMessage && (!ingredients || ingredients.length === 0)) {
      ingredients = extractIngredients(userMessage);
    }
    
    const recipeData = await generateSmartRecipe(ingredients, dietaryPreferences);
    
    res.status(200).json({
      message: 'Recipe generated successfully',
      recipe: recipeData,
      detectedIngredients: ingredients
    });
    
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ 
      error: 'Recipe generation failed',
      message: "I'm having trouble creating that recipe. Can you try again?"
    });
  }
});

// Suggest Ingredients endpoint
app.post('/api/ai/suggest-ingredients', mockAuth, async (req, res) => {
  try {
    const { availableIngredients } = req.body;
    
    const prompt = `I have these ingredients: ${availableIngredients.join(', ')}. 
    Suggest 3-5 additional ingredients that would go well with them to make a complete, tasty meal.
    Be specific and practical. Output only a comma-separated list.`;
    
    const suggestionText = await callGeminiAI(prompt);
    const suggestions = suggestionText ? suggestionText.split(',').map(s => s.trim()) : ['Garlic', 'Olive Oil', 'Salt'];
    
    res.status(200).json({
      suggestions,
      message: 'Ingredient suggestions generated'
    });
    
  } catch (error) {
    console.error('Ingredient suggestion error:', error);
    res.status(500).json({ 
      error: 'Suggestion generation failed',
      suggestions: ['Garlic', 'Olive Oil', 'Salt', 'Black Pepper', 'Herbs']
    });
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
  console.log(`🤖 AI Service: Google Gemini 1.5 Flash`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/ai/chat - AI chat with conversation history`);
  console.log(`   POST /api/ai/generate-recipe - Generate smart recipes`);
  console.log(`   POST /api/ai/suggest-ingredients - Suggest complementary ingredients`);
  console.log(`   GET  /api/users/profile - Get user profile`);
  console.log(`✨ No more hardcoded responses - Pure AI-powered conversations!`);
});

module.exports = app;