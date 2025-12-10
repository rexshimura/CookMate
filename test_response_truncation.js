// Test for response truncation issues
function testResponseTruncation() {
  const sampleResponse = `You want more recipes, huh? Alright, let's talk about some other dishes.

If you like the sound of the Chicken Fajitas, you might also enjoy some Beef Fajitas or even some Shrimp Fajitas. We could also explore some other Mexican dishes like Chicken Quesadillas or Beef Tacos. Or, if you're in the mood for something a bit different, we could look at some Asian-inspired recipes like Chicken Stir-Fry or Beef and Broccoli Stir-Fry.

Which of these sounds most appealing to you? I can provide more details about any of these recipes or suggest even more options if you'd like!`;

  console.log('=== Testing Response Truncation ===');
  console.log('Original response length:', sampleResponse.length);

  // Simulate our current cleanup logic
  let processedResponse = sampleResponse;

  // Apply JSON cleanup (should not affect this response)
  processedResponse = processedResponse.replace(/```\s*```/g, '')
                                    .replace(/Here is the JSON:?/i, '')
                                    .trim();

  // Apply content cleanup (should not affect this conversational response)
  processedResponse = processedResponse.replace(/Ingredients?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                      .replace(/Instructions?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                      .replace(/Directions?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                      .replace(/Steps?\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                      .replace(/Method\s*:?[\s\S]*?(?=\n\s*[A-Z][a-z]|\n\s*This|\n\s*[A-Z][a-z].*recipe|$)/gi, '')
                                      // Remove bullet point lists
                                      .replace(/^\s*[•\-*]\s*.*(\n\s*[•\-*]\s*.*)*/gm, '')
                                      // Remove numbered lists
                                      .replace(/^\s*\d+\.\s*.*(\n\s*\d+\.\s*.*)*/gm, '')
                                      .trim();

  console.log('Processed response length:', processedResponse.length);
  console.log('Response preserved:', processedResponse === sampleResponse);

  if (processedResponse !== sampleResponse) {
    console.log('❌ Response was modified!');
    console.log('Original:', sampleResponse);
    console.log('Processed:', processedResponse);
  } else {
    console.log('✅ Response preserved correctly');
  }

  // Test the fallback logic that might cause truncation
  const emptyResponse = '';
  let fallbackResponse = emptyResponse.replace(/```\s*```/g, '')
                                    .replace(/Here is the JSON:?/i, '')
                                    .trim();

  if (!fallbackResponse) {
    fallbackResponse = "I found some recipes! Check below.";
    console.log('✅ Fallback works correctly');
  } else {
    console.log('❌ Fallback logic issue');
  }

  return {
    success: processedResponse === sampleResponse && fallbackResponse === "I found some recipes! Check below.",
    processedResponse
  };
}

const result = testResponseTruncation();
console.log('\n=== TEST RESULT ===');
console.log('Truncation test passed:', result.success ? '✅ YES' : '❌ NO');