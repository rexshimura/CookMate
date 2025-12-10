// Test the final fallback fix
function extractRecipesFromResponse(response) {
  // Simplified version for testing
  const recipes = [];
  const lines = response.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
      const recipeName = trimmed.replace(/^[*-]\s*/, '').trim();
      if (recipeName && !recipeName.includes(':')) {
        recipes.push(recipeName);
      }
    }
  }

  return recipes;
}

function testFinalFallback() {
  const userFeedbackResponse = `Let's make something delicious! I'd be happy to help you with a recipe. What type of cuisine are you in the mood for? Do you want something Italian, Mexican, Indian, or maybe something else?

However, since you didn't specify a particular cuisine or dish, I'll give you a random suggestion. How about some Chicken Fajitas? They're a classic Mexican dish that's easy to make and always a crowd-pleaser.

\`\`\`json
{
  "recipes": [
    {
      "title": "Chicken Fajitas",
      "servings": "4-6",
      "difficulty": "Easy"
    }
  ]
}
\`\`\``;

  console.log('=== Testing Final Fallback Fix ===');

  // Simulate the JSON extraction and cleanup
  let aiReply;
  let detectedRecipes = [];
  let jsonExtractionSuccess = false;
  let jsonStringToClean = null;

  // JSON extraction (simulated)
  const markdownMatch = userFeedbackResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch && markdownMatch[1]) {
    const parsed = JSON.parse(markdownMatch[1]);
    if (parsed && parsed.recipes) {
      detectedRecipes = parsed.recipes.map(r => r.title || r.name);
      jsonExtractionSuccess = true;
      jsonStringToClean = markdownMatch[0];
    }
  }

  // Cleanup
  aiReply = userFeedbackResponse;
  if (jsonStringToClean) {
    aiReply = userFeedbackResponse.replace(jsonStringToClean, '').trim();
  }
  aiReply = aiReply.replace(/```\s*```/g, '')
                  .replace(/Here is the JSON:?/i, '')
                  .trim();

  console.log('After JSON cleanup - contains backticks:', aiReply.includes('```') ? '❌ YES' : '✅ NO');
  console.log('After JSON cleanup - contains JSON:', aiReply.includes('{') ? '❌ YES' : '✅ NO');

  // Test the fallback - should use fullResponse, not aiReply
  const fullResponse = userFeedbackResponse;
  const fallbackRecipes = extractRecipesFromResponse(fullResponse);
  console.log('Fallback recipes found:', fallbackRecipes.length > 0 ? '✅ YES' : '❌ NO');
  console.log('Fallback recipes:', fallbackRecipes);

  // Final check
  const finalCleaned = aiReply.replace(/```\s*```/g, '')
                             .replace(/Here is the JSON:?/i, '')
                             .trim();

  return {
    success: !finalCleaned.includes('```') &&
             !finalCleaned.includes('{') &&
             fallbackRecipes.length > 0,
    finalResponse: finalCleaned,
    fallbackRecipes
  };
}

const result = testFinalFallback();
console.log('\n=== TEST RESULT ===');
console.log('Final fallback test passed:', result.success ? '✅ YES' : '❌ NO');
console.log('Final response contains JSON:', result.finalResponse.includes('{') ? '❌ YES' : '✅ NO');
console.log('Fallback found recipes:', result.fallbackRecipes);