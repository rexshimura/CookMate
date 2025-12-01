const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
// Default to Mistral-7B-Instruct if not set in .env
const HF_MODEL_URL = process.env.HUGGING_FACE_MODEL_URL || "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

// Helper function to call Hugging Face
async function callHuggingFace(prompt) {
  try {
    const response = await axios.post(
      HF_MODEL_URL,
      { 
        inputs: prompt, 
        parameters: { 
          max_new_tokens: 1024, // Allow for long recipes
          temperature: 0.7,     // Creative but not too random
          return_full_text: false // Only give us the new text, not the prompt
        } 
      },
      { 
        headers: { 
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        } 
      }
    );
    
    // Hugging Face returns an array of objects. We want the 'generated_text' from the first one.
    if (response.data && response.data.length > 0) {
      return response.data[0].generated_text.trim();
    }
    return null;
  } catch (error) {
    console.error("Hugging Face API Error:", error.response ? error.response.data : error.message);
    throw new Error('Failed to communicate with AI service');
  }
}

// 1. Generate Recipe Route
router.post('/generate-recipe', async (req, res) => {
  try {
    const { ingredients, dietaryPreferences, recipeType } = req.body;
    
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: "No ingredients provided" });
    }

    // Construct a specific prompt for Mistral
    // We ask for JSON format to make it easier to display in the frontend
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

    // Attempt to parse the JSON string from the AI
    let recipeData;
    try {
      // Sometimes AI adds text before/after JSON, so we find the first '{' and last '}'
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = generatedText.substring(jsonStart, jsonEnd + 1);
        recipeData = JSON.parse(jsonString);
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (parseError) {
      // Fallback if AI didn't give perfect JSON: return raw text wrapped in structure
      console.warn("Could not parse AI JSON, returning raw text");
      recipeData = {
        title: "AI Recipe Suggestion",
        ingredients: ingredients,
        instructions: [generatedText], // Put the whole text as one step
        cookingTime: "Unknown",
        servings: 2,
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

// 2. Chat Route
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Simple chat prompt
    const prompt = `<s>[INST] You are CookMate, a helpful and friendly AI kitchen assistant. 
    User: ${message}
    Assistant: [/INST]`;
    
    const aiReply = await callHuggingFace(prompt);
    
    const mockResponse = {
      message: aiReply || "I'm having trouble thinking right now. Try again?",
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({ 
      response: mockResponse
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Suggest Ingredients Route
router.post('/suggest-ingredients', async (req, res) => {
  try {
    const { availableIngredients } = req.body;
    
    const prompt = `<s>[INST] I have these ingredients: ${availableIngredients.join(', ')}. 
    Suggest 3 additional ingredients that would go well with them to make a complete meal.
    Output ONLY a comma-separated list of ingredients. Example: "Garlic, Olive Oil, Basil"
    [/INST]`;
    
    const suggestionText = await callHuggingFace(prompt);
    
    // Convert string "Garlic, Onion" into array ["Garlic", "Onion"]
    const suggestions = suggestionText ? suggestionText.split(',').map(s => s.trim()) : [];
    
    res.status(200).json({ 
      suggestions,
      message: 'Ingredient suggestions generated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;