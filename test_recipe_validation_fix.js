const { isValidRecipe, extractRecipesFromResponse } = require('./backend/functions/src/routes/ai');

// Test cases for the improved recipe validation
console.log('🧪 Testing Recipe Validation Fixes...');

const testCases = [
  // Valid recipe names that should now pass
  { input: "Beef Stew", expected: true, description: "Simple recipe name" },
  { input: "Chicken Fajitas", expected: true, description: "Two-word recipe name" },
  { input: "Korean-Style BBQ Beef Tacos", expected: true, description: "Complex recipe name with hyphens" },
  { input: "Spaghetti Carbonara", expected: true, description: "Italian recipe name" },
  { input: "Chocolate Chip Cookies", expected: true, description: "Dessert recipe" },
  { input: "Vegetable Stir Fry", expected: true, description: "Vegetarian recipe" },

  // Invalid cases that should still be rejected
  { input: "Click here for recipe", expected: false, description: "Contains blocked term" },
  { input: "Bake for 20 minutes", expected: false, description: "Clear instruction" },
  { input: "Welcome to CookMate", expected: false, description: "Greeting message" },
  { input: "Hi there", expected: false, description: "Short greeting" },

  // Edge cases that should now pass with lenient validation
  { input: "Gourmet Mac and Cheese", expected: true, description: "Gourmet recipe name" },
  { input: "Homemade Pizza Dough", expected: true, description: "Homemade recipe" },
  { input: "Quick Chicken Stir Fry", expected: true, description: "Quick recipe" },
  { input: "Easy Beef Tacos", expected: true, description: "Easy recipe" },
];

let passedTests = 0;
let totalTests = testCases.length;

console.log('Running validation tests...');
testCases.forEach((testCase, index) => {
  const result = isValidRecipe(testCase.input);
  const passed = result === testCase.expected;

  if (passed) {
    console.log(`✅ Test ${index + 1} PASSED: "${testCase.input}" - ${testCase.description}`);
    passedTests++;
  } else {
    console.log(`❌ Test ${index + 1} FAILED: "${testCase.input}" - ${testCase.description} (Expected: ${testCase.expected}, Got: ${result})`);
  }
});

console.log(`\n📊 Validation Test Results: ${passedTests}/${totalTests} passed`);

// Test recipe extraction with sample AI response
console.log('\n🧪 Testing Recipe Extraction...');

const sampleAIResponse = `
That's a great idea! Both Beef Stew and Chicken Fajitas are delicious choices. Beef stew is hearty and comforting, while chicken fajitas are flavorful and fun to make.

Here are the recipes I found:

1. **Beef Stew** - A classic comfort food with tender beef and vegetables
2. **Chicken Fajitas** - Sizzling chicken with peppers and onions
3. **Garlic Bread** - Perfect side dish for your meal

Would you like me to provide detailed instructions for any of these recipes?
`;

const extractedRecipes = extractRecipesFromResponse(sampleAIResponse);
console.log(`Extracted recipes: ${JSON.stringify(extractedRecipes, null, 2)}`);

const expectedRecipes = ["Beef Stew", "Chicken Fajitas", "Garlic Bread"];
const extractionPassed = JSON.stringify(extractedRecipes) === JSON.stringify(expectedRecipes);

if (extractionPassed) {
  console.log('✅ Recipe extraction test PASSED');
} else {
  console.log('❌ Recipe extraction test FAILED');
  console.log(`Expected: ${JSON.stringify(expectedRecipes)}`);
  console.log(`Got: ${JSON.stringify(extractedRecipes)}`);
}

console.log('\n🎉 Testing complete!');
console.log(`Overall result: ${passedTests === totalTests && extractionPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);