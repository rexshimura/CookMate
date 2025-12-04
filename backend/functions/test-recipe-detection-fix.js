// Test script to verify the recipe detection fix
// Testing the specific examples that were failing in the debug output

const { extractRecipesFromResponse } = require('./src/routes/ai');

// Test responses from the debug output that should now work
const testResponses = [
  {
    name: "Champorado Recipe Response",
    response: `**Champorado**

1. **Ingredients**:
   - 2 cups uncooked glutinous rice (also known as sticky rice or malagkit)
   - 4 cups water
   - 2 tbsp unsweetened cocoa powder
   - 1/4 cup sugar
   - 1/4 cup dried milkfish (bangus), crushed or 1/4 cup dried fish of your choice
   - Salt to taste
   - 2 tbsp vegetable oil

2. **Instructions**:
   - Rinse the glutinous rice thoroughly and soak it in water for at least 4 hours or overnight. Drain the water and set the rice aside.
   - In a large saucepan, combine the drained rice and 4 cups of water. Cook over medium heat, stirring constantly, until the rice is cooked and the mixture has a porridge-like consistency.
   - In a small bowl, mix together the cocoa powder and sugar. Add this mixture to the cooked rice and stir well.
   - Add the crushed dried milkfish and salt to the rice mixture. Stir well to combine.
   - Heat the vegetable oil in a small pan and add it to the rice mixture. Stir well to combine.
   - Continue cooking the champorado over low heat, stirring constantly, until the mixture thickens and the flavors are well combined.
   - Serve the champorado hot, garnished with a sprinkle of sugar and a side of dried fish, if desired.

**Tips and Variations**:

- You can adjust the amount of cocoa powder to your liking, depending on how strong you want the chocolate flavor to be.
- Some people like to add a splash of milk or cream to the champorado for extra richness and creaminess.
- You can also add other ingredients to the champorado, such as diced bananas or plantains, to give it a sweeter flavor.
- Champorado is traditionally served with dried fish, but you can also serve it with other toppings, such as scrambled eggs or chopped fresh herbs.

Note: This recipe makes about 4 servings. You can adjust the recipe to make more or less, depending on your needs.`,
    expected: ["Champorado"]
  },
  {
    name: "Korean-Style BBQ Beef Tacos Response",
    response: `**Korean-Style BBQ Beef Tacos**

1. **Ingredients**:
   - 1 lb beef chuck roast, sliced thin
   - 1/4 cup soy sauce
   - 2 tbsp brown sugar
   - 1 tbsp sesame oil
   - 3 cloves garlic, minced
   - 1 tsp fresh ginger, grated
   - 8 small corn tortillas
   - 1 cup kimchi, chopped
   - 1/2 cup cilantro, chopped
   - 1 green onion, sliced
   - Sesame seeds for garnish

2. **Instructions**:
   - In a bowl, mix soy sauce, brown sugar, sesame oil, garlic, and ginger to make the marinade.
   - Add beef slices and marinate for at least 30 minutes.
   - Heat a large skillet over high heat and cook beef slices for 2-3 minutes per side.
   - Warm tortillas in a dry pan.
   - Assemble tacos with beef, kimchi, cilantro, and green onions.
   - Sprinkle with sesame seeds before serving.`,
    expected: ["Korean-Style BBQ Beef Tacos"]
  },
  {
    name: "Simple Adobo Response",
    response: `**Adobo**

1. **Ingredients**:
   - 1 lb chicken thighs
   - 1/2 cup vinegar
   - 1/4 cup soy sauce
   - 3 cloves garlic, crushed
   - 1 bay leaf
   - 1 tsp black peppercorns

2. **Instructions**:
   - Combine all ingredients in a pot.
   - Bring to a boil, then simmer for 20 minutes.
   - Serve with rice.`,
    expected: ["Adobo"]
  }
];

console.log('🧪 Testing Recipe Detection Fix...\n');

let passedTests = 0;
let totalTests = testResponses.length;

testResponses.forEach((test, index) => {
  console.log(`\n--- Test ${index + 1}: ${test.name} ---`);
  console.log(`Expected: [${test.expected.join(', ')}]`);
  
  const detectedRecipes = extractRecipesFromResponse(test.response);
  console.log(`Detected: [${detectedRecipes.join(', ')}]`);
  
  // Check if all expected recipes were detected
  const success = test.expected.every(expected => 
    detectedRecipes.some(detected => 
      detected.toLowerCase().includes(expected.toLowerCase())
    )
  );
  
  if (success) {
    console.log('✅ PASSED');
    passedTests++;
  } else {
    console.log('❌ FAILED');
  }
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Recipe detection is working correctly.');
  process.exit(0);
} else {
  console.log('⚠️ Some tests failed. Recipe detection may still need adjustments.');
  process.exit(1);
}