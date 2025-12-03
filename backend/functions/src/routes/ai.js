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

// Smart ingredient extraction (keeping this useful feature)
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

// Enhanced content detection function with comprehensive off-topic categories
function isOffTopic(message) {
  const lowerMessage = message.toLowerCase();
  
  const offTopicKeywords = [
    // Politics & Government
    'politics', 'election', 'vote', 'government', 'policy', 'democrat', 'republican',
    'congress', 'senate', 'parliament', 'president', 'prime minister', 'mayor',
    'political', 'campaign', 'ballot', 'legislation', 'law', 'court', 'judge',
    
    // Religion & Faith
    'religion', 'religious', 'god', 'jesus', 'allah', 'buddha', 'christian', 'muslim',
    'jewish', 'hindu', 'buddhist', 'church', 'mosque', 'temple', 'prayer',
    'bible', 'quran', 'torah', 'scripture', 'faith', 'spirituality', 'worship',
    
    // Sports & Recreation
    'sports', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf',
    'hockey', 'volleyball', 'cricket', 'rugby', 'olympics', 'nfl', 'nba', 'mlb',
    'fifa', 'uefa', 'championship', 'tournament', 'game', 'match', 'season',
    
    // Gaming & Entertainment
    'gaming', 'video games', 'xbox', 'playstation', 'nintendo', 'switch', 'pc gaming',
    'minecraft', 'fortnite', 'call of duty', 'league of legends', 'wow', 'pokemon',
    'board games', 'chess', 'poker', 'casino', 'betting', 'movies', 'cinema',
    'tv show', 'netflix', 'disney', 'marvel', 'star wars', 'harry potter',
    
    // Technology & Programming
    'technology', 'programming', 'coding', 'software', 'javascript', 'python', 'java',
    'react', 'angular', 'vue', 'node.js', 'html', 'css', 'git', 'github',
    'artificial intelligence', 'machine learning', 'blockchain', 'cryptocurrency',
    'bitcoin', 'ethereum', 'startup', 'tech', 'internet', 'website', 'app development',
    
    // Business & Finance
    'business', 'finance', 'stocks', 'investing', 'trading', 'stock market', 'wall street',
    'crypto', 'money', 'wealth', 'salary', 'income', 'mortgage', 'loan', 'debt',
    'banking', 'credit', 'retirement', '401k', 'bitcoin', 'forex', 'economics',
    'entrepreneur', 'startup', 'venture capital', 'ipo', 'merger', 'acquisition',
    
    // Education & Academic
    'education', 'school', 'university', 'college', 'student', 'teacher', 'professor',
    'homework', 'exam', 'test', 'grade', 'study', 'learning', 'course', 'class',
    'math', 'algebra', 'calculus', 'physics', 'chemistry', 'biology', 'history',
    'geography', 'literature', 'essay', 'research', 'thesis', 'dissertation',
    
    // Health & Fitness (non-nutrition)
    'exercise', 'workout', 'gym', 'fitness', 'weight loss', 'muscle', 'cardio',
    'yoga', 'pilates', 'running', 'swimming', 'cycling', 'training', 'bodybuilding',
    'medical', 'doctor', 'medicine', 'hospital', 'surgery', 'therapy', 'medication',
    'disease', 'illness', 'symptoms', 'treatment', 'diagnosis', 'surgery',
    
    // Travel & Transportation
    'travel', 'vacation', 'holiday', 'trip', 'flight', 'airline', 'hotel', 'resort',
    'tourism', 'passport', 'visa', 'cruise', 'beach', 'mountain', 'city', 'country',
    'car', 'vehicle', 'driving', 'traffic', 'public transport', 'subway', 'train',
    'airplane', 'airport', 'transportation', 'commute',
    
    // Relationships & Social
    'relationships', 'dating', 'boyfriend', 'girlfriend', 'husband', 'wife', 'marriage',
    'wedding', 'divorce', 'family', 'parents', 'children', 'kids', 'baby',
    'friendship', 'social', 'party', 'event', 'celebration', 'holiday',
    
    // News & Current Events
    'news', 'current events', 'breaking news', 'report', 'journalism', 'media',
    'newspaper', 'magazine', 'reporter', 'correspondent', 'interview', 'headlines',
    
    // Shopping & Consumer Products (non-food)
    'shopping', 'clothes', 'fashion', 'shoes', 'electronics', 'phone', 'computer',
    'car', 'house', 'apartment', 'furniture', 'decor', 'makeup', 'cosmetics',
    'perfume', 'jewelry', 'accessories', 'retail', 'mall', 'store',
    
    // Weather & Environment (non-cooking related)
    'weather', 'climate', 'temperature', 'rain', 'snow', 'storm', 'hurricane',
    'tornado', 'flood', 'drought', 'environment', 'pollution', 'carbon footprint',
    
    // Other Non-Cooking Topics
    'cars', 'automotive', 'real estate', 'property', 'rent', 'mortgage', 'insurance',
    'pets', 'animals', 'dogs', 'cats', 'gardening', 'plants', 'flowers', 'lawn',
    'books', 'reading', 'writing', 'art', 'painting', 'music', 'instruments',
    'hobbies', 'crafts', 'diy', 'woodworking', 'knitting', 'sewing'
  ];
  
  return offTopicKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Generate contextual cooking suggestions based on the conversation context or random selection
function getContextualCookingSuggestion() {
  const suggestions = [
    "What's in your fridge right now? Let's create something amazing together!",
    "I bet you have some great ingredients waiting to be turned into something delicious. What do you have?",
    "Instead of worrying about that, why don't we focus on cooking something tasty? What ingredients do you have?",
    "Let's put our culinary skills to work! Do you have any proteins, vegetables, or pantry staples you'd like to use?",
    "Cooking is so much more fun than [off-topic topic]! What would you like to cook today?",
    "I can help you create a mouth-watering meal instead. What ingredients are you working with?",
    "Enough about that - let's cook something incredible! What do you have in your kitchen?",
    "While you're thinking about that, let me suggest we start cooking! What ingredients do you have available?",
    "Cooking together is the perfect solution! Tell me what's in your pantry and I'll suggest a recipe.",
    "Let's put our energy into creating something delicious! What ingredients can we work with today?"
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Enhanced off-topic response with engaging redirects
function getOffTopicResponse(originalMessage) {
  const contextualSuggestions = getContextualCookingSuggestion();
  
  // Responses that specifically acknowledge what they asked about but redirect to cooking
  const responses = [
    `I appreciate your question about "${originalMessage.substring(0, 30)}${originalMessage.length > 30 ? '...' : ''}", but I'm here to help you with cooking! ${contextualSuggestions}`,
    `That sounds interesting, but I'm your cooking assistant, so let's focus on what we can create in the kitchen! ${contextualSuggestions}`,
    `I understand you're curious about "${originalMessage.substring(0, 30)}${originalMessage.length > 30 ? '...' : ''}", but I'm designed to help with recipes and cooking. ${contextualSuggestions}`,
    `While I'd love to discuss ${originalMessage.substring(0, 25)}${originalMessage.length > 25 ? '...' : ''} with you, I'm really here to help you cook amazing dishes! ${contextualSuggestions}`,
    `That's definitely not my area of expertise - I'm your kitchen companion! ${contextualSuggestions}`,
    `I have to stay focused on my true passion: helping people cook delicious food! ${contextualSuggestions}`,
    `Let me redirect this conversation to something I'm really good at - cooking! ${contextualSuggestions}`,
    `That's outside my kitchen expertise, but I'm excellent at recipe creation! ${contextualSuggestions}`,
    `I might not be the best person to ask about that, but I AM great at cooking! ${contextualSuggestions}`,
    `While you figure that out, let's cook something wonderful instead! ${contextualSuggestions}`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Groq AI API - Single ChatGPT-like service
async function callGroqAI(message, conversationHistory = []) {
  const apiKey = process.env.GROQ_API_KEY;
  
  // Check if API key is provided
  if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.trim() === '') {
    throw new Error('GROQ_API_KEY environment variable is required. Please get a free API key from https://console.groq.com/ and add it to your .env file.');
  }

  const systemMessage = {
    role: "system",
    content: "You are CookMate, a helpful AI cooking assistant. Help users with recipes, cooking advice, meal planning, and ingredient suggestions. Be friendly, informative, and focus on cooking topics. Provide practical, actionable cooking advice. When users mention ingredients, acknowledge them and suggest creative ways to use them. Keep responses conversational and engaging, like a knowledgeable friend who loves cooking."
  };
  
  // Prepare conversation messages
  const conversation = Array.isArray(conversationHistory) ? conversationHistory : [];
  const messages = [systemMessage];
  
  // Add conversation history (limit to last 10 messages to manage token count)
  const recentHistory = conversation.slice(-10);
  messages.push(...recentHistory);
  
  // Add current user message if not already included
  const lastMessage = recentHistory[recentHistory.length - 1];
  const includeUserMessage = !(lastMessage && lastMessage.role === 'user' && lastMessage.content === message);
  
  if (includeUserMessage) {
    messages.push({
      role: 'user',
      content: message
    });
  }
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant", // Current free tier model
      messages: messages,
      max_tokens: 200,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Groq API Error:', response.status, errorData);
    throw new Error(`Groq API request failed: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content;
  
  if (!aiResponse) {
    throw new Error('No response generated from Groq API');
  }
  
  return aiResponse;
}

// CHAT ENDPOINT - ChatGPT-like interface
router.post('/chat', verifyAuthToken, async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Check for off-topic content
    if (isOffTopic(message)) {
      const aiReply = getOffTopicResponse(message);
      
      return res.status(200).json({
        response: {
          message: aiReply,
          timestamp: new Date().toISOString(),
          userId: req.userId,
          isOffTopic: true,
          redirectToCooking: true
        }
      });
    }
    
    // Generate AI response using Groq
    const aiReply = await callGroqAI(message, history);
    
    res.status(200).json({
      response: {
        message: aiReply,
        timestamp: new Date().toISOString(),
        detectedIngredients: extractIngredients(message),
        userId: req.userId,
        isOffTopic: false,
        redirectToCooking: false
      }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('GROQ_API_KEY')) {
      return res.status(500).json({
        error: 'API_KEY_REQUIRED',
        message: 'Groq API key is required. Please get a free API key from https://console.groq.com/ and add it to your .env file as GROQ_API_KEY.',
        instructions: {
          step1: 'Visit https://console.groq.com/',
          step2: 'Create a free account',
          step3: 'Generate an API key',
          step4: 'Add it to your .env file as GROQ_API_KEY=your_key_here'
        }
      });
    }
    
    res.status(500).json({
      error: 'CHAT_SERVICE_ERROR',
      message: 'AI service temporarily unavailable. Please try again later.',
      details: error.message
    });
  }
});

// GENERATE RECIPE ENDPOINT - Enhanced with real AI
router.post('/generate-recipe', verifyAuthToken, async (req, res) => {
  try {
    const { userMessage, ingredients: providedIngredients, dietaryPreferences, recipeType } = req.body;
    
    let ingredients = providedIngredients;
    
    // Extract ingredients from user message if not provided
    if (userMessage && (!ingredients || ingredients.length === 0)) {
      ingredients = extractIngredients(userMessage);
    }
    
    // Create a detailed prompt for recipe generation
    let recipePrompt = `Create a delicious recipe`;
    
    if (ingredients && ingredients.length > 0) {
      recipePrompt += ` using these ingredients: ${ingredients.join(', ')}`;
    }
    
    if (dietaryPreferences) {
      recipePrompt += `. Dietary preferences: ${dietaryPreferences}`;
    }
    
    if (recipeType) {
      recipePrompt += `. Recipe type: ${recipeType}`;
    }
    
    recipePrompt += `. Please provide the recipe in this JSON format:
{
  "title": "Recipe Name",
  "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
  "instructions": ["Step 1 description", "Step 2 description"],
  "cookingTime": "e.g. 30 minutes",
  "servings": "e.g. 4",
  "difficulty": "Easy/Medium/Hard",
  "description": "Brief appetizing description"
}

Only return the JSON, no additional text.`;

    // Generate recipe using Groq
    const aiResponse = await callGroqAI(recipePrompt);
    
    // Parse JSON response from AI
    let recipeData;
    try {
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = aiResponse.substring(jsonStart, jsonEnd + 1);
        recipeData = JSON.parse(jsonString);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI recipe response:', parseError);
      // Fallback to basic recipe structure
      recipeData = {
        title: "AI Generated Recipe",
        ingredients: ingredients || ["Please specify ingredients"],
        instructions: aiResponse.split('\n').filter(line => line.trim()),
        cookingTime: "Varies",
        servings: "4",
        difficulty: "Medium",
        description: aiResponse
      };
    }
    
    res.status(200).json({
      message: 'Recipe generation successful',
      recipe: recipeData,
      detectedIngredients: ingredients,
      userId: req.userId
    });
    
  } catch (error) {
    console.error('Recipe generation error:', error);
    
    if (error.message.includes('GROQ_API_KEY')) {
      return res.status(500).json({
        error: 'API_KEY_REQUIRED',
        message: 'Groq API key is required for recipe generation. Please get a free API key from https://console.groq.com/'
      });
    }
    
    res.status(500).json({
      error: 'RECIPE_GENERATION_FAILED',
      message: "I'm having trouble creating that recipe. Can you try again?",
      details: error.message
    });
  }
});

// SUGGEST INGREDIENTS ENDPOINT - Enhanced with AI suggestions
router.post('/suggest-ingredients', verifyAuthToken, async (req, res) => {
  try {
    const { availableIngredients } = req.body;
    
    // If we have available ingredients, use AI to suggest complementary ingredients
    if (availableIngredients && availableIngredients.length > 0) {
      try {
        const prompt = `I have these ingredients: ${availableIngredients.join(', ')}. Suggest 5-7 complementary ingredients that would go well with them for cooking. Return only a JSON array of ingredient strings.`;
        
        const aiResponse = await callGroqAI(prompt);
        
        // Try to parse AI suggestions
        let aiSuggestions = [];
        try {
          const jsonStart = aiResponse.indexOf('[');
          const jsonEnd = aiResponse.lastIndexOf(']');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = aiResponse.substring(jsonStart, jsonEnd + 1);
            aiSuggestions = JSON.parse(jsonString);
          }
        } catch (parseError) {
          console.log('Failed to parse AI suggestions, using fallback');
        }
        
        if (aiSuggestions.length > 0) {
          return res.status(200).json({
            suggestions: aiSuggestions,
            message: 'AI-generated ingredient suggestions',
            userId: req.userId
          });
        }
      } catch (aiError) {
        console.log('AI suggestion failed, using fallback:', aiError.message);
      }
    }
    
    // Fallback to rule-based suggestions
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
    
    res.status(200).json({
      suggestions,
      message: 'Smart ingredient suggestions generated',
      userId: req.userId
    });
    
  } catch (error) {
    console.error('Ingredient suggestion error:', error);
    res.status(500).json({
      error: 'SUGGESTION_GENERATION_FAILED',
      suggestions: ['Garlic', 'Olive Oil', 'Salt', 'Black Pepper', 'Herbs']
    });
  }
});

module.exports = router;
