// Test the improved cleanup logic
function testImprovedCleanup() {
  const sampleResponseWithDetails = `Let's make a delicious Chicken Fajita recipe. It's a classic Tex-Mex dish that's easy to make and always a crowd-pleaser.

Ingredients:
* 1 pound boneless, skinless chicken breast, cut into thin strips
* 1/2 cup lime juice
* 2 cloves garlic, minced
* 1 teaspoon dried oregano
* 1/4 teaspoon cumin
* 1/4 teaspoon cayenne pepper
* 1 large onion, sliced
* 2 large bell peppers (any color), sliced

Instructions:
1. Heat a large skillet over medium-high heat and add a tablespoon of oil.
2. Add the chicken and cook until browned and cooked through, about 5-6 minutes.
3. Remove the chicken from the skillet and set aside.
4. Add another tablespoon of oil to the skillet and add the sliced onions and bell peppers.
5. Cook until they're tender and lightly browned, about 5 minutes.

This recipe serves 4-6 people and is medium difficulty. Enjoy your Chicken Fajitas!`;

  console.log('=== Testing Improved Cleanup Logic ===');
  console.log('Original response length:', sampleResponseWithDetails.length);

  // Apply the improved cleanup logic
  let cleanedResponse = sampleResponseWithDetails;

  // Remove detailed recipe content (ingredients, instructions) since they'll be shown in recipe detail page
  // Remove ingredient sections
  cleanedResponse = cleanedResponse.replace(/Ingredients?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                  // Remove instruction sections
                                  .replace(/Instructions?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                  .replace(/Directions?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                  .replace(/Steps?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                  .replace(/Method\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                  // Remove bullet point lists
                                  .replace(/^\s*[•\-*]\s*.*(\n\s*[•\-*]\s*.*)*/gm, '')
                                  // Remove numbered lists
                                  .replace(/^\s*\d+\.\s*.*(\n\s*\d+\.\s*.*)*/gm, '')
                                  .trim();

  console.log('Cleaned response length:', cleanedResponse.length);
  console.log('Ingredients removed:', !cleanedResponse.includes('Ingredients:'));
  console.log('Instructions removed:', !cleanedResponse.includes('Instructions:'));
  console.log('Bullet points removed:', !cleanedResponse.includes('•'));
  console.log('Numbered steps removed:', !cleanedResponse.includes('1.') && !cleanedResponse.includes('2.'));

  console.log('\nCleaned Response:');
  console.log(cleanedResponse);

  return {
    success: !cleanedResponse.includes('Ingredients:') &&
             !cleanedResponse.includes('Instructions:') &&
             !cleanedResponse.includes('•') &&
             !cleanedResponse.includes('1.'),
    cleanedResponse
  };
}

const result = testImprovedCleanup();
console.log('\n=== TEST RESULT ===');
console.log('Cleanup successful:', result.success ? '✅ YES' : '❌ NO');