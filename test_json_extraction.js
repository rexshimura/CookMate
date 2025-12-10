const { safeJSONParse } = require('./backend/functions/src/routes/ai');

// Test the JSON extraction logic with the sample response
function testJsonExtraction() {
  const sampleResponse = `Let's make a delicious Chicken Fajita recipe. It's a classic Tex-Mex dish that's easy to make and always a crowd-pleaser. We'll use chicken breast, bell peppers, onions, and some spices to create a flavorful and spicy dish. You can serve it with warm flour or corn tortillas, sour cream, and salsa.

To start, you'll need the following ingredients:

* 1 pound boneless, skinless chicken breast, cut into thin strips
* 1/2 cup lime juice
* 2 cloves garlic, minced
* 1 teaspoon dried oregano
* 1/4 teaspoon cumin
* 1/4 teaspoon cayenne pepper
* 1 large onion, sliced
* 2 large bell peppers (any color), sliced
* 8 small flour tortillas
* Vegetable oil for cooking
* Salt and pepper to taste
* Optional: sour cream, salsa, avocado, shredded cheese, cilantro

Now, let's cook the chicken and vegetables. Heat a large skillet over medium-high heat and add a tablespoon of oil. Add the chicken and cook until browned and cooked through, about 5-6 minutes. Remove the chicken from the skillet and set aside.

Next, add another tablespoon of oil to the skillet and add the sliced onions and bell peppers. Cook until they're tender and lightly browned, about 5 minutes. Add the garlic, oregano, cumin, and cayenne pepper to the skillet and cook for 1 minute.

Now it's time to assemble the fajitas. Add the cooked chicken back into the skillet and stir to combine with the vegetables and spices. Season with salt and pepper to taste.

Warm the tortillas by wrapping them in a damp paper towel and microwaving for 20-30 seconds. Assemble the fajitas by placing a portion of the chicken and vegetable mixture onto a tortilla and serving with your desired toppings.

\`\`\`json
{
  "recipes": [
    {
      "title": "Chicken Fajitas",
      "servings": "4-6",
      "difficulty": "Medium"
    }
  ]
}
\`\`\``;

  console.log('Testing JSON extraction with sample response...');
  console.log('Original response length:', sampleResponse.length);

  // Test Strategy 1: Markdown Code Blocks
  const markdownMatch = sampleResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  console.log('Markdown match found:', !!markdownMatch);
  if (markdownMatch) {
    console.log('Markdown match[0]:', markdownMatch[0].substring(0, 50) + '...');
    console.log('Markdown match[1]:', markdownMatch[1].substring(0, 50) + '...');

    const parsed = safeJSONParse(markdownMatch[1]);
    console.log('Parsed JSON:', parsed);
  }

  // Test the cleanup logic
  let aiReply = sampleResponse;
  let jsonStringToClean = markdownMatch ? markdownMatch[0] : null;

  if (jsonStringToClean) {
    aiReply = sampleResponse.replace(jsonStringToClean, '').trim();
    console.log('After removing JSON block, response length:', aiReply.length);
    console.log('JSON block removed successfully:', !aiReply.includes('```json'));
    console.log('No more backticks:', !aiReply.includes('```'));
  }

  // Test additional cleanup
  aiReply = aiReply.replace(/```\s*```/g, '')
                  .replace(/Here is the JSON:?/i, '')
                  .trim();

  console.log('Final cleaned response length:', aiReply.length);
  console.log('Final response contains JSON:', aiReply.includes('{') && aiReply.includes('}'));
}

testJsonExtraction();