// Debug the specific case from user feedback
function safeJSONParse(str) {
  try {
    const cleaned = str.replace(/,\s*}/g, "}")
                      .replace(/,\s*]/g, "]")
                      .replace(/\s+/g, ' ')
                      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse failed:", e.message);
    return null;
  }
}

function debugSpecificCase() {
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

  console.log('=== Debugging Specific JSON Leak Case ===');
  console.log('Response length:', userFeedbackResponse.length);
  console.log('Contains JSON block:', userFeedbackResponse.includes('```json'));

  // Test our current regex
  const markdownMatch = userFeedbackResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  console.log('Markdown match found:', !!markdownMatch);

  if (markdownMatch) {
    console.log('Match[0] (full block):', JSON.stringify(markdownMatch[0].substring(0, 50)) + '...');
    console.log('Match[1] (content):', JSON.stringify(markdownMatch[1].substring(0, 50)) + '...');

    // Test JSON parsing
    const parsed = safeJSONParse(markdownMatch[1]);
    console.log('Parsed result:', parsed);

    // Test cleanup
    let cleanedResponse = userFeedbackResponse.replace(markdownMatch[0], '').trim();
    console.log('After removing JSON block:', cleanedResponse.includes('```json') ? '❌ STILL CONTAINS JSON' : '✅ JSON REMOVED');
    console.log('Cleaned response length:', cleanedResponse.length);

    // Check if the response is properly cleaned
    const finalCleaned = cleanedResponse.replace(/```\s*```/g, '')
                                      .replace(/Here is the JSON:?/i, '')
                                      .trim();

    console.log('Final check - contains backticks:', finalCleaned.includes('```') ? '❌ YES' : '✅ NO');
    console.log('Final check - contains JSON:', finalCleaned.includes('{') && finalCleaned.includes('}') ? '❌ YES' : '✅ NO');

    return {
      success: !finalCleaned.includes('```') && !finalCleaned.includes('{'),
      finalCleaned
    };
  } else {
    console.log('❌ No markdown match found!');
    return { success: false };
  }
}

const result = debugSpecificCase();
console.log('\n=== DEBUG RESULT ===');
console.log('JSON removal successful:', result.success ? '✅ YES' : '❌ NO');

if (!result.success) {
  console.log('\nSample of final response:');
  console.log(result.finalCleaned.substring(0, 200) + '...');
}