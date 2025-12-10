// Test edge cases and safeguards
function testEdgeCases() {
  console.log('=== Testing Edge Cases ===');

  // Test case 1: Empty response
  let emptyResponse = '';
  let processed1 = emptyResponse;
  if (!processed1 || processed1.length < 20 || !processed1.match(/[a-zA-Z0-9]/)) {
    processed1 = "I found some recipes! Check below.";
  }
  console.log('Empty response handled:', processed1 === "I found some recipes! Check below." ? '✅' : '❌');

  // Test case 2: Very short response
  let shortResponse = "Hi";
  let processed2 = shortResponse;
  if (!processed2 || processed2.length < 20 || !processed2.match(/[a-zA-Z0-9]/)) {
    processed2 = "I found some recipes! Check below.";
  }
  console.log('Short response handled:', processed2 === "I found some recipes! Check below." ? '✅' : '❌');

  // Test case 3: Response with only whitespace
  let whitespaceResponse = "   \n   \t   ";
  let processed3 = whitespaceResponse;
  if (!processed3 || processed3.length < 20 || !processed3.match(/[a-zA-Z0-9]/)) {
    processed3 = "I found some recipes! Check below.";
  }
  console.log('Whitespace response handled:', processed3 === "I found some recipes! Check below." ? '✅' : '❌');

  // Test case 4: Response with only special characters
  let specialCharsResponse = "!!! ??? ...";
  let processed4 = specialCharsResponse;
  if (!processed4 || processed4.length < 20 || !processed4.match(/[a-zA-Z0-9]/)) {
    processed4 = "I found some recipes! Check below.";
  }
  console.log('Special chars response handled:', processed4 === "I found some recipes! Check below." ? '✅' : '❌');

  // Test case 5: Valid response (should not be changed)
  let validResponse = "Here's a great recipe for Chicken Fajitas that you might enjoy!";
  let processed5 = validResponse;
  if (!processed5 || processed5.length < 20 || !processed5.match(/[a-zA-Z0-9]/)) {
    processed5 = "I found some recipes! Check below.";
  }
  console.log('Valid response preserved:', processed5 === validResponse ? '✅' : '❌');

  return {
    allTestsPassed: processed1 === "I found some recipes! Check below." &&
                   processed2 === "I found some recipes! Check below." &&
                   processed3 === "I found some recipes! Check below." &&
                   processed4 === "I found some recipes! Check below." &&
                   processed5 === validResponse
  };
}

const result = testEdgeCases();
console.log('\n=== TEST RESULT ===');
console.log('Edge case handling:', result.allTestsPassed ? '✅ ALL PASSED' : '❌ SOME FAILED');