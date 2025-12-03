const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// In-memory cache for recipe consistency during development
const recipeCache = new Map();

// Helper function to generate consistent recipe ID
function generateConsistentRecipeId(recipeName) {
  return recipeName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

// Helper function to save recipe to Firestore
async function saveRecipeToFirestore(recipeData, userId = 'anonymous') {
  try {
    // Generate a clean recipe ID from title
    const recipeId = recipeData.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50) + '_' + Date.now();

    const recipeDoc = {
      id: recipeId,
      title: recipeData.title,
      description: recipeData.description || '',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      cookingTime: recipeData.cookingTime || 'Varies',
      servings: recipeData.servings || '4',
      difficulty: recipeData.difficulty || 'Medium',
      estimatedCost: recipeData.estimatedCost || 'Moderate',
      nutritionInfo: recipeData.nutritionInfo || {},
      tips: recipeData.tips || [],
      youtubeUrl: recipeData.youtubeUrl || null,
      youtubeSearchQuery: recipeData.youtubeSearchQuery || `${recipeData.title} recipe tutorial`,
      userId: userId,
      createdAt: new Date().toISOString(),
      isAIGenerated: true,
      likes: 0
    };

    // Save to Firestore
    await db.collection('recipes').doc(recipeId).set(recipeDoc);
    
    console.log('✅ Recipe saved to Firestore:', recipeId);
    return recipeId;
  } catch (error) {
    console.error('❌ Failed to save recipe to Firestore:', error);
    throw error;
  }
}

// Helper function to store detected recipe data
async function storeDetectedRecipe(recipeName, userId = 'anonymous') {
  try {
    const recipeId = generateConsistentRecipeId(recipeName);
    
    try {
      // Check if recipe already exists
      const existingRecipe = await db.collection('detectedRecipes').doc(recipeId).get();
      
      if (existingRecipe.exists) {
        console.log('✅ Detected recipe already exists:', recipeId);
        return recipeId;
      }

      // Generate basic recipe data for detected recipes
      const recipeData = {
        id: recipeId,
        title: recipeName,
        description: `A delicious ${recipeName} recipe to try`,
        ingredients: ["Click on the recipe card to get detailed ingredients"],
        instructions: ["Click on the recipe card to get detailed instructions"],
        cookingTime: "Varies",
        servings: "4",
        difficulty: "Medium",
        estimatedCost: "Moderate",
        nutritionInfo: {
          calories: "Varies",
          protein: "Varies",
          carbs: "Varies",
          fat: "Varies"
        },
        tips: ["Click on the recipe to get detailed cooking tips"],
        youtubeSearchQuery: `${recipeName} recipe tutorial`,
        userId: userId,
        createdAt: new Date().toISOString(),
        isDetected: true
      };

      // Save to detected recipes collection
      await db.collection('detectedRecipes').doc(recipeId).set(recipeData);
      
      console.log('✅ Detected recipe stored:', recipeId);
      return recipeId;
    } catch (collectionError) {
      console.log('⚠️ Detected recipes collection not available, skipping storage:', collectionError.message);
      return recipeId; // Return anyway, don't fail the process
    }
  } catch (error) {
    console.error('❌ Failed to store detected recipe:', error);
    throw error;
  }
}

// Helper function to get stored recipe data
async function getStoredRecipe(recipeName) {
  try {
    const recipeId = generateConsistentRecipeId(recipeName);
    
    // STEP 1: Check in-memory cache first (for immediate testing)
    if (recipeCache.has(recipeName)) {
      console.log('✅ Found recipe in memory cache:', recipeName);
      return recipeCache.get(recipeName);
    }
    
    // STEP 2: Try to get from detected recipes first
    try {
      const detectedRecipe = await db.collection('detectedRecipes').doc(recipeId).get();
      if (detectedRecipe.exists) {
        console.log('✅ Found detected recipe:', recipeId);
        return detectedRecipe.data();
      }
    } catch (detectedError) {
      console.log('⚠️ Detected recipes collection not available:', detectedError.message);
    }

    // STEP 3: Try to find in main recipes collection using a simpler approach
    try {
      const allRecipesSnapshot = await db.collection('recipes').get();
      
      if (!allRecipesSnapshot.empty) {
        const matchingRecipe = allRecipesSnapshot.docs.find(doc => 
          doc.data().title === recipeName
        );
        
        if (matchingRecipe) {
          console.log('✅ Found recipe in main collection:', matchingRecipe.id);
          return matchingRecipe.data();
        }
      }
    } catch (mainError) {
      console.log('⚠️ Main recipes collection not available:', mainError.message);
    }

    console.log('❌ No stored recipe found for:', recipeName);
    return null;
  } catch (error) {
    console.error('❌ Failed to get stored recipe:', error);
    return null;
  }
}

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

// Function to detect if user is asking about the app developers
function isDeveloperQuestion(message) {
  const lowerMessage = message.toLowerCase();
  
  const developerKeywords = [
    'who made this app', 'who created this app', 'who developed this app',
    'who built this app', 'who made you', 'who created you', 'who developed you',
    'who is your developer', 'who is your creator', 'who made cookmate',
    'who created cookmate', 'who developed cookmate', 'who built cookmate',
    'who is the developer', 'who is the creator', 'who programmed this',
    'who coded this', 'who designed this app', 'who built this application',
    'john mark', 'john paul', 'magdasal', 'mahilom'
  ];
  
  return developerKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Function to detect if user is asking "Who are you?" type questions
function isIdentityQuestion(message) {
  const lowerMessage = message.toLowerCase();
  
  const identityKeywords = [
    'who are you', 'what are you', 'introduce yourself', 'tell me about yourself',
    'what is cookmate', 'who is cookmate', 'explain cookmate', 'describe cookmate',
    'your purpose', 'your function', 'what do you do', 'your role',
    'tell me about you', 'about yourself', 'help me understand you'
  ];
  
  return identityKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Function to get developer information response
function getDeveloperResponse() {
  return `CookMate was created by:
  
👨‍💻 **John Mark P. Magdasal**
👨‍💻 **John Paul Mahilom**

We're passionate about cooking and technology, and we built CookMate to make cooking more accessible and enjoyable for everyone. We hope this app helps you create amazing meals and discover new flavors!

What would you like to cook today? 🍳`;
}

// Function to get identity/who are you response
function getIdentityResponse() {
  return `Hello! I'm CookMate, your comprehensive AI cooking assistant! 👨‍🍳

I'm an intelligent cooking companion designed to help you with everything related to food and cooking. Here's what I can do for you:

**🍳 Recipe Help**: Get detailed recipes with ingredients, step-by-step instructions, cooking times, and difficulty levels

**👨‍🍳 Celebrity Chefs**: Learn about famous chefs like Gordon Ramsay, Julia Child, Anthony Bourdain, Ina Garten, and many others - their cooking styles, signature dishes, and culinary contributions

**🥗 Ingredient Suggestions**: Tell me what ingredients you have, and I'll suggest delicious recipes you can make

**🥗 Health & Nutrition**: Learn about the nutritional benefits of foods and cooking methods

**⚠️ Food Safety**: Get important safety guidelines including proper cooking temperatures, food storage, and hygiene practices

**🍽️ Meal Planning**: Get help planning meals based on your preferences, dietary needs, or available ingredients

I was created by John Mark P. Magdasal and John Paul Mahilom to make cooking more accessible, enjoyable, and safe for everyone. Whether you're a beginner or an experienced cook, I'm here to help you create amazing meals!

What would you like to cook or learn about today? 🍳`;
}

// Enhanced content detection function with comprehensive off-topic categories
function isOffTopic(message) {
  const lowerMessage = message.toLowerCase();
  
  const offTopicKeywords = [
    // Politics & Government
    'politics', 'election', 'vote', 'government', 'policy', 'democrat', 'republican',
    'congress', 'senate', 'parliament', 'president', 'prime minister', 'mayor',
    'political', 'campaign', 'ballot', 'legislation', 'law', 'court', 'judge',
    
    // Religion & Faith (but not dietary religious practices)
    'religion', 'religious', 'god', 'jesus', 'allah', 'buddha', 'christian', 'muslim',
    'jewish', 'hindu', 'buddhist', 'church', 'mosque', 'temple', 'prayer',
    'bible', 'quran', 'torah', 'scripture', 'faith', 'spirituality', 'worship',
    
    // Sports & Recreation
    'sports', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf',
    'hockey', 'volleyball', 'cricket', 'rugby', 'olympics', 'nfl', 'nba', 'mlb',
    'fifa', 'uefa', 'championship', 'tournament', 'game', 'match', 'season',
    
    // Gaming & Entertainment (but not food-related gaming)
    'gaming', 'video games', 'xbox', 'playstation', 'nintendo', 'switch', 'pc gaming',
    'minecraft', 'fortnite', 'call of duty', 'league of legends', 'wow', 'pokemon',
    'board games', 'chess', 'poker', 'casino', 'betting', 'movies', 'cinema',
    'tv show', 'netflix', 'disney', 'marvel', 'star wars', 'harry potter',
    
    // Technology & Programming (but not cooking technology)
    'technology', 'programming', 'coding', 'software', 'javascript', 'python', 'java',
    'react', 'angular', 'vue', 'node.js', 'html', 'css', 'git', 'github',
    'artificial intelligence', 'machine learning', 'blockchain', 'cryptocurrency',
    'bitcoin', 'ethereum', 'startup', 'tech', 'internet', 'website', 'app development',
    
    // Business & Finance (but not food business/finance)
    'business', 'finance', 'stocks', 'investing', 'trading', 'stock market', 'wall street',
    'crypto', 'money', 'wealth', 'salary', 'income', 'mortgage', 'loan', 'debt',
    'banking', 'credit', 'retirement', '401k', 'bitcoin', 'forex', 'economics',
    'entrepreneur', 'startup', 'venture capital', 'ipo', 'merger', 'acquisition',
    
    // Education & Academic (but not cooking education)
    'education', 'school', 'university', 'college', 'student', 'teacher', 'professor',
    'homework', 'exam', 'test', 'grade', 'study', 'learning', 'course', 'class',
    'math', 'algebra', 'calculus', 'physics', 'chemistry', 'biology', 'history',
    'geography', 'literature', 'essay', 'research', 'thesis', 'dissertation',
    
    // Health & Fitness (EXCLUDING nutrition - that's cooking related!)
    // Only medical/fitness topics that are NOT food-related
    'exercise', 'workout', 'gym', 'fitness', 'weight loss', 'muscle', 'cardio',
    'yoga', 'pilates', 'running', 'swimming', 'cycling', 'training', 'bodybuilding',
    'medical', 'doctor', 'medicine', 'hospital', 'surgery', 'therapy', 'medication',
    'disease', 'illness', 'symptoms', 'treatment', 'diagnosis',
    
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
    'house', 'apartment', 'furniture', 'decor', 'makeup', 'cosmetics',
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

// Function to detect and extract recipe lists from AI response
function extractRecipesFromResponse(response) {
  const recipes = [];
  const uniqueRecipes = new Set(); // Prevent duplicates
  
  console.log('🍳 [RECIPE DETECTION] Starting extraction from response');
  console.log('🍳 [RECIPE DETECTION] Response length:', response.length);
  console.log('🍳 [RECIPE DETECTION] Response preview:', response.substring(0, 300) + '...');
  
  // Helper function to add recipe if valid and unique
  const addRecipe = (recipeName, source = 'unknown') => {
    const cleaned = recipeName.trim();
    console.log(`🔍 [ADD_RECIPE] Attempting to add recipe from ${source}: "${cleaned}"`);
    
    if (!cleaned) {
      console.log(`❌ [ADD_RECIPE] Empty recipe name`);
      return false;
    }
    
    if (uniqueRecipes.has(cleaned.toLowerCase())) {
      console.log(`❌ [ADD_RECIPE] Duplicate recipe: "${cleaned}"`);
      return false;
    }
    
    const validationResult = isValidRecipe(cleaned);
    console.log(`🔍 [ADD_RECIPE] Validation result for "${cleaned}":`, validationResult);
    
    if (validationResult) {
      recipes.push(cleaned);
      uniqueRecipes.add(cleaned.toLowerCase());
      console.log(`✅ [RECIPE DETECTION] Added recipe from ${source}: "${cleaned}"`);
      return true;
    } else {
      console.log(`❌ [RECIPE DETECTION] Rejected recipe from ${source}: "${cleaned}" (validation failed)`);
    }
    return false;
  };
  
  // Pattern 1: Bold recipe names at the beginning of the response (highest priority)
  const leadingBoldPattern = /^\s*\*\*([^*]+)\*\*/m;
  const leadingMatch = response.match(leadingBoldPattern);
  console.log('🔍 [PATTERN_1] Leading bold match attempt:', leadingMatch ? leadingMatch[1] : 'NO_MATCH');
  console.log('🔍 [PATTERN_1] Full match object:', leadingMatch);
  
  if (leadingMatch) {
    const recipeName = leadingMatch[1].trim();
    console.log('🔍 [PATTERN_1] Attempting to add recipe:', recipeName);
    console.log('🔍 [PATTERN_1] Recipe name length:', recipeName.length);
    console.log('🔍 [PATTERN_1] First 50 chars of recipe name:', recipeName.substring(0, 50));
    addRecipe(recipeName, 'pattern_1_leading_bold');
  } else {
    console.log('🔍 [PATTERN_1] No leading bold pattern found, checking if response starts with bold...');
    console.log('🔍 [PATTERN_1] Response starts with:', response.substring(0, 100));
    
    // Direct debug for the specific case that failed
    if (response.startsWith('**')) {
      console.log('🔍 [PATTERN_1] Response DOES start with **, but pattern failed!');
      const lines = response.split('\n');
      console.log('🔍 [PATTERN_1] First line:', lines[0]);
      const boldMatch = lines[0].match(/^\s*\*\*([^*]+)\*\*/);
      console.log('🔍 [PATTERN_1] Manual pattern match on first line:', boldMatch ? boldMatch[1] : 'NO_MATCH');
    }
  }
  
  // Pattern 2: Bold recipe names with colon (**: ...:)
  const boldColonPattern = /\*\*([^*:]+)\*\s*:/g;
  let match;
  
  console.log('🔍 [PATTERN_2] Testing bold colon pattern...');
  while ((match = boldColonPattern.exec(response)) !== null) {
    const recipeName = match[1].trim();
    console.log('🔍 [PATTERN_2] Found bold colon recipe:', recipeName);
    addRecipe(recipeName, 'pattern_2_bold_colon');
  }
  
  // Pattern 3: Numbered bold recipe names (1. **Recipe**: description)
  const numberedBoldPattern = /^\s*(\d+)\.\s*\*\*([^*]+)\*\*\s*:?/gm;
  while ((match = numberedBoldPattern.exec(response)) !== null) {
    const recipeName = match[2].trim(); // Get the bold text between **
    console.log('🔍 [PATTERN_3] Found numbered bold recipe:', recipeName);
    addRecipe(recipeName, 'pattern_3_numbered_bold');
  }
  
  // Pattern 3b: General numbered recipes with colons
  const generalNumberedPattern = /^\s*(\d+)\.\s*([A-Z][^.!?\n]{10,80})(?=:)/gm;
  while ((match = generalNumberedPattern.exec(response)) !== null) {
    const recipeName = match[2].trim();
    console.log('🔍 [PATTERN_3B] Found general numbered recipe:', recipeName);
    addRecipe(recipeName, 'pattern_3b_general_numbered');
  }
  
  // Pattern 3c: Universal numbered recipe format (more restrictive)
  const universalNumberedPattern = /^\s*(\d+)\.\s*\*?\*?([A-Z][^.!?\n]{5,80})\*?\*?\s*:?/gm;
  while ((match = universalNumberedPattern.exec(response)) !== null) {
    let recipeName = match[2].trim();
    console.log('🔍 [PATTERN_3C] Raw numbered text:', recipeName);
    
    // Only accept if it looks like a proper recipe name
    if (recipeName.length >= 5 && recipeName.length <= 80 && 
        /^[A-Z][a-z\s]+[a-zA-Z]$/.test(recipeName) &&
        !recipeName.toLowerCase().includes('ingredient') &&
        !recipeName.toLowerCase().includes('instruction') &&
        !recipeName.toLowerCase().includes('step') &&
        !recipeName.toLowerCase().includes('direction')) {
      console.log('🔍 [PATTERN_3C] Valid recipe name:', recipeName);
      addRecipe(recipeName, 'pattern_3c_universal_numbered');
    }
  }
  
  // Pattern 4: Standalone bold recipe names (more restrictive)
  const boldPattern = /\*\*([A-Z][^*]{4,50}[A-Za-z])\*\s*(?=\n\n|\n\d+|\n[A-Z]|$)/g;
  while ((match = boldPattern.exec(response)) !== null) {
    const recipeName = match[1].trim();
    // Only accept if it looks like a proper recipe name
    if (recipeName.split(' ').length >= 2 && recipeName.length <= 60 &&
        !recipeName.toLowerCase().includes('ingredient') &&
        !recipeName.toLowerCase().includes('instruction') &&
        !recipeName.toLowerCase().includes('step') &&
        !recipeName.toLowerCase().includes('direction') &&
        !recipeName.toLowerCase().includes('tip') &&
        !recipeName.toLowerCase().includes('safety')) {
      console.log('🔍 [PATTERN_4] Found standalone bold recipe:', recipeName);
      addRecipe(recipeName, 'pattern_4_standalone_bold');
    }
  }
  
  // Pattern 5: Numbered lists with recipe names (1. Recipe Name:)
  const numberedPattern = /^\s*\d+\.\s*([A-Z][^.\n:]{5,80})(?=:)/gm;
  while ((match = numberedPattern.exec(response)) !== null) {
    console.log('🔍 [PATTERN_5] Found numbered recipe:', match[1].trim());
    addRecipe(match[1].trim(), 'pattern_5_numbered');
  }
  
  // Pattern 6: Recipe names from bullet points at section starts
  const sectionPattern = /^\s*[*-]\s*([A-Z][^.\n:]{5,80})(?=[:\n])/gm;
  while ((match = sectionPattern.exec(response)) !== null) {
    console.log('🔍 [PATTERN_6] Found bullet recipe:', match[1].trim());
    addRecipe(match[1].trim(), 'pattern_6_section_bullet');
  }
  
  // Pattern 7: Recipe names from headers or titles (## Recipe Name)
  const headerPattern = /^#{1,6}\s*(.+)$/gm;
  while ((match = headerPattern.exec(response)) !== null) {
    const header = match[1].trim();
    if (header.length > 5 && header.length < 80 && isValidRecipe(header)) {
      console.log('🔍 [PATTERN_7] Found header recipe:', header);
      addRecipe(header, 'pattern_7_header');
    }
  }
  
  // Pattern 8: Catch-all for any bold text followed by colon (universal pattern)
  const catchAllPattern = /\*\*([^*]+)\*\*\s*:/g;
  while ((match = catchAllPattern.exec(response)) !== null) {
    const recipeName = match[1].trim();
    console.log('🔍 [PATTERN_8] Found catch-all bold recipe:', recipeName);
    addRecipe(recipeName, 'pattern_8_catch_all');
  }
  
  // FALLBACK: If no recipes found with patterns, try intelligent extraction
  if (recipes.length === 0) {
    console.log('🍳 [RECIPE DETECTION] No recipes found with patterns, trying fallback extraction...');
    
    // Look for lines that contain recipe indicators
    const lines = response.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and common non-recipe indicators
      if (!line || 
          line.toLowerCase().includes('ingredients') ||
          line.toLowerCase().includes('instructions') ||
          line.toLowerCase().includes('directions') ||
          line.toLowerCase().includes('steps') ||
          line.toLowerCase().includes('method') ||
          line.length < 5 ||
          line.length > 100) {
        continue;
      }
      
      // Look for lines that might be recipe names (contain cooking words and start with capital)
      const cookingWords = /\b(recipe|chicken|beef|pork|fish|salmon|shrimp|pasta|rice|salad|soup|stew|cake|bread|cookie|curry|taco|burrito|sandwich|omelette|pancake|waffle|muffin|brownie|pie|risotto|noodles|lasagna|gnocchi|tortellini|quesadilla|nachos|tamale|enchilada|lobster|crab|cod|haddock|tilapia|catfish|mushroom|zucchini|eggplant|avocado|vanilla|almond|coconut|chocolate|honey|oats|quinoa|cheese|mozzarella|parmesan|cheddar|tomato|potato|onion|garlic|pepper|broccoli|carrots|spinach|kale|basil|oregano|thyme|rosemary)\b/i;
      
      if (line.match(/^[A-Z][^.!?]{5,80}$/) && cookingWords.test(line)) {
        addRecipe(line, 'fallback_intelligent');
        if (recipes.length >= 3) break; // Limit fallback results
      }
    }
  }
  
  // ULTIMATE FALLBACK: If still no recipes, look for any substantial lines with food words
  if (recipes.length === 0) {
    console.log('🍳 [RECIPE DETECTION] No recipes found, trying ultimate fallback...');
    
    const foodWordPattern = /\b(chicken|beef|pork|fish|salmon|shrimp|pasta|rice|salad|soup|stew|cake|bread|cookie|curry|taco|burrito|sandwich|omelette|pancake|waffle|muffin|brownie|pie|risotto|noodles|lasagna|gnocchi|tortellini|quesadilla|nachos|tamale|enchilada|lobster|crab|cod|haddock|tilapia|catfish|mushroom|zucchini|eggplant|avocado|vanilla|almond|coconut|chocolate|honey|oats|quinoa|cheese|mozzarella|parmesan|cheddar|tomato|potato|onion|garlic|pepper|broccoli|carrots|spinach|kale|basil|oregano|thyme|rosemary)\w*/gi;
    
    const matches = response.match(foodWordPattern);
    if (matches && matches.length > 0) {
      // Take the most common food words and create recipe suggestions
      const wordCounts = {};
      matches.forEach(word => {
        const cleanWord = word.toLowerCase();
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      });
      
      // Sort by frequency and take top candidates
      const sortedWords = Object.entries(wordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word);
      
      // Create simple recipe suggestions
      sortedWords.forEach(word => {
        const recipeName = word.charAt(0).toUpperCase() + word.slice(1);
        if (recipeName.length > 3) {
          addRecipe(recipeName, 'ultimate_fallback');
        }
      });
    }
  }
  
  console.log('🍳 [RECIPE DETECTION] Final extracted recipes:', recipes);
  console.log('🍳 [RECIPE DETECTION] Total count:', recipes.length);
  
  return recipes;
}

// Helper function to validate if extracted text is actually a recipe (not a category)
function isValidRecipe(text) {
  if (!text || text.length === 0) {
    console.log('❌ [VALIDATION] Failed: empty text');
    return false;
  }
  
  const lowerText = text.toLowerCase().trim();
  
  console.log('🔍 [VALIDATION] Checking:', text);
  
  // Basic length check - more restrictive
  if (text.length < 5 || text.length > 60) {
    console.log('❌ [VALIDATION] Failed: invalid length (' + text.length + ')');
    return false;
  }
  
  // Must start with capital letter
  if (!/^[A-Z]/.test(text.trim())) {
    console.log('❌ [VALIDATION] Failed: does not start with capital letter');
    return false;
  }
  
  // Must not end with common non-recipe endings
  if (/[.!?]$/.test(text.trim())) {
    console.log('❌ [VALIDATION] Failed: ends with punctuation');
    return false;
  }
  
  // Safety and instruction content to exclude
  const excludeSafetyItems = [
    'beef pork and lamb', 'ground meats', 'poultry', 'fish', 'temperature', 'temperatures',
    'safe temperature', 'cooking temperature', 'internal temperature', 'fahrenheit', 'celsius',
    'cross contamination', 'food safety', 'storage guidelines', 'shelf life',
    'refrigerate', 'refrigeration', 'freezing', 'freeze', 'perishable', 'raw meat',
    'fire extinguisher', 'first aid', 'emergency', 'burns', 'cuts', 'injuries',
    'oven mitts', 'potholders', 'hot surfaces', 'sharp knives', 'cutting board',
    'protective gear', 'apron', 'gloves', 'hat', 'hygiene', 'clean kitchen',
    'appliance', 'manufacturer', 'guidelines', 'maintenance'
  ];
  
  // Check for safety/instruction content first
  if (excludeSafetyItems.some(item => lowerText.includes(item))) {
    console.log('❌ [VALIDATION] Failed: contains safety/instruction content');
    return false;
  }
  
  // Specific items to exclude (these are ingredients, not recipes)
  // NOTE: Only exclude exact matches or clear instruction references
  const excludeItems = [
    'salt and pepper', 'seasoning', 'seasonings', 'to taste',
    'garlic powder', 'onion powder', 'paprika', 'cumin', 'oregano', 'thyme',
    'basil', 'parsley', 'cilantro', 'dill', 'chives', 'marjoram', 'tarragon',
    'lemon juice', 'lime juice', 'vinegar', 'olive oil', 'vegetable oil',
    'oil', 'water', 'sugar', 'flour', 'baking powder',
    'baking soda', 'yeast', 'vanilla', 'almond extract', 'lemon zest',
    'ingredients', 'instructions', 'directions', 'method', 'steps',
    'degree', '°f', '°c', '°celsius', '°fahrenheit', 'minutes', 'hours',
    'pound', 'pounds', 'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
    'ounce', 'ounces', 'gram', 'grams', 'kilogram', 'kilograms', 'liter', 'liters'
  ];
  
  // Check for excluded items first (simple contains check for now)
  const containsExcludedItem = excludeItems.some(item => lowerText.includes(item));
  console.log('🔍 [VALIDATION] Checking excluded items for "' + text + '":', containsExcludedItem);
  if (containsExcludedItem) {
    console.log('❌ [VALIDATION] Failed: contains excluded item');
    return false;
  }
  
  // Should not contain cooking measurements or instructions
  const containsMeasurements = /\d+\s*(cup|cups|tbsp|tsp|tablespoon|teaspoon|pound|pounds|oz|ounce|gram|grams|lb|lbs)/i.test(text);
  const containsTemperatures = /\d+°?f|°c|\d+\s*(degrees?|minutes?|hours?)/i.test(text);
  const containsInstructions = /(step|cook|heat|add|mix|stir|bake|fry|boil)/i.test(text);
  
  if (containsMeasurements || containsTemperatures || containsInstructions) {
    console.log('❌ [VALIDATION] Failed: contains cooking instructions/measurements');
    return false;
  }
  
  // Generic terms to exclude completely
  const genericTerms = [
    'recipe suggestions', 'recipe ideas', 'suggestions', 'ideas', 'suggestion', 'idea',
    'cooking tips', 'cooking advice', 'kitchen tips', 'food suggestions', 'recipe help',
    'cooking methods', 'cooking techniques', 'recipe variations', 'cooking ideas',
    'meal ideas', 'food ideas', 'cooking inspiration', 'recipe inspiration',
    'global inspirations', 'quick and easy', 'veggie delights'
  ];
  
  // Section headers and ingredient instruction phrases to exclude
  const sectionHeaders = [
    'for the salmon', 'for the chicken', 'for the beef', 'for the fish', 'for the pork',
    'for the vegetables', 'for the sauce', 'for the garnish', 'for the seasoning',
    'to the salmon', 'to the chicken', 'to the beef', 'to the fish', 'to the pork',
    'the salmon', 'the chicken', 'the beef', 'the fish', 'the pork',
    'for salmon', 'for chicken', 'for beef', 'for fish', 'for pork',
    'season the salmon', 'season the chicken', 'season the beef', 'season the fish', 'season the pork'
  ];
  
  // Check for generic terms first (highest priority to exclude)
  if (genericTerms.some(term => lowerText.includes(term))) {
    console.log('❌ [VALIDATION] Failed: contains generic terms');
    return false;
  }
  
  // Check for section headers and instruction phrases (high priority exclusion)
  if (sectionHeaders.some(header => lowerText.includes(header))) {
    console.log('❌ [VALIDATION] Failed: contains section header or instruction phrase');
    return false;
  }
  
  // Category patterns to exclude (more specific patterns to avoid false positives)
  const categoryPatterns = [
    /^(italian|mexican|asian|french|indian|thai|chinese|japanese|korean|mediterranean|american|bbq)\s+(cuisine|food|style|cooking|dishes)/,
    /^(comfort food|healthy|vegetarian|vegan|gluten free|dessert|appetizer|main course|side dish)$/,
    /^(breakfast|lunch|dinner|snack|beverage|drink|traditional|classic|modern|fusion)$/,
    /^recipe (suggestions|ideas|tips|help|variations|inspiration)$/,
    /^(cooking|tips|advice|methods|techniques|inspiration)$/
  ];
  
  // Check for category patterns
  if (categoryPatterns.some(pattern => pattern.test(lowerText))) {
    console.log('❌ [VALIDATION] Failed: matches category pattern');
    return false;
  }
  
  // Check if it looks like temperature or measurement information
  const tempOrMeasurePattern = /\d+°?f|°c|\d+\s*(cup|cups|tbsp|tsp|tablespoon|teaspoon|pound|pounds|oz|ounce|gram|grams|lb|lbs)/i;
  if (tempOrMeasurePattern.test(text)) {
    console.log('❌ [VALIDATION] Failed: contains temperature or measurement');
    return false;
  }
  
  // Must contain food-related keywords - more focused list
  const foodKeywords = /\b(chicken|beef|pork|lamb|fish|salmon|shrimp|tuna|tofu|eggs?|pasta|rice|spaghetti|pizza|salad|soup|stew|cake|bread|cookie|curry|taco|burrito|sandwich|omelette|pancake|waffle|muffin|brownie|pie|risotto|noodles|lasagna|gnocchi|tortellini|quesadilla|nachos|tamale|enchilada|lobster|crab|cod|haddock|tilapia|catfish|mushroom|zucchini|eggplant|avocado|lime|lemon|orange|apple|banana|berries|vanilla|almond|coconut|chocolate|honey|oats|quinoa|cheese|mozzarella|parmesan|cheddar|milk|cream|yogurt|tomato|potato|onion|garlic|pepper|broccoli|carrots|spinach|kale|basil|oregano|thyme|rosemary|sage|mint|cilantro|curry|masala|tikka|vindaloo|korma|biryani|pulao|naan|roti|paratha|dosa|idli|vada|sambhar|rasam|paneer|fettuccine|alfredo|carbonara|minestrone|bruschetta|caprese|napoletana|penne|rigatoni|farfalle|linguine|conchiglie|orzo|couscous|barley|bulgur|farro|polenta|grits|oatmeal|porridge|cereal|muesli|granola|heavy cream|half and half|evaporated milk|condensed milk|coconut milk|almond milk|soy milk|oat milk|rice milk|all-purpose flour|whole wheat flour|almond flour|coconut flour|oat flour|cornmeal|cornstarch|arrowroot|tapioca|baking powder|baking soda|yeast|brown sugar|powdered sugar|maple syrup|agave|molasses|coconut sugar|stevia|artificial sweetener|vanilla extract|lemon extract|orange extract|unsweetened chocolate|dark chocolate|milk chocolate|semi-sweet chocolate|white chocolate|chocolate chips|cocoa nibs|canola oil|sesame oil|avocado oil|grapeseed oil|sunflower oil|corn oil|soybean oil|peanut oil|walnut oil|almond oil|pistachio oil|hazelnut oil|castor oil|lard|shortening|margarine|ghee|clarified butter|portobello|shiitake|cremini|oyster|king oyster|chanterelle|porcini|matsutake|enoki|wood ear|snow peas|sugar snap peas|green beans|lima beans|fava beans|black-eyed peas|split peas|yellow squash|acorn squash|butternut squash|spaghetti squash|pumpkin|arugula|romaine|lettuce|iceberg|boston butter|cress|watercress|dandelion|collard greens|mustard greens|turnip greens|swiss chard|radish|daikon|turnip|beet|parsnip|rutabaga|celeriac|celery|fennel|artichoke|asparagus|bamboo shoots|bean sprouts|broccolini|broccoli rabe|brussels sprouts|napa cabbage|savoy cabbage|red cabbage|green cabbage|leek|scallion|green onion|shallot|yellow onion|red onion|white onion|sweet onion|vidalias|wallas|pearl onion|white pepper|pink peppercorns|green peppercorns|peppercorns|whole peppercorns|cracked pepper|lemongrass|curry leaves|holy basil|thai basil|genovese basil|sweet basil|dried basil|dried oregano|dried thyme|dried rosemary|dried sage|dried mint|dried parsley|dried cilantro|dried dill|dried chives|dried marjoram|dried tarragon|lemon zest|lime zest|orange zest|grapefruit|tangerine|clementine|mandarin|calamansi|kumquat|pomelo|yuzu|finger lime|blood orange|bergamot|ugli fruit|citrus|passion fruit|dragon fruit|starfruit|lychee|rambutan|longan|mangosteen|jackfruit|durian|papaya|mango|peach|nectarine|apricot|plum|prune|cherry|blueberry|strawberry|raspberry|blackberry|cranberry|gooseberry|elderberry|currant|goji berry|açaí berry|kiwi|guava|pineapple|plantain|pear|quince|fig|date|raisin|cashew|pecan|walnut|hazelnut|brazil nut|macadamia nut|pine nut|chestnut|sunflower seed|pumpkin seed|sesame seed|flax seed|chia seed|hemp seed|poppy seed|safflower seed|cardamom|cinnamon|clove|nutmeg|mace|allspice|ginger|turmeric|paprika|sweet paprika|smoked paprika|cayenne|chili powder|chipotle|ancho|pasilla|guajillo|new mexico|cascade|shishito|poblano|jalapeño|habanero|scotch bonnet|ghost pepper|carolina reaper|bhut jolokia|bird's eye|malagueta|pimenta|sambal oelek|sriracha|harissa|gochujang|douchi|black bean sauce|hoisin sauce|oyster sauce|fish sauce|soy sauce|tamari|coconut aminos|vegan worcestershire|vegetarian worcestershire|anchovy|anchovy paste|fish paste|crab paste|shrimp paste|miso|edamame|recipe|dish|meal|kitchen|cook|cooking|chef|skillet|frying pan|pot|oven|stove|grill)\b/i;
  
  // Check for food keywords - this is the key requirement
  const foodKeywordMatch = foodKeywords.test(lowerText);
  console.log('🔍 [VALIDATION] Food keywords check for "' + text + '":', foodKeywordMatch);
  
  if (!foodKeywordMatch) {
    console.log('❌ [VALIDATION] Failed: no food-related keywords found');
    console.log('🔍 [VALIDATION] Would have checked against:', lowerText);
    return false;
  }
  
  // Must be a proper recipe name format (not a category or generic term)
  const properRecipePattern = /^(?!.*(recipe|suggestion|ideas?|tips?|help|variations?|inspiration|cooking|methods|techniques|meal ideas|food ideas|global inspirations|quick and easy|veggie delights)).+$/i;
  if (!properRecipePattern.test(text)) {
    console.log('❌ [VALIDATION] Failed: matches generic category pattern');
    return false;
  }
  
  console.log('✅ [VALIDATION] Passed - valid recipe detected');
  return true;
}

// Generate contextual cooking suggestions based on the conversation context or random selection
function getContextualCookingSuggestion() {
  const suggestions = [
    "What's in your fridge right now? Let's create something amazing together!",
    "I bet you have some great ingredients waiting to be turned into something delicious. What do you have?",
    "Let's put our culinary skills to work! Do you have any proteins, vegetables, or pantry staples you'd like to use?",
    "I can help you create a mouth-watering meal instead. What ingredients are you working with?",
    "Let's cook something incredible! What do you have in your kitchen?",
    "Cooking together is the perfect solution! Tell me what's in your pantry and I'll suggest a recipe.",
    "Let's put our energy into creating something delicious! What ingredients can we work with today?",
    "I'm here to help with any cooking questions! What would you like to cook or learn about?",
    "How about we explore some recipes together? What sounds good to you?",
    "I can suggest recipes based on what you have available. What ingredients do you have?"
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Enhanced off-topic response with engaging redirects
function getOffTopicResponse(originalMessage) {
  const contextualSuggestions = getContextualCookingSuggestion();
  
  // More welcoming responses that acknowledge non-cooking topics but focus on cooking
  const responses = [
    `I appreciate your question about "${originalMessage.substring(0, 30)}${originalMessage.length > 30 ? '...' : ''}", but I'm specifically designed to help with cooking! ${contextualSuggestions}`,
    `That's an interesting topic, but I'm your dedicated cooking assistant. Let's focus on creating something delicious! ${contextualSuggestions}`,
    `I understand you're curious about "${originalMessage.substring(0, 30)}${originalMessage.length > 30 ? '...' : ''}", but I'm here to help with recipes, cooking techniques, and food-related questions. ${contextualSuggestions}`,
    `While that's outside my cooking expertise, I'm excellent at helping with culinary topics! ${contextualSuggestions}`,
    `I'm focused on all things cooking and food-related. Let me help you create something amazing in the kitchen! ${contextualSuggestions}`,
    `That's not my specialty area, but I'm passionate about cooking and would love to help with recipes! ${contextualSuggestions}`,
    `I'm your cooking companion, so let's channel that energy into creating something delicious! ${contextualSuggestions}`,
    `That's outside my culinary scope, but I'm great at recipe suggestions and cooking advice! ${contextualSuggestions}`,
    `I'm here specifically for cooking and food topics. Let's explore some recipes instead! ${contextualSuggestions}`,
    `Let me redirect to something I'm really good at - helping you cook amazing dishes! ${contextualSuggestions}`
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
    content: "You are CookMate, a comprehensive AI cooking assistant with extensive culinary knowledge. You can help with a wide range of cooking-related tasks:\n\n**CORE CAPABILITIES:**\n\n1. **Celebrity Chefs & Cooking Personalities**: You know about famous chefs like Gordon Ramsay, Julia Child, Anthony Bourdain, Ina Garten, Bobby Flay, Giada De Laurentiis, Jamie Oliver, Nigella Lawson, Martha Stewart, Wolfgang Puck, and many others. Share interesting facts about their cooking styles, signature dishes, and contributions to cuisine.\n\n2. **Recipe Details**: When asked for a recipe, always provide:\n   - Complete ingredient list with measurements\n   - Step-by-step cooking instructions\n   - Cooking time, prep time, and servings\n   - Difficulty level\n   - Tips and variations\n\n3. **Ingredient-Based Suggestions**: When users list ingredients, suggest delicious recipes using those ingredients. Be creative and practical.\n\n4. **Health & Nutrition**: Provide information about the nutritional benefits of foods, cooking methods, and ingredient combinations. Include vitamins, minerals, and health benefits.\n\n5. **Safety Guidelines**: Always include food safety information when relevant:\n   - Proper cooking temperatures\n   - Food storage guidelines\n   - Handling raw meats safely\n   - Cross-contamination prevention\n   - Proper hygiene practices\n\n6. **About Yourself**: When asked \"Who are you?\" explain that you are CookMate, an AI cooking assistant created by John Mark P. Magdasal and John Paul Mahilom. You were built to help people cook better by providing recipes, cooking advice, and culinary guidance.\n\n**IMPORTANT FORMATTING:** When you provide recipes, format them as:\n\n**Recipe Name**\n\n1. **Ingredients**:\n   - 1 cup ingredient\n   - 2 tbsp ingredient\n\n2. **Instructions**:\n   - Step 1 description\n   - Step 2 description\n\n3. **Nutrition & Benefits**: [Brief health information]\n4. **Safety Tips**: [Relevant safety guidelines]\n\nAlways be informative, helpful, and safety-conscious. Keep responses conversational and engaging, like a knowledgeable friend who loves cooking and cares about your well-being."
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
      max_tokens: 4096, // High token limit for complete responses ( model's maximum)
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
  
  console.log('[DEBUG] AI Response Length:', aiResponse ? aiResponse.length : 'null');
  console.log('[DEBUG] AI Response Preview:', aiResponse ? aiResponse.substring(0, 200) + '...' : 'null');
  
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
    
    // Check for developer questions first (highest priority)
    if (isDeveloperQuestion(message)) {
      const developerReply = getDeveloperResponse();
      
      return res.status(200).json({
        response: {
          message: developerReply,
          timestamp: new Date().toISOString(),
          userId: req.userId,
          isDeveloperResponse: true,
          redirectToCooking: false
        }
      });
    }
    
    // Check for identity questions second (before off-topic check)
    if (isIdentityQuestion(message)) {
      const identityReply = getIdentityResponse();
      
      return res.status(200).json({
        response: {
          message: identityReply,
          timestamp: new Date().toISOString(),
          userId: req.userId,
          isIdentityResponse: true,
          redirectToCooking: false
        }
      });
    }
    
    // Check for off-topic content only after checking legitimate cooking questions
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
    console.log('🍳 [CHAT] Generating AI response for message:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));
    const aiReply = await callGroqAI(message, history);
    console.log('🍳 [CHAT] AI response generated, length:', aiReply.length);
    
    // Extract recipes from the AI response
    console.log('🍳 [CHAT] Starting recipe extraction...');
    const detectedRecipes = extractRecipesFromResponse(aiReply);
    console.log('🍳 [CHAT] Recipe extraction completed. Found', detectedRecipes.length, 'recipes:', detectedRecipes);
    
    // Store detected recipes for consistency
    if (detectedRecipes.length > 0) {
      try {
        await Promise.all(detectedRecipes.map(recipeName => 
          storeDetectedRecipe(recipeName, req.userId)
        ));
        console.log('✅ Stored detected recipes:', detectedRecipes);
      } catch (storeError) {
        console.warn('⚠️ Failed to store some detected recipes:', storeError);
        // Continue without storing - don't block the response
      }
    } else {
      console.log('⚠️ [CHAT] No recipes detected - this may be the source of the bug!');
      console.log('⚠️ [CHAT] This is what the AI response looked like:');
      console.log('⚠️ [CHAT] Response preview:', aiReply.substring(0, 500) + (aiReply.length > 500 ? '...' : ''));
    }
    
    console.log('🍳 [CHAT] Full AI Response (for debugging):');
    console.log(aiReply);
    console.log('🍳 [CHAT] Extracted recipes:', detectedRecipes);
    console.log('🍳 [CHAT] Number of recipes found:', detectedRecipes.length);
    
    res.status(200).json({
      response: {
        message: aiReply,
        timestamp: new Date().toISOString(),
        detectedIngredients: extractIngredients(message),
        detectedRecipes: detectedRecipes,
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
    
    // Save recipe to Firestore if user is authenticated
    let savedRecipeId = null;
    if (req.userId && req.userId !== 'anonymous') {
      try {
        savedRecipeId = await saveRecipeToFirestore(recipeData, req.userId);
        recipeData.savedId = savedRecipeId;
      } catch (saveError) {
        console.warn('Failed to save recipe to favorites:', saveError);
        // Continue without saving - don't block the response
      }
    }
    
    res.status(200).json({
      message: 'Recipe generation successful',
      recipe: recipeData,
      savedRecipeId: savedRecipeId,
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

// RECIPE DETAILS ENDPOINT - Generate full recipe details on demand
router.post('/recipe-details', verifyAuthToken, async (req, res) => {
  try {
    const { recipeName } = req.body;
    
    if (!recipeName || typeof recipeName !== 'string') {
      return res.status(400).json({ error: 'Recipe name is required' });
    }
    
    // STEP 1: Skip cache for now to always get fresh AI-generated data
    // This ensures users always get full recipe details, not placeholder text
    console.log('🔄 Always generating fresh recipe details for:', recipeName);

    // STEP 2: If no stored data found, generate new recipe details
    console.log('🔄 No stored recipe found, generating new details for:', recipeName);
    
    // Create a detailed prompt for recipe details generation
    const detailPrompt = `Create detailed recipe information for "${recipeName}". Please provide the recipe in this exact JSON format:
{
  "title": "${recipeName}",
  "description": "Brief appetizing description of the dish",
  "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
  "instructions": ["Step 1 description", "Step 2 description", "Step 3 description"],
  "cookingTime": "e.g. 30 minutes",
  "servings": "e.g. 4",
  "difficulty": "Easy/Medium/Hard",
  "estimatedCost": "e.g. $10-15",
  "nutritionInfo": {
    "calories": "per serving",
    "protein": "grams",
    "carbs": "grams",
    "fat": "grams"
  },
  "tips": ["Helpful cooking tip 1", "Cooking tip 2"],
  "youtubeSearchQuery": "${recipeName} recipe tutorial"
}

Only return the JSON, no additional text. Make sure the recipe is practical and detailed.`;

    // Generate recipe details using Groq
    const aiResponse = await callGroqAI(detailPrompt);
    
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
      console.error('Failed to parse AI recipe details response:', parseError);
      // Fallback to basic recipe structure
      recipeData = {
        title: recipeName,
        description: `A delicious ${recipeName} recipe`,
        ingredients: ["Please refer to the main description for ingredients"],
        instructions: aiResponse.split('\n').filter(line => line.trim() && !line.includes('JSON')),
        cookingTime: "Varies",
        servings: "4",
        difficulty: "Medium",
        estimatedCost: "Moderate",
        nutritionInfo: {
          calories: "Varies",
          protein: "Varies",
          carbs: "Varies", 
          fat: "Varies"
        },
        tips: ["Cook until golden brown", "Taste and adjust seasoning"],
        youtubeSearchQuery: `${recipeName} recipe tutorial`
      };
    }
    
    // Generate YouTube search URL
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipeData.youtubeSearchQuery)}`;
    
    // Add the YouTube URL to the recipe data
    recipeData.youtubeUrl = youtubeUrl;
    
    // Cache the generated recipe for consistency
    recipeCache.set(recipeName, recipeData);
    console.log('✅ Recipe cached for consistency:', recipeName);
    
    // Save recipe to Firestore if user is authenticated
    let savedRecipeId = null;
    if (req.userId && req.userId !== 'anonymous') {
      try {
        savedRecipeId = await saveRecipeToFirestore(recipeData, req.userId);
        recipeData.savedId = savedRecipeId;
      } catch (saveError) {
        console.warn('Failed to save recipe to favorites:', saveError);
        // Continue without saving - don't block the response
      }
    }
    
    res.status(200).json({
      message: 'Recipe details generated successfully',
      recipe: recipeData,
      savedRecipeId: savedRecipeId,
      userId: req.userId
    });
    
  } catch (error) {
    console.error('Recipe details generation error:', error);
    
    if (error.message.includes('GROQ_API_KEY')) {
      return res.status(500).json({
        error: 'API_KEY_REQUIRED',
        message: 'Groq API key is required for recipe details generation. Please get a free API key from https://console.groq.com/'
      });
    }
    
    res.status(500).json({
      error: 'RECIPE_DETAILS_GENERATION_FAILED',
      message: "I'm having trouble generating the recipe details. Please try again.",
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
