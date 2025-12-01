const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// 1. API Key: Use env var or hardcoded backup for testing
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

// 2. Model URL: FIXED to include "/models/"
// We use Zephyr 7B Beta because it follows instructions better than base Mistral
const HF_MODEL_URL = "https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

console.log("--- AI SERVICE INITIALIZED ---");
console.log("Target URL:", HF_MODEL_URL);
console.log("API Key Status:", HF_API_KEY ? "Present" : "MISSING");

// Helper function to call Hugging Face with better error handling
async function callHuggingFace(prompt) {
  try {
    const response = await axios.post(
      HF_MODEL_URL,
      { 
        inputs: prompt, 
        parameters: { 
          max_new_tokens: 1024,
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
      const generatedText = response.data[0].generated_text.trim();
      
      // Clean up common AI response artifacts
      return generatedText
        .replace(/^[\s\n]*(Assistant|CookMate):\s*/i, '')
        .replace(/^(User| Human):\s*/gi, '')
        .trim();
    }
    return null;
  } catch (error) {
    // Log detailed error for debugging
    console.error("❌ Hugging Face Error:", error.response ? error.response.data : error.message);
    
    // Return a fallback response based on prompt type
    if (prompt.includes('recipe')) {
      return "I'd love to help you cook something delicious! Could you tell me what ingredients you have available?";
    } else {
      return "I'm excited to chat about cooking! What ingredients do you have today, or what would you like to cook?";
    }
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

// 2. Chat Route with Conversation Memory
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    // Create a more contextual conversation prompt
    const recentHistory = conversationHistory.slice(-4); // Keep last 4 exchanges for context
    
    let contextPrompt = "";
    if (recentHistory.length > 0) {
      contextPrompt = "Previous conversation:\n" + 
        recentHistory.map(h => `User: ${h.user}\nCookMate: ${h.assistant}`).join('\n\n') + 
        "\n\n";
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

RESPONSE QUALITY:
- Aim for 3-6 sentences that feel natural and helpful
- Start with direct acknowledgment of their message
- Provide specific, actionable advice or suggestions
- End with engaging follow-up questions that advance the conversation
- For greetings: "Hey there! 👋 What brings you to the kitchen today? Whether you're looking for recipe inspiration or want to work with specific ingredients, I'm excited to help!"
- For ingredient sharing: "Ooh, that's a great starting point! [ingredient] works really well with [suggest complementary ingredients/cooking methods]. What kind of dish are you in the mood for - something comforting, quick, or maybe something that showcases those ingredients?"
- For questions: Engage with the question thoughtfully and expand on related cooking concepts

TONE ADAPTABILITY:
- Match enthusiastic users with equal energy
- Be more patient and explanatory with beginners
- Share cooking tips and techniques naturally in conversation
- Keep responses genuine and helpful, avoiding robotic patterns

${contextPrompt}User's message: "${message}"

Respond as CookMate with ChatGPT-level conversational quality: [/INST]`;
    
    const aiReply = await callHuggingFace(prompt);
    
    res.status(200).json({ 
      response: { 
        message: aiReply || "I'm having trouble thinking right now. Try again?", 
        timestamp: new Date().toISOString() 
      } 
    });
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: "I'm having trouble responding right now. Please try again!" });
  }
});

module.exports = router;