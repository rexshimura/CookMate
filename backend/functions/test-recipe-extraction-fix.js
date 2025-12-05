// Test file for improved recipe extraction
const { extractRecipesFromResponse, isValidRecipe } = require('./src/routes/ai.js');

// Test AI response similar to the one that was failing
const testAiResponse = `I have thousands of recipes up my sleeve. Here are a few ideas to get you started:

**Recipe Name: Creamy Tomato Pasta**

**Ingredients**:
- 8 oz pasta (such as penne or fusilli)
- 2 cups cherry tomatoes, halved
- 1 cup heavy cream
- 1/2 cup grated Parmesan cheese
- 2 cloves garlic, minced
- 1 tsp dried basil
- Salt and pepper, to taste
- 1 tbsp olive oil

**Instructions**:
1. Cook pasta according to package instructions until al dente.
2. In a large skillet, heat olive oil over medium heat.
3. Add garlic and cook for 1-2 minutes until fragrant.
4. Add cherry tomatoes and cook for 3-4 minutes until they start to release their juices.
5. Pour in heavy cream and bring the mixture to a simmer.
6. Reduce heat to low and let it cook for 2-3 minutes until the sauce thickens slightly.
7. Stir in Parmesan cheese until melted and well combined.
8. Add cooked pasta to the skillet and toss everything together until the pasta is well coated.
9. Season with salt, pepper, and basil.
10. Serve hot and enjoy!

**Recipe Name: Korean-Style BBQ Beef Tacos**

**Ingredients**:
- 1 lb beef (such as flank steak or skirt steak), sliced into thin strips
- 1/4 cup Gochujang sauce
- 2 tbsp soy sauce
- 2 tbsp brown sugar
- 2 cloves garlic, minced
- 1 tsp grated ginger
- 8-10 corn tortillas
- Sliced green onions, for garnish
- Sliced radishes, for garnish
- Cilantro, for garnish

**Instructions**:
1. In a large bowl, whisk together Gochujang sauce, soy sauce, brown sugar, garlic, and ginger.
2. Add beef to the bowl and toss to coat with the marinade.
3. Let it marinate for at least 30 minutes, or up to 2 hours in the refrigerator.
4. Preheat a grill or grill pan to medium-high heat.
5. Remove beef from the marinade and cook for 3-4 minutes per side, or until cooked to your desired level of doneness.
6. Warm tortillas by wrapping them in a damp paper towel and microwaving for 20-30 seconds.
7. Assemble tacos by placing beef onto a tortilla and topping with green onions, radishes, and cilantro.
8. Serve immediately and enjoy!

Which one of these recipes catches your eye? Or would you like me to suggest more ideas based on your dietary preferences or ingredient availability?`;

// Test various recipe formats
const testCases = [
  {
    name: "Bold recipe names with 'Recipe Name:' prefix",
    response: `**Recipe Name: Creamy Tomato Pasta**

**Recipe Name: Korean-Style BBQ Beef Tacos**`
  },
  {
    name: "Simple bold recipe names",
    response: `**Creamy Tomato Pasta**

**Korean-Style BBQ Beef Tacos**`
  },
  {
    name: "Numbered recipe list",
    response: `Here are some great recipes:

1. Creamy Tomato Pasta
2. Korean-Style BBQ Beef Tacos
3. Classic Beef Stir Fry`
  },
  {
    name: "Mixed format with headers",
    response: `# Main Dishes

## Creamy Tomato Pasta

This is a delicious pasta recipe.

## Korean-Style BBQ Beef Tacos

These tacos are amazing!`
  },
  {
    name: "Complex AI response (original failing case)",
    response: testAiResponse
  }
];

async function runTests() {
  console.log('🧪 Testing Improved Recipe Extraction System\n');
  console.log('=' .repeat(60));
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test ${i + 1}: ${testCase.name}`);
    console.log('-'.repeat(50));
    
    try {
      const extractedRecipes = extractRecipesFromResponse(testCase.response);
      
      console.log(`✅ Extracted ${extractedRecipes.length} recipes:`);
      extractedRecipes.forEach((recipe, index) => {
        console.log(`   ${index + 1}. ${recipe}`);
      });
      
      // Test individual validation
      console.log('\n🔍 Individual Validation Tests:');
      extractedRecipes.forEach(recipe => {
        const isValid = isValidRecipe(recipe);
        console.log(`   "${recipe}" → ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      });
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  // Test edge cases
  console.log('\n🎯 Edge Case Tests:');
  console.log('-'.repeat(50));
  
  const edgeCases = [
    "Cook pasta according to package instructions", // Should be rejected (instruction)
    "Add garlic and cook for 1-2 minutes", // Should be rejected (instruction)
    "In a large skillet, heat olive oil", // Should be rejected (instruction)
    "Serve hot and enjoy", // Should be rejected (instruction)
    "Korean-Style BBQ Beef Tacos", // Should be accepted (recipe name)
    "Creamy Tomato Pasta", // Should be accepted (recipe name)
    "Classic Caesar Salad", // Should be accepted (recipe name)
    "Spicy Chicken Curry", // Should be accepted (recipe name)
    "Ingredients:", // Should be rejected (section header)
    "Instructions:", // Should be rejected (section header)
  ];
  
  edgeCases.forEach(testCase => {
    const isValid = isValidRecipe(testCase);
    console.log(`"${testCase}" → ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  });
  
  console.log('\n🎉 Test completed!');
}

// Run the tests
runTests().catch(console.error);