const express = require('express');
const router = express.Router();

// Middleware to verify Firebase Auth tokens (optional for AI chat)
const verifyAuthToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow anonymous users for AI chat
      req.userId = 'anonymous';
      req.user = { uid: 'anonymous', email: 'anonymous@cookmate.app' };
      return next();
    }
    
    const token = authHeader.split('Bearer ')[1];
    const { admin } = require('../config/firebase');
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    // If token verification fails, allow anonymous access for AI features
    console.log('Auth token verification failed, allowing anonymous access:', error.message);
    req.userId = 'anonymous';
    req.user = { uid: 'anonymous', email: 'anonymous@cookmate.app' };
    next();
  }
};

// AI-powered cooking assistant responses
async function generateIntelligentResponse(message, conversationHistory = []) {
  // Direct AI response without fallback mechanisms
  return await callAI(message, conversationHistory, extractIngredients(message));
}

// Direct AI service integration
async function callAI(message, history, ingredients) {
  // Direct call to OpenAI-compatible API (Groq)
  return await callOpenAICompatibleAPI(message, history, ingredients);
}

// Hugging Face Inference API (Free models)
async function callHuggingFaceAPI(message, history, ingredients) {
  const modelId = "microsoft/DialoGPT-medium"; // Free conversational model
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
  
  const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(hfToken ? { 'Authorization': `Bearer ${hfToken}` } : {})
    },
    body: JSON.stringify({
      inputs: message,
      parameters: {
        max_length: 200,
        temperature: 0.7,
        do_sample: true
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HuggingFace API failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data[0]?.generated_text || "I apologize, but I'm having trouble generating a response right now.";
}

// OpenAI-compatible API (using free models from Groq)
async function callOpenAICompatibleAPI(message, history, ingredients) {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_FALLBACK;
  
  const systemMessage = {
    role: "system",
    content: "You are CookMate, a helpful AI cooking assistant. Help users with recipes, cooking advice, and ingredient suggestions. Be friendly, informative, and focus on cooking topics. Provide practical, actionable cooking advice."
  };
  const conversation = Array.isArray(history) ? history : [];
  const last = conversation[conversation.length - 1];
  const includeUserTail = !(last && last.role === 'user' && last.content === message);
  const messages = [systemMessage, ...conversation, ...(includeUserTail ? [{ role: 'user', content: message }] : [])];
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey || 'demo'}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama3-8b-8192", // Free tier model
      messages: messages,
      max_tokens: 150,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Groq API failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response right now.";
}

// Together AI (Free tier)
async function callTogetherAI(message, history, ingredients) {
  const apiKey = process.env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY_FALLBACK;
  
  const systemMessage = {
    role: "system",
    content: "You are CookMate, a cooking assistant. Help with recipes and cooking advice. Be helpful and focused on cooking topics."
  };
  const conversation = Array.isArray(history) ? history : [];
  const last = conversation[conversation.length - 1];
  const includeUserTail = !(last && last.role === 'user' && last.content === message);
  const messages = [systemMessage, ...conversation, ...(includeUserTail ? [{ role: 'user', content: message }] : [])];
  
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey || 'demo'}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "togethercomputer/RedPajama-INCITE-Chat-3B-v1", // Free model
      messages: messages,
      max_tokens: 150,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Together AI failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response right now.";
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

// Dynamic contextual response generator
function generateContextualResponse(message, ingredients, lowerMessage) {
  // Generate dynamic responses based on detected context and ingredients
  
  // Ingredient-based intelligent responses
  if (ingredients.length > 0) {
    const ingredientList = ingredients.slice(0, 3).join(', ');
    const moreIngredients = ingredients.length > 3 ? ` and ${ingredients.length - 3} more ingredients` : '';
    
    if (lowerMessage.includes('recipe') || lowerMessage.includes('cook') || lowerMessage.includes('make')) {
      return `I can create something delicious with your ${ingredientList}${moreIngredients}! Each ingredient brings its own unique flavors and textures. What cooking style appeals to you right now - something quick and simple, or are you in the mood for a more elaborate preparation?`;
    }
    
    if (lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
      return `Based on your ${ingredientList}${moreIngredients}, I see some great potential combinations! You could create a balanced meal by pairing proteins with vegetables and adding some healthy fats. What type of cuisine or flavor profile are you craving?`;
    }
    
    if (lowerMessage.includes('combine') || lowerMessage.includes('mix')) {
      return `Your ingredients offer wonderful possibilities for combination! ${ingredientList} can create either a harmonious single-pan dish or be served as complementary parts of a complete meal. How are you feeling about complexity level - simple and comforting, or something more sophisticated?`;
    }
  }
  
  // Greeting and help responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return generatePersonalizedGreeting(ingredients);
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what can')) {
    return `I'm your personalized cooking companion! I can analyze what ingredients you have, suggest creative recipes, provide cooking techniques, help with substitutions, and even plan complete meals. Just tell me what you're working with or what you'd like to create!`;
  }
  
  // Cooking method queries
  if (lowerMessage.includes('bake') || lowerMessage.includes('roast')) {
    return `Baking and roasting are fantastic methods! Baking works great for breads, cakes, and casseroles, while roasting brings out incredible flavors in vegetables and meats. What would you like to bake or roast?`;
  }
  
  if (lowerMessage.includes('saute') || lowerMessage.includes('fry') || lowerMessage.includes('stir fry')) {
    return `Quick cooking methods like sautéing and stir-frying are perfect for preserving nutrients and creating vibrant flavors! They're ideal for vegetables and proteins. What ingredients are you planning to cook this way?`;
  }
  
  if (lowerMessage.includes('soup') || lowerMessage.includes('stew')) {
    return `Soups and stews are wonderful comfort foods that can accommodate many ingredients! They're perfect for using up leftovers and creating hearty, nutritious meals. What base are you thinking - broth-based, creamy, or hearty?`;
  }
  
  // Dietary and preference responses
  if (lowerMessage.includes('healthy') || lowerMessage.includes('diet')) {
    return `I'd love to help you create healthy, delicious meals! I can suggest nutrient-dense combinations, lighter cooking methods, and balanced macronutrients. What are your specific health goals or dietary preferences?`;
  }
  
  if (lowerMessage.includes('quick') || lowerMessage.includes('easy') || lowerMessage.includes('fast')) {
    return `Quick and easy cooking is one of my specialties! I can suggest simple techniques, minimal ingredient dishes, and time-saving methods that don't sacrifice flavor. What are you in the mood for that won't take too long?`;
  }
  
  if (lowerMessage.includes('vegetarian') || lowerMessage.includes('vegan') || lowerMessage.includes('gluten free')) {
    return `I can definitely help with dietary preferences! There are so many wonderful plant-based proteins, gluten-free grains, and creative alternatives to explore. What specific dietary needs are you working with?`;
  }
  
  // Default contextual response
  return generateDynamicDefaultResponse(ingredients, lowerMessage);
}

// Generate personalized greeting based on available ingredients
function generatePersonalizedGreeting(ingredients) {
  if (ingredients.length === 0) {
    return `Hello! I'm excited to help you create something delicious today. Do you have any ingredients in your kitchen that you'd like to use, or are you looking for inspiration for your next meal?`;
  }
  
  const ingredientList = ingredients.slice(0, 2).join(' and ');
  const moreIngredients = ingredients.length > 2 ? ` (plus ${ingredients.length - 2} more)` : '';
  
  return `Hello! I see you have ${ingredientList}${moreIngredients} - that's a great foundation for something delicious! What kind of dish are you thinking of creating today?`;
}

// Generate dynamic default responses
function generateDynamicDefaultResponse(ingredients, lowerMessage) {
  if (ingredients.length > 0) {
    const suggestion = `With your ${ingredients.length} ingredient${ingredients.length > 1 ? 's' : ''}, you could create something wonderfully creative`;
    
    if (lowerMessage.includes('?')) {
      return `${suggestion}! I'm here to help answer any cooking questions you have. What specifically would you like to know about cooking or meal preparation?`;
    }
    
    return `${suggestion}. What kind of dish or cooking style interests you most right now?`;
  }
  
  return `I'm here to help you create amazing dishes! Whether you have specific ingredients to work with, want cooking techniques, need recipe ideas, or have questions about food preparation - I'm your cooking companion. What would you like to explore in the kitchen today?`;
}

// Intelligent fallback when all AI services fail
async function generateIntelligentFallback(message, ingredients) {
  const lowerMessage = message.toLowerCase();
  
  // Use the same dynamic response system
  return generateContextualResponse(message, ingredients, lowerMessage);
}

// AI-powered recipe generation
async function generateSmartRecipe(ingredients, dietaryPreferences = '') {
  // Use AI to generate dynamic recipe
  const ingredientList = ingredients.join(', ');
  const dietaryNote = dietaryPreferences ? ` Dietary preferences: ${dietaryPreferences}.` : '';
  
  const recipePrompt = `Create a delicious recipe using these ingredients: ${ingredientList}.${dietaryNote}
  
  Provide the response in valid JSON format with the following structure:
  {
    "title": "Recipe Name",
    "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
    "instructions": ["Step 1 description", "Step 2 description"],
    "cookingTime": "e.g. 30 minutes",
    "servings": "e.g. 4",
    "difficulty": "Easy/Medium/Hard"
  }
  Do not add any text outside the JSON object.`;
  
  const aiResponse = await callAI(recipePrompt, [], ingredients);
  
  // Parse JSON response from AI
  const jsonStart = aiResponse.indexOf('{');
  const jsonEnd = aiResponse.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    const jsonString = aiResponse.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonString);
  }
  
  throw new Error('Failed to parse AI recipe response');
}

// CHAT ENDPOINT - Enhanced with AI
router.post('/chat', verifyAuthToken, async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Check for off-topic content
    if (isOffTopic(message)) {
      const aiReply = "I appreciate your interest, but I'm specifically designed to help with cooking and recipes! Let me help you create something delicious instead. What ingredients do you have in your kitchen?";
      
      return res.status(200).json({
        response: {
          message: aiReply,
          timestamp: new Date().toISOString(),
          userId: req.userId
        }
      });
    }
    
    // Generate intelligent AI response
    const aiReply = await generateIntelligentResponse(message, history);
    
    res.status(200).json({
      response: {
        message: aiReply,
        timestamp: new Date().toISOString(),
        detectedIngredients: extractIngredients(message),
        userId: req.userId
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

// GENERATE RECIPE ENDPOINT
router.post('/generate-recipe', verifyAuthToken, async (req, res) => {
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
      detectedIngredients: ingredients,
      userId: req.userId
    });
    
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ 
      error: 'Recipe generation failed',
      message: "I'm having trouble creating that recipe. Can you try again?"
    });
  }
});

// SUGGEST INGREDIENTS ENDPOINT
router.post('/suggest-ingredients', verifyAuthToken, async (req, res) => {
  try {
    const { availableIngredients } = req.body;
    
    // Generate intelligent ingredient suggestions based on available ingredients
    const available = availableIngredients.map(ing => ing.toLowerCase());
    const suggestions = [];
    
    // Smart suggestion logic based on available ingredients
    if (available.includes('chicken')) {
      suggestions.push('Garlic', 'Lemon', 'Olive Oil', 'Fresh Herbs', 'Bell Peppers');
    } else if (available.includes('beef')) {
      suggestions.push('Onion', 'Tomato', 'Bay Leaves', 'Black Pepper', 'Carrots');
    } else if (available.includes('fish') || available.includes('salmon') || available.includes('shrimp')) {
      suggestions.push('Lemon', 'Dill', 'Butter', 'Capers', 'White Wine');
    } else if (available.includes('pasta')) {
      suggestions.push('Garlic', 'Olive Oil', 'Parmesan', 'Basil', 'Cherry Tomatoes');
    } else if (available.includes('rice')) {
      suggestions.push('Onion', 'Chicken Broth', 'Soy Sauce', 'Sesame Oil', 'Green Onions');
    } else if (available.includes('vegetables') || available.includes('broccoli') || available.includes('spinach')) {
      suggestions.push('Olive Oil', 'Garlic', 'Salt', 'Black Pepper', 'Lemon Juice');
    } else if (available.includes('mushrooms')) {
      suggestions.push('Butter', 'Garlic', 'Thyme', 'White Wine', 'Parmesan');
    } else if (available.includes('potatoes')) {
      suggestions.push('Rosemary', 'Olive Oil', 'Garlic', 'Salt', 'Black Pepper');
    } else {
      // Generic suggestions for common cooking
      suggestions.push('Garlic', 'Olive Oil', 'Salt', 'Black Pepper', 'Fresh Herbs');
    }
    
    // Add dietary preference suggestions if provided
    if (dietaryPreferences && dietaryPreferences.toLowerCase().includes('vegan')) {
      suggestions.push('Nutritional Yeast', 'Turmeric', 'Coconut Milk');
    } else if (dietaryPreferences && dietaryPreferences.toLowerCase().includes('vegetarian')) {
      suggestions.push('Parmesan', 'Mozzarella', 'Fresh Basil');
    }
    
    res.status(200).json({
      suggestions,
      message: 'Smart ingredient suggestions generated',
      userId: req.userId
    });
    
  } catch (error) {
    console.error('Ingredient suggestion error:', error);
    res.status(500).json({ 
      error: 'Suggestion generation failed',
      suggestions: ['Garlic', 'Olive Oil', 'Salt', 'Black Pepper', 'Herbs']
    });
  }
});

module.exports = router;
