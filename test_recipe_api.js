// Simple test script to check if the recipe card API is working
const http = require('http');

const testData = {
  message: "I want to make beef stew and chicken fajitas tonight"
};

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/ai/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testData))
  }
};

console.log('Testing CookMate API for recipe card generation...');
console.log('Request:', testData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers));

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      // Check if recipe cards are being generated
      if (response.response && response.response.detectedRecipes) {
        console.log('\n✅ Recipe cards detected:', response.response.detectedRecipes.length);
        console.log('Recipes:', response.response.detectedRecipes);
      } else {
        console.log('\n❌ No recipe cards found in response');
      }
    } catch (e) {
      console.log('Failed to parse response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e);
});

req.write(JSON.stringify(testData));
req.end();