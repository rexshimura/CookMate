// Test the fixed JSON parsing
function safeJSONParse(str) {
  try {
    // Fix common AI JSON issues before parsing
    const cleaned = str.replace(/,\s*}/g, "}")        // Remove trailing commas
                      .replace(/,\s*]/g, "]")
                      .replace(/\s+/g, ' ')           // Replace multiple whitespace with single space
                      .trim();
    console.log('Cleaned string:', JSON.stringify(cleaned));
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse failed:", e.message);
    return null;
  }
}

function testFixedJsonParsing() {
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

  // Test the regex match
  const markdownMatch = sampleResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  console.log('Markdown match found:', !!markdownMatch);
  if (markdownMatch) {
    console.log('markdownMatch[1]:', JSON.stringify(markdownMatch[1]));

    // Test parsing
    const result = safeJSONParse(markdownMatch[1]);
    console.log('Parse result:', result);

    if (result && result.recipes) {
      console.log('✅ SUCCESS: Recipes extracted:', result.recipes);
    } else {
      console.log('❌ FAILED: No recipes extracted');
    }
  }
}

testFixedJsonParsing();