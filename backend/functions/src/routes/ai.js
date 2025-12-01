const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// 1. API Key: Use env var or fallback for testing
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY || "hf_test_key_replace_in_production";

// 2. Multiple model endpoints for reliability
const HF_MODELS = [
  {
    name: "Zephyr 7B Beta",
    url: "https://router.huggingface.co/HuggingFaceH4/zephyr-7b-beta",
    apiUrl: "https://router.huggingface.co/HuggingFaceH4/zephyr-7b-beta"
  },
  {
    name: "Mistral 7B Instruct", 
    url: "https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.1",
    apiUrl: "https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.1"
  },
  {
    name: "Phi-2",
    url: "https://router.huggingface.co/microsoft/phi-2",
    apiUrl: "https://router.huggingface.co/microsoft/phi-2"
  }
];

// Test which models are working
let workingModelIndex = 0;

console.log("--- AI SERVICE INITIALIZED ---");
console.log("Available Models:", HF_MODELS.map(m => m.name));
console.log("API Key Status:", HF_API_KEY && HF_API_KEY !== "hf_test_key_replace_in_production" ? "Present" : "TEST MODE");

// Helper function to call Hugging Face with multiple model fallbacks
async function callHuggingFace(prompt) {
  // If no API key, use mock response for testing
  if (!HF_API_KEY || HF_API_KEY === "hf_test_key_replace_in_production") {
    console.log("🔧 Using mock response (no API key)");
    return generateMockResponse(prompt);
  }

  // Try each model until one works
  for (let i = 0; i < HF_MODELS.length; i++) {
    const modelIndex = (workingModelIndex + i) % HF_MODELS.length;
    const model = HF_MODELS[modelIndex];
    
    try {
      console.log(`🤖 Trying model: ${model.name}`);
      
      const response = await axios.post(
        model.apiUrl,
        { 
          inputs: prompt, 
          parameters: { 
            max_new_tokens: 1024,
            temperature: 0.7,
            return_full_text: false,
            do_sample: true,
            top_p: 0.95
          } 
        },
        { 
          headers: { 
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      if (response.data && response.data.length > 0) {
        const generatedText = response.data[0].generated_text?.trim() || response.data[0].generatedText?.trim();
        
        if (generatedText) {
          workingModelIndex = modelIndex; // Update working model
          console.log(`✅ Success with model: ${model.name}`);
          
          // Clean up common AI response artifacts
          return generatedText
            .replace(/^[\s\n]*(Assistant|CookMate):\s*/i, '')
            .replace(/^(User| Human):\s*/gi, '')
            .replace(/^[\s\n]*Inst>[\s\n]*/gi, '')
            .trim();
        }
      }
    } catch (error) {
      console.warn(`⚠️ Model ${model.name} failed:`, error.response?.status, error.response?.data?.error || error.message);
      
      // If it's a 404 or 422, this model is likely not available, skip it
      if (error.response?.status === 404 || error.response?.status === 422) {
        console.log(`🚫 Skipping unavailable model: ${model.name}`);
        continue;
      }
      
      // For other errors, try the next model
      continue;
    }
  }
  
  // If all models failed, return a fallback response
  console.log("❌ All models failed, using fallback response");
  return generateMockResponse(prompt);
}

// Generate mock responses for testing when API is unavailable
function generateMockResponse(prompt) {
  console.log("🔧 Generating mock response for:", prompt.substring(0, 50) + "...");
  
  if (prompt.toLowerCase().includes('recipe') || prompt.includes('ingredients')) {
    if (prompt.toLowerCase().includes('chicken')) {
      return "Great choice! Chicken is so versatile. You could make Lemon Herb Chicken, Crispy Chicken Parmesan, or a simple Chicken Stir Fry. Which sounds most appealing to you right now?";
    } else if (prompt.toLowerCase().includes('rice')) {
      return "Rice is a fantastic base! You could make Fried Rice, Rice Pilaf, Rice Bowls, or even Rice Pudding. What other ingredients do you have to work with?";
    } else {
      return "I love working with what you have! Here are some ideas:\n\n🥘 **Quick Stir Fry** - Combine with vegetables and your favorite sauce\n🍲 **One-Pot Meal** - Perfect for busy weeknights\n🥗 **Fresh Bowl** - Great with greens and a tasty dressing\n\nWhat sounds most appealing?";
    }
  } else if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
    return "Hello! 👋 I'm CookMate, your personal AI kitchen assistant! I'm here to help you create amazing dishes with whatever ingredients you have. What brings you to the kitchen today?";
  } else {
    return "That's interesting! I'd love to help you cook something delicious. Could you tell me what ingredients you have available, or what kind of dish you're in the mood for?";
  }
}

// 1. Generate Recipe Route with Smart Ingredient Extraction
router.post('/generate-recipe', async (req, res) => {
  try {
    const { userMessage, ingredients: providedIngredients, extractedIngredients = [], dietaryPreferences, recipeType } = req.body;
    
    // Handle both old format (ingredients array) and new format (userMessage)
    let ingredients = providedIngredients || extractedIngredients;
    
    console.log("🔍 Initial ingredients:", ingredients);
    console.log("🔍 User message:", userMessage);
    
    if (userMessage && (!ingredients || ingredients.length === 0)) {
      console.log("🔍 Extracting ingredients from user message:", userMessage);
      
      // Smart ingredient extraction from user message
      const ingredientPatterns = [
        // Common cooking ingredients
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
        const matches = userMessage.match(pattern);
        if (matches) {
          matches.forEach(match => foundIngredients.add(match.toLowerCase()));
        }
      });
      
      console.log("🔍 Found ingredients:", Array.from(foundIngredients));
      
      // Also look for ingredient lists with numbers (like "1 cup flour, 2 eggs")
      const listPattern = /\b\d+\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pound|lbs?|oz|ounce|ounces)\s+([a-zA-Z\s]+)/gi;
      const listMatches = userMessage.match(listPattern);
      if (listMatches) {
        listMatches.forEach(match => {
          const cleanMatch = match.replace(/^\d+\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pound|lbs?|oz|ounce|ounces)\s+/i, '').trim();
          if (cleanMatch.length > 2) foundIngredients.add(cleanMatch.toLowerCase());
        });
      }
      
      ingredients = Array.from(foundIngredients);
      console.log("🔍 Final ingredients array:", ingredients);
    }
    
    // If no specific ingredients found, create a general recipe based on the request
    if (!ingredients || ingredients.length === 0) {
      console.log("🔍 No specific ingredients found, generating general recipe");
      
      // Create a general recipe based on common ingredients
      const generalIngredients = ['chicken', 'rice', 'onion', 'garlic', 'tomato'];
      
      const prompt = `<s>[INST] You are CookMate, a world-class chef. The user asked for a recipe but didn't specify ingredients. Create a delicious, accessible recipe using these common ingredients: ${generalIngredients.join(', ')}.
      
      Make it a complete, satisfying meal that's perfect for home cooks.
      
      Format as professional JSON:
      {
        "title": "Appealing Recipe Name",
        "ingredients": [
          "1 lb chicken breast, cut into pieces",
          "2 cups cooked rice",
          "1 medium onion, diced"
        ],
        "instructions": [
          "Season chicken with salt and pepper",
          "Heat oil in a large pan over medium-high heat",
          "Cook chicken until golden brown"
        ],
        "cookingTime": "30-35 minutes",
        "servings": "4 people",
        "difficulty": "Easy",
        "chefTips": [
          "Let meat rest before serving",
          "Taste and adjust seasonings"
        ]
      }
      
      JSON only, make it delicious: [/INST]`;

      const generatedText = await callHuggingFace(prompt);
      
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
        console.warn("⚠️ Could not parse AI JSON, creating general fallback recipe");
        recipeData = {
          title: "Classic Chicken and Rice Skillet",
          ingredients: [
            "1 lb chicken breast, cut into bite-sized pieces",
            "2 cups cooked rice",
            "1 medium onion, diced",
            "3 cloves garlic, minced",
            "2 medium tomatoes, diced",
            "2 tablespoons olive oil",
            "1 teaspoon salt",
            "1/2 teaspoon black pepper",
            "1 teaspoon dried oregano",
            "1/2 cup chicken broth"
          ],
          instructions: [
            "Season chicken pieces with salt, pepper, and oregano",
            "Heat olive oil in a large skillet over medium-high heat",
            "Add chicken and cook for 5-6 minutes until golden brown and cooked through",
            "Add diced onion and cook for 3-4 minutes until softened",
            "Add garlic and cook for 30 seconds until fragrant",
            "Add diced tomatoes and cook for 2-3 minutes",
            "Add cooked rice and chicken broth, stir to combine",
            "Reduce heat to medium-low and simmer for 5 minutes until heated through",
            "Taste and adjust seasonings as needed",
            "Serve hot and enjoy!"
          ],
          cookingTime: "25-30 minutes",
          servings: "4 people",
          difficulty: "Easy",
          chefTips: [
            "Use day-old rice for better texture",
            "Don't overcrowd the pan when cooking chicken",
            "Add a squeeze of lemon juice for brightness"
          ]
        };
      }
      
      return res.status(200).json({ 
        message: 'Recipe generated successfully (general suggestion)',
        recipe: recipeData,
        detectedIngredients: generalIngredients,
        note: "I created a general recipe since you didn't specify ingredients. Tell me what you have, and I'll make something specific for you!"
      });
    }

    const prompt = `<s>[INST] You are CookMate, a world-class chef with years of experience creating accessible, delicious recipes. You're about to craft a recipe that would make any home cook proud, using these ingredients: ${ingredients.join(', ')}.
    ${dietaryPreferences ? `Special dietary considerations: ${dietaryPreferences}.` : ''}
    ${recipeType ? `Recipe style: ${recipeType}.` : ''}
    
    Create a recipe that:
    - Showcases these ingredients in their best light
    - Is achievable for home cooks of various skill levels  
    - Includes helpful cooking techniques and tips
    - Offers flavor combinations that work harmoniously
    - Has clear, step-by-step instructions
    - Suggests variations or serving ideas when relevant

    Format as professional JSON:
    {
      "title": "Elegant Recipe Name that Whets the Appetite",
      "ingredients": [
        "1 lb chicken breast, cut into 1-inch pieces",
        "2 cups cooked jasmine rice",
        "1 medium yellow onion, finely diced"
      ],
      "instructions": [
        "Season chicken pieces generously with salt and pepper",
        "Heat 2 tablespoons olive oil in a large skillet over medium-high heat until shimmering",
        "Add chicken and sear without moving for 3-4 minutes until golden brown, then flip and cook 2-3 minutes more"
      ],
      "cookingTime": "30-35 minutes total",
      "servings": "4 generous portions",
      "difficulty": "Easy to Medium",
      "chefTips": [
        "Don't overcrowd the pan when searing chicken",
        "Let meat rest 5 minutes before serving for maximum juiciness"
      ]
    }
    
    JSON only, make it delicious: [/INST]`;

    const generatedText = await callHuggingFace(prompt);

    if (!generatedText) {
      throw new Error("Failed to get response from AI model");
    }

    let recipeData;
    try {
      // Clean up response to find JSON
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = generatedText.substring(jsonStart, jsonEnd + 1);
        recipeData = JSON.parse(jsonString);
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (parseError) {
      console.warn("⚠️ Could not parse AI JSON, creating enhanced fallback recipe");
      recipeData = {
        title: `Savory ${ingredients[0]} Creation`,
        ingredients: [
          ...ingredients.slice(0, 3).map(ing => `1 cup ${ing}, chopped`),
          `2 tablespoons olive oil`,
          `1 teaspoon salt`,
          `1/2 teaspoon black pepper`,
          `2 cloves garlic, minced`,
          `1 small onion, diced`
        ],
        instructions: [
          `Start by prepping all your ingredients - this ${ingredients[0]} dish comes together quickly once you start cooking!`,
          `Heat olive oil in a large skillet over medium heat until shimmering`,
          `Add diced onion and cook for 3-4 minutes until softened and fragrant`,
          `Add garlic and cook for another 30 seconds until aromatic`,
          `Add ${ingredients.slice(0, 3).join(', ')} to the pan and season with salt and pepper`,
          `Cook, stirring occasionally, for 8-10 minutes until ingredients are tender and flavors meld`,
          `Taste and adjust seasonings as needed - you might want a splash of lemon juice or your favorite herbs`,
          `Serve hot and enjoy the fruits of your culinary creativity!`
        ],
        cookingTime: "20-25 minutes",
        servings: "4 people",
        difficulty: "Easy",
        chefTips: [
          "Prep all ingredients before you start cooking - this dish moves fast!",
          "Don't be afraid to taste and adjust seasonings as you go",
          "This base recipe is incredibly versatile - try adding different herbs or a splash of vinegar"
        ]
      };
    }
    
    res.status(200).json({ 
      message: 'Recipe generated successfully',
      recipe: recipeData,
      detectedIngredients: ingredients
    });

  } catch (error) {
    console.error("Recipe generation error:", error);
    res.status(500).json({ 
      error: "Recipe generation failed. Please try again with different ingredients.",
      details: error.message 
    });
  }
});

// 2. Chat Route with Enhanced Conversation Memory
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    // Create enhanced conversation context
    const recentHistory = conversationHistory.slice(-6); // Keep last 6 exchanges for better context
    
    let contextPrompt = "";
    if (recentHistory.length > 0) {
      contextPrompt = "Previous conversation:\n" + 
        recentHistory.map(h => `User: ${h.user}\nCookMate: ${h.assistant}`).join('\n\n') + 
        "\n\n";
    }
    
    // Smart conversation mode detection
    const isInitialGreeting = !recentHistory.length && (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi'));
    const isIngredientSharing = message.toLowerCase().includes('i have') || 
                                message.toLowerCase().includes('i\'ve got') ||
                                message.toLowerCase().includes('available') ||
                                /rice|chicken|vegetables?|tomato|onion|garlic|eggs?|beef|pork|fish/i.test(message);
    const isRecipeRequest = message.toLowerCase().includes('recipe') || 
                           message.toLowerCase().includes('how to make') ||
                           message.toLowerCase().includes('cook') ||
                           message.toLowerCase().includes('prepare');
    
    let conversationMode = "general";
    if (isInitialGreeting) {
      conversationMode = "greeting";
    } else if (isIngredientSharing) {
      conversationMode = "ingredient_sharing";
    } else if (isRecipeRequest) {
      conversationMode = "recipe_request";
    }
    
    const prompt = `<s>[INST] You are CookMate, an incredibly knowledgeable and passionate AI cooking assistant with the conversational style and depth of ChatGPT. You have extensive culinary knowledge and love helping people create amazing dishes.

PERSONALITY & STYLE (ChatGPT-like):
- Conversational, witty, and intellectually curious like a brilliant friend who happens to be a chef
- Confident but humble about your knowledge
- Adapt your communication style to match the user's tone and preferences
- Show genuine enthusiasm for cooking and helping others succeed in the kitchen
- Use natural, flowing language with occasional mild humor or personality

CONVERSATION APPROACH:
- Ask thoughtful, probing questions to understand their cooking experience and preferences
- Provide context and reasoning behind your suggestions
- Offer multiple perspectives or approaches when relevant
- Reference cooking techniques, flavor profiles, or culinary traditions when appropriate
- Build on previous messages to show you remember the conversation
- If users seem inexperienced, offer gentle encouragement and basic explanations
- If they're more advanced, dive into deeper culinary concepts

CONVERSATION MODE: ${conversationMode}
${contextPrompt}User's message: "${message}"

Respond as CookMate with ChatGPT-level conversational quality, adapting to the conversation mode: [/INST]`;
    
    const aiReply = await callHuggingFace(prompt);
    
    res.status(200).json({ 
      response: { 
        message: aiReply || "I'm having trouble thinking right now. Try again?", 
        timestamp: new Date().toISOString(),
        conversationMode: conversationMode
      } 
    });
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: "I'm having trouble responding right now. Please try again!" });
  }
});

module.exports = router;