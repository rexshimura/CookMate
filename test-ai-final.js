const axios = require('axios');

async function testAI() {
  try {
    console.log('Testing AI chat functionality...');
    
    const response = await axios.post('http://localhost:5001/api/ai/chat', {
      message: 'Hello! I have chicken and rice. What can I cook?',
      history: []
    });
    
    console.log('✅ AI Response:', response.data.response.message);
    
    // Test recipe generation
    console.log('\nTesting recipe generation...');
    const recipeResponse = await axios.post('http://localhost:5001/api/ai/generate-recipe', {
      userMessage: 'I have chicken, rice, and vegetables',
      dietaryPreferences: 'None'
    });
    
    console.log('✅ Recipe Title:', recipeResponse.data.recipe.title);
    console.log('✅ Ingredients:', recipeResponse.data.recipe.ingredients.slice(0, 3));
    console.log('✅ Cooking Time:', recipeResponse.data.recipe.cookingTime);
    
    console.log('\n🎉 All tests passed! AI cooking assistant is working properly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAI();