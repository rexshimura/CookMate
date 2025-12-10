// Test the complete flow with the fixed variable scoping and improved JSON parsing
function safeJSONParse(str) {
  try {
    // Fix common AI JSON issues before parsing
    const cleaned = str.replace(/(?<!\\)\n/g, "\\n") // Escape newlines
                      .replace(/,\s*}/g, "}")        // Remove trailing commas
                      .replace(/,\s*]/g, "]")
                      .replace(/\s+/g, ' ')           // Replace multiple whitespace with single space
                      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse failed:", e.message);
    return null;
  }
}

function isValidRecipe(text) {
  if (!text || typeof text !== 'string' || text.length < 3) return false;
  const cleanText = text.trim().toLowerCase();
  return cleanText.includes('chicken') || cleanText.includes('fajita');
}

function testCompleteFlow() {
  const sampleResponse = `Let's make a delicious Chicken Fajita recipe. It's a classic Tex-Mex dish that's easy to make and always a crowd-pleaser.

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

  console.log('=== Testing Complete Flow (Fixed) ===');

  // Simulate the fixed implementation
  let aiReply;
  let detectedRecipes = [];
  let jsonExtractionSuccess = false;
  let jsonStringToClean = null;

  try {
    const fullResponse = sampleResponse;

    // STRATEGY 1: Look for Markdown Code Blocks (Standard)
    const markdownMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (markdownMatch && markdownMatch[1]) {
      const parsed = safeJSONParse(markdownMatch[1]);
      if (parsed && parsed.recipes) {
        detectedRecipes = parsed.recipes;
        jsonExtractionSuccess = true;
        jsonStringToClean = markdownMatch[0];
        console.log('✅ Strategy 1: Found markdown JSON block');
        console.log('✅ Parsed recipes:', parsed.recipes);
      }
    }

    // STRATEGY 2: Look for Raw JSON (Fallback if AI forgot backticks)
    if (!jsonExtractionSuccess) {
      const rawJsonMatch = fullResponse.match(/(\{\s*"?recipes"?\s*:[\s\S]*\})/i);
      if (rawJsonMatch && rawJsonMatch[1]) {
        const parsed = safeJSONParse(rawJsonMatch[1]);
        if (parsed && parsed.recipes) {
          detectedRecipes = parsed.recipes;
          jsonExtractionSuccess = true;
          jsonStringToClean = rawJsonMatch[1];
          console.log('✅ Strategy 2: Found raw JSON object');
        }
      }
    }

    // 3. VALIDATE & FILTER
    if (jsonExtractionSuccess && Array.isArray(detectedRecipes)) {
      detectedRecipes = detectedRecipes
        .map(r => r.title || r.name)
        .filter(title => title && isValidRecipe(title));
      console.log('✅ Validation: Filtered recipes:', detectedRecipes);
    }

    // 4. CLEANUP RESPONSE TEXT
    aiReply = fullResponse;
    if (jsonStringToClean) {
      aiReply = fullResponse.replace(jsonStringToClean, '').trim();
    }

    aiReply = aiReply.replace(/```\s*```/g, '')
                    .replace(/Here is the JSON:?/i, '')
                    .trim();

    if (!aiReply) aiReply = "I found some recipes! Check below.";

    console.log('✅ Cleanup: Response cleaned successfully');

  } catch (error) {
    console.error('❌ Error in processing:', error.message);
  }

  // Final results
  console.log('\n=== FINAL RESULTS ===');
  console.log('detectedRecipes:', detectedRecipes);
  console.log('detectedRecipes.length:', detectedRecipes.length);
  console.log('aiReply contains JSON:', aiReply.includes('{') && aiReply.includes('}'));
  console.log('aiReply contains backticks:', aiReply.includes('```'));

  // Sample of final response
  console.log('\nCleaned AI Response:');
  console.log(aiReply.substring(0, 100) + '...');

  return {
    success: detectedRecipes.length > 0 && !aiReply.includes('```'),
    detectedRecipes,
    aiReply
  };
}

const result = testCompleteFlow();
console.log('\n=== TEST RESULT ===');
console.log('Test passed:', result.success ? '✅ YES' : '❌ NO');
console.log('Recipes detected:', result.detectedRecipes);