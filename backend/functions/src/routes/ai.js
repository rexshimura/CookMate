const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// In-memory cache for recipe consistency during development
const recipeCache = new Map();

// Helper function to generate consistent recipe ID
function generateConsistentRecipeId(recipeName) {
  if (!recipeName) return '';
  return recipeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '_')  // Replace special chars with _
    .replace(/\s+/g, '_')          // Replace spaces with _
    .replace(/_+/g, '_')           // Remove duplicate _
    .replace(/^_|_$/g, '')         // Trim leading/trailing _
    .substring(0, 50);
}

// Helper function to save recipe to Firestore
async function saveRecipeToFirestore(recipeData, userId = 'anonymous') {
  try {
    // Generate a clean recipe ID from title
    const recipeId = generateConsistentRecipeId(recipeData.title);

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
async function storeDetectedRecipe(recipeInput, userId = 'anonymous') {
  try {
    // SAFEGUARD: Handle both Object and String inputs
    const recipeTitle = typeof recipeInput === 'string' ? recipeInput : recipeInput?.title;
    
    if (!recipeTitle) {
      console.warn('⚠️ Skipping storage: Missing title');
      return null;
    }

    const recipeId = generateConsistentRecipeId(recipeTitle);
    
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
        title: recipeTitle,
        description: `A delicious ${recipeTitle} recipe to try`,
        ingredients: ["Click on the recipe card to get detailed ingredients"],
        instructions: ["Click on the recipe card to get detailed instructions"],
        cookingTime: "Varies",
        servings: recipeInput?.servings || "4",
        difficulty: recipeInput?.difficulty || "Medium",
        estimatedCost: "Moderate",
        nutritionInfo: {
          calories: "Varies",
          protein: "Varies",
          carbs: "Varies",
          fat: "Varies"
        },
        tips: ["Click on the recipe to get detailed cooking tips"],
        youtubeSearchQuery: `${recipeTitle} recipe tutorial`,
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
    
    // STEP 1: Check in-memory cache first
    if (recipeCache.has(recipeName)) {
      const cached = recipeCache.get(recipeName);
      // Validation: Don't return cache if it's just a placeholder
      if (cached.ingredients && cached.ingredients.length > 0 && !cached.ingredients[0].includes('Click on the recipe')) {
        console.log('✅ Found full recipe in memory cache:', recipeName);
        return cached;
      }
    }
    
    // STEP 2: Check MAIN recipes collection (Full Details) - PRIORITY!
    try {
      const mainRecipe = await db.collection('recipes').doc(recipeId).get();
      if (mainRecipe.exists) {
        console.log('✅ Found full recipe in main collection:', recipeId);
        return mainRecipe.data();
      }
      
      // Fallback: Try query if ID match failed
      const allRecipesSnapshot = await db.collection('recipes')
        .where('title', '==', recipeName)
        .limit(1)
        .get();
        
      if (!allRecipesSnapshot.empty) {
        console.log('✅ Found full recipe via query:', allRecipesSnapshot.docs[0].id);
        return allRecipesSnapshot.docs[0].data();
      }
    } catch (mainError) {
      console.log('⚠️ Main recipes check failed:', mainError.message);
    }

    // STEP 3: Check detected recipes (Placeholders) - LAST RESORT
    // Only use this if we really have nothing else, but notify caller it might be incomplete
    try {
      const detectedRecipe = await db.collection('detectedRecipes').doc(recipeId).get();
      if (detectedRecipe.exists) {
        const data = detectedRecipe.data();
        // Only return if it actually has real data, otherwise return null to force AI generation
        if (data.ingredients && data.ingredients.length > 0 && !data.ingredients[0].includes('Click on the recipe')) {
           console.log('✅ Found valid detected recipe:', recipeId);
           return data;
        }
        console.log('⚠️ Found placeholder in detectedRecipes, ignoring to force generation:', recipeId);
      }
    } catch (detectedError) {
      console.log('⚠️ Detected recipes check failed:', detectedError.message);
    }

    console.log('❌ No valid stored recipe found for:', recipeName);
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
    
    // For real Firebase authentication
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

// Simplified and improved recipe extraction function
function extractRecipesFromResponse(response) {
  const recipes = [];
  const uniqueRecipes = new Set(); // Prevent duplicates
  

  
  // Helper function to clean and validate recipe names
  const cleanRecipeName = (name) => {
    return name
      .trim()
      .replace(/^\d+\.\s*/, '') // Remove "1. "
      .replace(/^\d+\)\s*/, '') // Remove "1) "
      .replace(/^recipe\s*:?\s*/i, '') // Remove "Recipe: "
      .replace(/^recipe\s+name\s*:?\s*/i, '') // Remove "Recipe Name: "
      .replace(/^name\s*:?\s*/i, '') // Remove "Name: "
      .replace(/^dish\s*:?\s*/i, '') // Remove "Dish: "
      .replace(/^food\s*:?\s*/i, '') // Remove "Food: "
      .replace(/^meal\s*:?\s*/i, '') // Remove "Meal: "
      .replace(/^try\s*:?\s*/i, '') // Remove "Try: "
      .replace(/^make\s*:?\s*/i, '') // Remove "Make: "
      .replace(/^here\'?s\s*:?\s*/i, '') // Remove "Here's: "
      .replace(/^here\'s\s*:?\s*/i, '') // Remove "Here's: "
      .replace(/^ingredients?\s*:?\s*/i, '') // Remove "Ingredient: "
      .replace(/^instructions?\s*:?\s*/i, '') // Remove "Instructions: "
      .replace(/^\*\*/, '') // Remove leading **
      .replace(/\*\*$/, '') // Remove trailing **
      .replace(/^"(.*)"$/, '$1') // Remove surrounding quotes
      .replace(/^'(.*)'$/, '$1') // Remove surrounding single quotes
      .replace(/^menu\s*:?\s*/i, '') // Remove "Menu: "
      .replace(/^special\s*:?\s*/i, '') // Remove "Special: "
      .replace(/^signature\s*:?\s*/i, '') // Remove "Signature: "
      .trim();
  };
  
  // Helper function to add recipe if valid and unique
  const addRecipe = (recipeName, source = 'unknown') => {
    const cleaned = cleanRecipeName(recipeName);
    
    if (!cleaned || cleaned.length < 3 || cleaned.length > 80 || uniqueRecipes.has(cleaned.toLowerCase())) {
      return false;
    }
    
    const validationResult = isValidRecipe(cleaned);
    
    if (validationResult) {
      recipes.push(cleaned);
      uniqueRecipes.add(cleaned.toLowerCase());
      return true;
    }
    return false;
  };
  
  // IMPROVED PATTERN 1: Bold recipe names with better cleaning
  const boldPattern = /\*\*(.*?)\*\*/g;
  let match;
  const boldMatches = [];
  
  while ((match = boldPattern.exec(response)) !== null) {
    const boldText = match[1].trim();
    
    // Skip if it's clearly not a recipe name
    if (/^(ingredients?|instructions?|directions?|steps?|method|tips?|nutrition|safety|difficulty|servings|time|cook|prep)/i.test(boldText)) {
      continue;
    }
    
    // Only keep if it looks like a recipe name
    if (boldText.length >= 3 && /^[A-Za-z]/.test(boldText) && !/\d\./.test(boldText)) {
      boldMatches.push(boldText);
    }
  }
  
  // Test each bold match
  boldMatches.forEach(boldText => {
    addRecipe(boldText, 'bold_text');
  });
  
  // IMPROVED PATTERN 2: Look for recipe names in numbered lists (more selective)
  // Only match patterns that look like recipe titles, not cooking instructions
  const recipeTitlePattern = /^\s*(?:\d+[.)]|\d+\s+)\s*([A-Z][^.!?\n\r]{5,80})(?:\.|$)/gm;
  while ((match = recipeTitlePattern.exec(response)) !== null) {
    const candidate = match[1].trim();
    
    // Skip if it starts with cooking instruction words
    if (/^(cook|bake|fry|mix|stir|add|heat|preheat|drain|rinse|pat|trim|peel|core|seed|marinate|chill|freeze|cover|uncover|brush|season|serve|whisk|beat|chop|dice|slice|cut|mince|crush|mash|blend|simmer|boil|saute|grill|roast|caramelize|baste|glaze|toss|massage|in|on|over|under|at|to|for|with|let|allow|keep|pour|combine|whisk|beat|chop|dice|slice|cut|mince|crush|mash|blend|place|put|transfer)\b/i.test(candidate)) {
      continue;
    }
    
    // Skip if it's a section header
    if (/^(ingredients?|instructions?|directions?|steps?|method|tips?|nutrition|safety|difficulty|servings|time|cook|prep)/i.test(candidate)) {
      continue;
    }
    
    // Skip if it contains cooking instruction phrases
    if (/\b(in\s+a|in\s+the|on\s+medium|over\s+medium|until|for\s+\d+|minutes?|hours?|according to|package instructions|al dente|tender|golden|cooked|done)\b/i.test(candidate.toLowerCase())) {
      continue;
    }
    
    addRecipe(candidate, 'numbered_list');
  }
  
  // IMPROVED PATTERN 3: Recipe titles with common prefixes
  const titlePattern = /^(?:recipe\s*:?\s*|recipe\s+name\s*:?\s*|dish\s*:?\s*|try\s*:?\s*|make\s*:?\s*|here\'?s\s*:?\s*|here\'s\s*:?\s*)([A-Z][^.!?\n\r]{5,80})/gim;
  while ((match = titlePattern.exec(response)) !== null) {
    const recipeName = match[1].trim();
    addRecipe(recipeName, 'titled_recipe');
  }
  
  // IMPROVED PATTERN 4: Headers (## Recipe Name) - more selective
  const headerPattern = /^#{1,3}\s*(.+)$/gm;
  while ((match = headerPattern.exec(response)) !== null) {
    const header = match[1].trim();
    // Only use if it looks like a recipe (not section headers)
    if (!/^(ingredients?|instructions?|directions?|steps?|method|tips?|nutrition|safety|difficulty|servings|time|cook|prep)/i.test(header) && 
        header.length > 3 && header.length < 80) {
      addRecipe(header, 'header');
    }
  }
  
  // IMPROVED FALLBACK: More intelligent line analysis
  if (recipes.length === 0) {
    const lines = response.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and obvious non-recipe content
      if (!trimmed || 
          trimmed.length < 5 || 
          trimmed.length > 80 ||
          /^(ingredients?|instructions?|directions?|steps?|method|tips?|nutrition|safety|serves?|prep|cook|time|difficulty|brush|season|serve|preheat|transfer|pour|combine|whisk|beat|chop|dice|slice|cut|mince|drain|rinse|pat dry|trim|peel|core|seed|marinate|chill|freeze|cover|uncover|both sides|all sides|to taste|as needed|optional|until|when|while|then|next|serve with|garnish with|top with|sprinkle with|dripping|tender|cooked through|juicy|flaky|golden brown|on both sides|on all sides|until cooked|until tender|until golden|cup|cups|tablespoon|teaspoon|pound|ounce|minutes|hours|degrees)/i.test(trimmed)) {
        continue;
      }
      
      // Must be proper sentence case
      if (!/^[A-Z][a-z]/.test(trimmed) || /^[A-Z\s\d]+$/.test(trimmed)) {
        continue;
      }
      
      // Skip lines that are clearly instructions (start with verbs)
      if (/^(cook|bake|fry|mix|stir|add|heat|preheat|drain|rinse|pat|trim|peel|core|seed|marinate|chill|freeze|cover|uncover|brush|season|serve|whisk|beat|chop|dice|slice|cut|mince|crush|mash|blend|simmer|boil|saute|grill|roast|caramelize|baste|glaze|toss|massage|place|put|transfer|pour|combine)/i.test(trimmed)) {
        continue;
      }
      
      // Check for strong recipe indicators
      const strongRecipeIndicators = /\b(chicken|beef|pork|fish|salmon|shrimp|tuna|cod|haddock|lamb|turkey|tofu|egg|eggs|rice|pasta|noodles|spaghetti|macaroni|bread|flour|oats|quinoa|potato|tomato|onion|garlic|pepper|bell pepper|carrot|celery|lettuce|spinach|kale|cucumber|mushroom|zucchini|eggplant|broccoli|cauliflower|green beans|peas|corn|cheese|mozzarella|parmesan|cheddar|milk|cream|butter|yogurt|sour cream|oil|olive oil|vegetable oil|canola oil|sesame oil|salt|pepper|garlic powder|onion powder|paprika|cumin|oregano|thyme|basil|rosemary|sugar|honey|maple syrup|brown sugar|lemon|lime|orange|apple|banana|berries|grapes|avocado|vanilla|almond|coconut|chocolate|cocoa|soup|stew|salad|sandwich|pizza|bread|cake|cookie|pancake|waffle|curry|taco|tacos|burrito|omelette|lasagna|risotto|muffin|brownie|pie|sauce|dressing|marinade|rub|spice|herb|seasoning|condiment|bbq|grilled|roasted|braised|stir-fry|fried|baked|sauteed|steamed|poached|smoked|marinated|glazed|caramelized|crispy|tender|juicy|spicy|sweet|sour|bitter|salty|umami|fresh|organic|local|seasonal|homemade|traditional|authentic|fusion|comfort|quick|easy|simple|complex|elegant|rustic|gourmet|restaurant-style|street-food|appetizer|entree|main|dessert|snack|breakfast|lunch|dinner|supper|brunch|side|starter|course|meal|dish|cuisine|flavor|style|method|technique|preparation|cooking|recipe|ingredient|champorado|adobo|sinigang|kare-kare|bistek|lechon|paksiw|crispy|kinilaw|ceviche|tartare|sushi|ramen|udon|tempura|teriyaki|yakitori|miso|poke|bento|kimchi|bibimbap|bulgogi|japchae|tteokbokki|pancit|lumpia|siopao|pad-thai|green-curry|massaman|khao-soi|som-tam|larb|nam-tok|pho|banh-mi|bun-cha|com-tam|goi-cuon|spring-roll|fresh-roll|satay|nasi-goreng|samosa|naan|tikka|masala|dal|biryani|pulao|rogan|butter-chicken|tandoori|moussaka|souvlaki|gyro|tzatziki|hummus|tabbouleh|falafel|paella|tapas|gazpacho|tortilla|frittata|pesto|bruschetta|minestrone|beef-wellington|fish-and-chips|shepherds-pie|bangers-and-mash|toad-in-the-hole|croque-monsieur|crepes|souffle|ratatouille|coq-au-vin|boeuf-bourguignon|pierogi|borscht|goulash|schnitzel|stroganoff|cabbage-rolls|tacos|enchiladas|quesadillas|pozole|mole|guacamole|salsa|carnitas|jambalaya|gumbo|crawfish|etouffee|red-beans-and-rice|po-boys|muffuletta)\b/i;
      
      if (strongRecipeIndicators.test(trimmed)) {
        addRecipe(trimmed, 'intelligent_fallback');
      }
    }
  }
  
  return recipes;
}

// Improved recipe validation function with better international support and less aggressive filtering
function isValidRecipe(text) {
  if (!text || typeof text !== 'string' || text.length < 3) return false;
  
  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();
  
  // 1. BLOCKLIST: Immediate rejection for known non-recipe phrases
  const blockTerms = [
    'instruction', 'direction', 'ingredient', 'step', 'method', 'tip', 'note',
    'click', 'view', 'read', 'here', 'link', 'website', 'youtube', 'video',
    'cook time', 'prep time', 'servings', 'calories', 'total time',
    'welcome', 'hello', 'hi', 'thank', 'sorry', 'goodbye',
    'crack', 'pour', 'mix', 'stir', 'heat', 'add', 'place', 'put', 'boil' // Verbs
  ];
  
  if (blockTerms.some(term => lowerText.startsWith(term) || lowerText === term)) {
    console.log(`❌ [VALIDATION] Rejected blocked term: "${cleanText}"`);
    return false;
  }

  // 2. COOKING VERB CHECK: If it starts with a verb, it's an instruction, not a title
  // e.g. "Bake for 20 mins" -> REJECT
  const cookingVerbs = /^(bake|boil|fry|roast|grill|steam|poach|simmer|saute|chop|slice|dice|mince|peel|cut|wash|dry|serve|garnish|sprinkle|cover|let|allow|wait|remove|turn|flip|blend|process|whisk|beat|marinate|season|taste|adjust)/i;
  
  if (cookingVerbs.test(cleanText)) {
    console.log(`❌ [VALIDATION] Rejected instruction starting with verb: "${cleanText}"`);
    return false;
  }

  // 3. ALLOWLIST: It MUST contain at least one food-related keyword
  // This is the "Strict" part. If it doesn't mention food, it's not a recipe card.
  const foodKeywords = new RegExp(
    '\\b(' +
    // Enhanced food keywords - more comprehensive coverage
    'chicken|beef|pork|lamb|steak|turkey|duck|fish|salmon|tuna|cod|shrimp|prawn|crab|lobster|tofu|tempeh|egg|eggs|bacon|sausage|ham|meatball|burger|wings|thighs|breast|ribs|roast|calamari|scallops|mussels|clams|oyster|sardines|anchovies|pepperoni|salami|chorizo|prosciutto|pancetta|spam|hotdog|corned beef|brisket|pulled pork|carnitas|carne asada|barbacoa|gyro|kebab|shawarma|falafel|seitan|lentils|beans|chickpeas|hummus|edamame|nuts|seeds|peanut|almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|pine nut|sunflower|pumpkin|sesame|chia|flax|hemp|quinoa|oats|barley|bulgur|farro|millet|rice|couscous|polenta|grits|pasta|noodle|spaghetti|macaroni|lasagna|ravioli|tortellini|gnocchi|dumpling|wonton|spring roll|egg roll|samosa|empanada|taco|burrito|quesadilla|enchilada|nachos|fajitas|tostada|tamale|pupusa|arepa|tortilla|pita|naan|roti|chapati|paratha|dosa|idli|bagel|croissant|biscuit|scone|muffin|bread|toast|pancake|waffle|crepe|french toast|cereal|atmeal|porridge|yogurt|granola|cheese|milk|cream|butter|ice cream|gelato|sorbet|sherbet|custard|pudding|mousse|cake|pie|tart|cookie|brownie|blondie|cupcake|donut|doughnut|pastry|danish|baklava|tiramisu|cheesecake|fudge|truffle|candy|chocolate|caramel|toffee|marshmallow|meringue|macaron|souffle|parfait|trifle|cobbler|crisp|crumble|buckle|betty|pandowdy|slump|grunt|smoothie|shake|juice|tea|coffee|latte|cappuccino|mocha|cocoa|cider|lemonade|limeade|punch|cocktail|mocktail|beer|wine|sake|soju|spirit|liquor|liqueur|syrup|honey|jam|jelly|preserves|marmalade|chutney|relish|salsa|guacamole|pesto|hummus|tapenade|dip|sauce|dressing|gravy|marinade|rub|spice|herb|salt|pepper|vinegar|oil|broth|stock|soup|stew|chili|curry|chowder|bisque|gumbo|jambalaya|etouffee|bouillabaisse|cioppino|gazpacho|vichyssoise|borscht|miso|ramen|pho|udon|soba|laksa|pad thai|lo mein|chow mein|fried rice|risotto|paella|pilaf|biryani|jollof|stuffing|casserole|gratin|bake|roast|fry|grill|saute|stir-fry|scramble|poach|steam|boil|braise|stew|smoke|cure|pickle|ferment|salad|slaw|vegetable|fruit|berry|melon|citrus|apple|pear|peach|plum|apricot|cherry|grape|banana|plantain|pineapple|mango|papaya|kiwi|fig|date|raisin|cranberry|blueberry|raspberry|blackberry|strawberry|coconut|avocado|tomato|cucumber|pepper|chili|jalapeno|habanero|chipotle|paprika|cayenne|cumin|coriander|turmeric|ginger|garlic|onion|shallot|leek|scallion|chive|celery|carrot|parsnip|beet|radish|turnip|rutabaga|potato|yam|sweet potato|squash|zucchini|pumpkin|eggplant|okra|corn|peas|green bean|asparagus|broccoli|cauliflower|cabbage|kale|spinach|lettuce|arugula|chard|collard|mustard|cress|endive|radicchio|fennel|artichoke|mushroom|truffle|olive|caper|seaweed|nori|wakame|kombu|dulse|kelp|algae|spirulina|wheat|rye|barley|oat|corn|rice|millet|sorghum|teff|amaranth|buckwheat|quinoa|flour|meal|starch|gluten|yeast|baking powder|soda|sugar|sweetener|honey|syrup|molasses|agave|stevia|monk fruit|erythritol|xylitol|sorbitol|mannitol|isomalt|lactitol|maltitol|recipe|dish|meal|cooking|food|kitchen|chef|restaurant|kitchen|cook|bake|prepare|serve|garnish|flavor|ingredient|cuisine|style|method|technique|preparation|adobo|sinigang|kare-kare|tinola|nilaga|paksiw|pinakbet|chopsuey|sisig|lechon|lumpia|pancit|palabok|menudo|afritada|caldereta|mechado|bistek|picadillo|arroz caldo|goto|lugaw|champorado|bibingka|puto|kutsinta|sapin-sapin|halo-halo|turon|banana cue|ginataang|laing|pinangat|bicol express|kinilaw|kilawin|bulalo|batchoy|mami|lomi|sotanghon|misua'
    + ')\\b',
    'i'
  );

  const hasFoodKeyword = foodKeywords.test(lowerText);
  
  if (!hasFoodKeyword) {
    console.log(`❌ [VALIDATION] Rejected (No Food Keyword): "${cleanText}"`);
    return false;
  }

  console.log(`✅ [VALIDATION] Accepted: "${cleanText}"`);
  return true;
}

// Test function to validate "Korean-Style BBQ Beef Tacos"
function testRecipeValidation() {
  const testRecipe = "Korean-Style BBQ Beef Tacos";
  const result = isValidRecipe(testRecipe);
  return result;
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
    content: `You are CookMate, a comprehensive AI cooking assistant. Your primary goal is to provide a helpful and engaging conversational experience about cooking, while also extracting key recipe information in a structured format.

**Conversational Response:**
First, provide a friendly, conversational response to the user's query. This should be natural and helpful, as if you were talking to a friend about cooking.

**Structured JSON Output:**
After the conversational text, you MUST include a structured JSON object. This JSON object should be enclosed in \`\`\`json code blocks. The JSON should contain a single key, "recipes," which is an array of recipe objects. For each recipe mentioned or implied in the user's request, create a JSON object with the following fields:

- "title": The name of the recipe (e.g., "Chicken Adobo").
- "servings": The number of servings as a string (e.g., "4-6").
- "difficulty": The difficulty level (e.g., "Easy", "Medium", "Hard").

**CRITICAL:** The \`\`\`json block MUST be the VERY LAST part of your response. There should be no text or characters after the closing \`\`\` of the JSON block.

**Example Interaction:**

User: "I'm thinking of making some adobo and maybe some sinigang."

Your Response:
That's a great idea! Both are classic Filipino dishes. Adobo is a savory, vinegar-based stew, while Sinigang is a sour and savory soup. Do you have a preference for which one you'd like to make?

\`\`\`json
{
  "recipes": [
    {
      "title": "Chicken Adobo",
      "servings": "4",
      "difficulty": "Easy"
    },
    {
      "title": "Pork Sinigang",
      "servings": "6",
      "difficulty": "Medium"
    }
  ]
}

**NON-FOOD QUERIES:**
If the user asks for something that is NOT a food item (e.g., "Swimming Pool", "Cement", "Chair"), you MUST return an empty recipes array in the JSON: { "recipes": [] }. Do NOT invent recipes for non-food items.
\`\`\``
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
          redirectToCooking: false,
          detectedRecipes: [] // Explicitly empty to prevent client-side detection
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
          redirectToCooking: false,
          detectedRecipes: [] // Explicitly empty to prevent client-side detection
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
          redirectToCooking: true,
          detectedRecipes: [] // Explicitly empty to prevent client-side detection
        }
      });
    }
    
    // Generate AI response using Groq with fallback handling
    
    let aiReply;
    let detectedRecipes = [];
    
    try {
      const fullResponse = await callGroqAI(message, history);
      
      // 1. EXTRACT FIRST (Before cleaning) - WITH VALIDATION
      let jsonExtractionSuccess = false;
      const jsonMatch = fullResponse.match(/```json([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.recipes) {
            // VALIDATE each recipe title before adding to detectedRecipes
            const validRecipeTitles = parsed.recipes
              .map(r => r.title || r.name)
              .filter(title => title && isValidRecipe(title));
            detectedRecipes = validRecipeTitles;
            jsonExtractionSuccess = true; // Mark that we got valid JSON (even if empty)
          }
        } catch (e) {
          console.error('JSON Parse Error', e);
          jsonExtractionSuccess = false;
        }
      }

      // 2. CLEANUP SECOND
      aiReply = fullResponse.replace(/```json[\s\S]*?```/g, '').trim();
      if (!aiReply) aiReply = "I found some recipes! Check below.";

      // 3. Fallback Detection (ONLY if JSON extraction failed completely)
      // CRITICAL FIX: If we got valid JSON (even if empty), STOP here - don't run dangerous fallback
      if (!jsonExtractionSuccess) {
        detectedRecipes = extractRecipesFromResponse(fullResponse);
      }

      // 4. Store Data
      if (detectedRecipes.length > 0) {
         await Promise.allSettled(detectedRecipes.map(r => storeDetectedRecipe(r, req.userId)));
      }

    } catch (aiError) {
      console.error('AI service failed, using fallback response:', aiError.message);
      
      // Create a helpful fallback response based on the message content
      const ingredientList = extractIngredients(message);
      
      if (ingredientList.length > 0) {
        aiReply = `I'm having trouble connecting to my AI brain right now, but I can still help you cook! 🌟

Based on what you mentioned (${ingredientList.join(', ')}), here are some cooking ideas:
• Try combining your ingredients in a simple stir-fry
• Make a hearty soup or stew 
• Create a fresh salad with protein
• Grill or roast for flavorful results

**Some delicious recipes to try:**
• **Quick Stir-Fry** - Combine your ingredients with oil, garlic, and your favorite seasonings
• **Simple Soup** - Start with a base of broth, add your ingredients, and simmer until tender
• **Grilled Delight** - Season and grill your main ingredient with vegetables

I'm experiencing technical difficulties at the moment, but I'll be back to full strength soon! In the meantime, feel free to ask me about cooking techniques, food safety, or ingredient substitutions.`;
      } else {
        aiReply = `I'm having trouble connecting to my brain right now. 🌟 

But I'm still here to help! Try asking me about:
• What ingredients you have available
• Cooking techniques and methods
• Food safety and storage tips
• Recipe substitutions
• Kitchen equipment recommendations

I should be back to full AI functionality shortly. Thanks for your patience! 🍳`;
      }
    }
    
    // Extract recipes from AI response for consistency (if not already detected)
    if (detectedRecipes.length === 0) {
      detectedRecipes = extractRecipesFromResponse(aiReply);
    }
      
      // 5. Send Response (Ensuring detectedRecipes is included!)
      res.status(200).json({
        response: {
          message: aiReply,
          timestamp: new Date().toISOString(),
          detectedIngredients: extractIngredients(message),
          detectedRecipes: detectedRecipes, // <--- IMPORTANT
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
    
    recipePrompt += `. IMPORTANT: Return ONLY valid JSON. Do not add markdown formatting like \`\`\`json. Just the raw JSON string.

Please provide the recipe in this JSON format:
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
    
    // Parse JSON response from AI with improved error handling
    let recipeData;
    try {
      // Clean up markdown code blocks if they exist
      const cleanedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        recipeData = JSON.parse(jsonString);
      } else {
        throw new Error('No JSON brackets found');
      }
    } catch (parseError) {
      console.error("JSON Parse Failed. Raw AI response:", aiResponse);
      // Fallback to basic recipe structure
      recipeData = {
        title: "AI Generated Recipe",
        ingredients: ingredients || ["Please specify ingredients"],
        instructions: aiResponse.split('\n').filter(line => line.trim()),
        cookingTime: "30-45 minutes", // More specific than "Varies"
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
    
    // 1. CHECK CACHE FIRST: Don't call AI if we already have the recipe
    try {
      const cachedRecipe = await getStoredRecipe(recipeName);
      
      // VALIDATION: Ensure it's a real recipe, not a placeholder
      if (cachedRecipe && 
          cachedRecipe.ingredients && 
          cachedRecipe.ingredients.length > 0 && 
          !cachedRecipe.ingredients[0].includes("Click on the recipe")) {
            
        console.log('✅ Serving recipe from cache:', recipeName);
        return res.status(200).json({
          message: 'Recipe retrieved from cache',
          recipe: cachedRecipe,
          savedRecipeId: cachedRecipe.id,
          userId: req.userId
        });
      }
    } catch (cacheError) {
      console.warn('Cache check failed, proceeding to generation:', cacheError);
    }
    
    // STEP 2: If no stored data found, generate new recipe details
    
    // Create a detailed prompt for recipe details generation
    const detailPrompt = `Create detailed recipe information for "${recipeName}". IMPORTANT: Return ONLY valid JSON. Do not add markdown formatting like \`\`\`json. Just the raw JSON string.

Please provide the recipe in this exact JSON format:
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
    
    // Parse JSON response from AI with improved error handling
    let recipeData;
    try {
      // Clean up markdown code blocks if they exist
      const cleanedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Try multiple parsing strategies
      let jsonString = '';
      let jsonStart = cleanedResponse.indexOf('{');
      let jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        recipeData = JSON.parse(jsonString);
      } else {
        throw new Error('No valid JSON structure found in response');
      }
      
      // Validate essential fields
      if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
        throw new Error('Missing essential recipe fields in parsed JSON');
      }
      
      // Ensure ingredients and instructions are arrays
      if (!Array.isArray(recipeData.ingredients)) {
        recipeData.ingredients = [recipeData.ingredients].filter(Boolean);
      }
      if (!Array.isArray(recipeData.instructions)) {
        recipeData.instructions = [recipeData.instructions].filter(Boolean);
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI recipe details response:', parseError);
      
      // Intelligent fallback: try to extract structured data from text
      try {
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const ingredients = [];
        const instructions = [];
        let currentSection = '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          // Detect sections
          if (/^ingredients?\s*:?/i.test(trimmed)) {
            currentSection = 'ingredients';
            continue;
          } else if (/^instructions?\s*:?|^directions?\s*:?|^steps?\s*:?/i.test(trimmed)) {
            currentSection = 'instructions';
            continue;
          }
          
          // Extract bullet points or numbered items
          if (currentSection === 'ingredients' && /^[•\-\*]|\d+\./.test(trimmed)) {
            const ingredient = trimmed.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '');
            if (ingredient.length > 0) ingredients.push(ingredient);
          } else if (currentSection === 'instructions' && (/^\d+\./.test(trimmed) || /^[•\-\*]/.test(trimmed))) {
            const instruction = trimmed.replace(/^\d+\.\s*/, '').replace(/^[•\-\*]\s*/, '');
            if (instruction.length > 0) instructions.push(instruction);
          }
        }
        
        // If we found structured data, use it
        if (ingredients.length > 0 && instructions.length > 0) {
          recipeData = {
            title: recipeName,
            description: `A delicious ${recipeName} recipe made with fresh ingredients`,
            ingredients: ingredients,
            instructions: instructions,
            cookingTime: "30-45 minutes",
            servings: "4",
            difficulty: "Medium",
            estimatedCost: "$10-15",
            nutritionInfo: {
              calories: "350-450 per serving",
              protein: "20-30 grams",
              carbs: "30-40 grams", 
              fat: "15-25 grams"
            },
            tips: ["Use fresh ingredients for best results", "Taste and adjust seasoning as needed"],
            youtubeSearchQuery: `${recipeName} recipe tutorial`
          };
        } else {
          throw new Error('Could not extract structured data from text fallback');
        }
        
      } catch (fallbackError) {
        console.error('Text fallback also failed:', fallbackError);
        // Final fallback with safe, minimal data
        recipeData = {
          title: recipeName,
          description: `A delicious ${recipeName} recipe. Click on the recipe card to get detailed ingredients and instructions.`,
          ingredients: ["Please click on the recipe card to get detailed ingredients"],
          instructions: ["Please click on the recipe card to get detailed cooking instructions"],
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
          tips: ["Use fresh ingredients", "Cook to proper temperature", "Taste and adjust seasoning"],
          youtubeSearchQuery: `${recipeName} recipe tutorial`
        };
      }
    }
    
    // Generate YouTube search URL
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipeData.youtubeSearchQuery)}`;
    
    // Add the YouTube URL to the recipe data
    recipeData.youtubeUrl = youtubeUrl;
    
    // Cache the generated recipe for consistency
    recipeCache.set(recipeName, recipeData);
    
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
          // Failed to parse AI suggestions, using fallback
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

// Export the recipe extraction function for testing
module.exports = router;
module.exports.extractRecipesFromResponse = extractRecipesFromResponse;
module.exports.isValidRecipe = isValidRecipe;
