// Test script to verify the recipe name extraction and validation fix

// Mock the recipe validation and extraction functions from ai.js
function isValidRecipe(text) {
  if (!text || text.length === 0) {
    console.log('❌ [VALIDATION] Failed: empty text');
    return false;
  }
  
  const lowerText = text.toLowerCase().trim();
  
  console.log('🔍 [VALIDATION] Checking:', text);
  console.log('🔍 [VALIDATION] Lowercase:', lowerText);
  
  // Basic length check - more lenient
  if (text.length < 3 || text.length > 80) {
    console.log('❌ [VALIDATION] Failed: invalid length (' + text.length + ')');
    return false;
  }
  
  // Must start with capital letter (or number)
  if (!/^[A-Z0-9]/.test(text.trim())) {
    console.log('❌ [VALIDATION] Failed: does not start with capital letter or number');
    return false;
  }
  
  // Must not end with common non-recipe endings
  if (/[.!?]$/.test(text.trim())) {
    console.log('❌ [VALIDATION] Failed: ends with punctuation');
    return false;
  }
  
  // Exclude obvious non-recipe content
  const excludeTerms = [
    'ingredients', 'instructions', 'directions', 'method', 'steps',
    'cooking time', 'prep time', 'servings', 'difficulty', 'nutrition',
    'safety', 'tips', 'temperature', 'degrees', 'minutes', 'hours',
    'cup', 'cups', 'tablespoon', 'teaspoon', 'pound', 'ounce',
    'recipe suggestions', 'recipe ideas', 'cooking tips', 'food suggestions'
  ];
  
  // Check for excluded terms
  if (excludeTerms.some(term => lowerText.includes(term))) {
    console.log('❌ [VALIDATION] Failed: contains excluded term');
    return false;
  }
  
  // Must contain food-related keywords (expanded list)
  const foodKeywords = /\b(chicken|beef|pork|fish|salmon|shrimp|tuna|cod|haddock|rice|pasta|noodles|soup|stew|salad|sandwich|pizza|bread|cake|cookie|pancake|waffle|curry|taco|tacos|burrito|omelette|lasagna|risotto|muffin|brownie|pie|chocolate|vanilla|cheese|tomato|potato|onion|garlic|pepper|broccoli|carrot|spinach|mushroom|basil|oregano|thyme|rosemary|lemon|lime|avocado|apple|banana|berries|quinoa|oats|yogurt|milk|cream|butter|oil|sugar|honey|flour|egg|eggs|tofu|lamb|turkey|zucchini|eggplant|cucumber|celery|lettuce|kale|corn|peas|beans|spaghetti|macaroni|korean|chinese|italian|mexican|indian|thai|french|mediterranean|bbq|grilled|roasted|braised|stir.?fry|fried|baked|sauteed|steamed|poached|smoked|marinated|glazed|caramelized|crispy|tender|juicy|spicy|sweet|sour|bitter|salty|umami|fresh|organic|local|seasonal|homemade|traditional|authentic|fusion|comfort|quick|easy|simple|complex|elegant|rustic|gourmet|restaurant.?style|street.?food|appetizer|entree|main|dessert|snack|breakfast|lunch|dinner|supper|brunch|sauce|dressing|marinade|rub|spice|herb|seasoning|condiment|side|starter|course|meal|dish|cuisine|flavor|style|method|technique|preparation|cooking|recipe|ingredient)\b/i;
  
  const foodKeywordMatch = foodKeywords.test(lowerText);
  console.log('🔍 [VALIDATION] Food keywords check for "' + text + '":', foodKeywordMatch);
  
  if (!foodKeywordMatch) {
    console.log('❌ [VALIDATION] Failed: no food-related keywords found');
    return false;
  }
  
  // Simple format check - should not be too instruction-like
  const instructionPattern = /\b(step|cook|heat|add|mix|stir|bake|fry|boil|minutes?|hours?|degrees?|°[fc])\b/i;
  if (instructionPattern.test(text)) {
    console.log('❌ [VALIDATION] Failed: looks like instruction text');
    return false;
  }
  
  console.log('✅ [VALIDATION] Passed - valid recipe detected');
  return true;
}

// Test the problematic recipe name
console.log('🧪 TESTING RECIPE NAME EXTRACTION FIX');
console.log('=====================================');

const testCases = [
  "Korean-Style BBQ Beef Tacos",
  "Chicken Adobo",
  "Beef Bulgogi",
  "Spicy Tuna Roll",
  "Vegetable Pad Thai",
  "Chocolate Chip Cookies",
  "Classic Margherita Pizza",
  "Greek Salad",
  "Fish Tacos",
  "Vegetarian Lasagna"
];

console.log('\nTesting recipe validation with various recipe names:\n');

testCases.forEach((recipe, index) => {
  console.log(`Test ${index + 1}: "${recipe}"`);
  const result = isValidRecipe(recipe);
  console.log(`Result: ${result ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('=====================================');
console.log('Test completed!');