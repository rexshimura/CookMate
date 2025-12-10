// Debug JSON parsing issue
function safeJSONParse(str) {
  try {
    console.log('Original string:', JSON.stringify(str));
    // Fix common AI JSON issues before parsing
    const cleaned = str.replace(/(?<!\\)\n/g, "\\n") // Escape newlines
                      .replace(/,\s*}/g, "}")        // Remove trailing commas
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

function debugJsonParsing() {
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
    console.log('markdownMatch[0]:', JSON.stringify(markdownMatch[0]));
    console.log('markdownMatch[1]:', JSON.stringify(markdownMatch[1]));

    // Test parsing
    const result = safeJSONParse(markdownMatch[1]);
    console.log('Parse result:', result);
  }
}

debugJsonParsing();