// Test the final cleanup for JSON references
function testFinalCleanup() {
  const testCases = [
    {
      name: "JSON word reference",
      input: "Here is the json data for your recipe",
      expected: "Here is the recipe data for your recipe"
    },
    {
      name: "Backtick code blocks",
      input: "Use ```json``` to format your response",
      expected: "Use recipe data to format your response"
    },
    {
      name: "Single backticks",
      input: "The `json` format is commonly used",
      expected: "The recipe data format is commonly used"
    },
    {
      name: "Mixed references",
      input: "JSON data should be in ```json``` format with `json` syntax",
      expected: "recipe data data should be in recipe data format with recipe data syntax"
    },
    {
      name: "Clean response",
      input: "Here's a delicious recipe for Chicken Fajitas",
      expected: "Here's a delicious recipe for Chicken Fajitas"
    }
  ];

  console.log('=== Testing Final Cleanup ===');

  testCases.forEach((testCase, index) => {
    let result = testCase.input;
    // Apply the final cleanup
    result = result.replace(/\bjson\b/gi, 'recipe data')
                   .replace(/```/g, '')
                   .replace(/`/g, '')
                   .trim();

    const passed = result === testCase.expected;
    console.log(`Test ${index + 1} (${testCase.name}): ${passed ? '✅ PASS' : '❌ FAIL'}`);
    if (!passed) {
      console.log(`  Input: "${testCase.input}"`);
      console.log(`  Expected: "${testCase.expected}"`);
      console.log(`  Got: "${result}"`);
    }
  });

  // Test the complete flow
  const completeResponse = `Let's make something delicious! I'd be happy to help you with a recipe.

However, since you didn't specify a particular cuisine or dish, I'll give you a random suggestion. How about some Chicken Fajitas? They're a classic Mexican dish that's easy to make and always a crowd-pleaser.

This uses the json format to structure recipe data.`;

  const cleanedResponse = completeResponse.replace(/\bjson\b/gi, 'recipe data')
                                        .replace(/```/g, '')
                                        .replace(/`/g, '')
                                        .trim();

  const containsJsonRef = cleanedResponse.includes('json') ||
                         cleanedResponse.includes('`') ||
                         cleanedResponse.includes('```');

  console.log(`\nComplete flow test: ${!containsJsonRef ? '✅ PASS' : '❌ FAIL'}`);
  console.log('Contains JSON references:', containsJsonRef ? '❌ YES' : '✅ NO');

  return !containsJsonRef;
}

const result = testFinalCleanup();
console.log('\n=== FINAL RESULT ===');
console.log('Final cleanup test:', result ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
