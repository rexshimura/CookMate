// Detailed test to see the raw AI response
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

console.log('=== DETAILED AI RESPONSE TEST ===');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Full Response:', JSON.stringify(response, null, 2));
      
      // Check the message content for JSON blocks
      const message = response.response?.message || '';
      console.log('\n🔍 AI Message Content:');
      console.log(message);
      
      // Look for JSON blocks in the response
      const jsonMatches = message.match(/```(?:json)?\s*([\s\S]*?)\s*```/gi);
      if (jsonMatches) {
        console.log('\n📋 Found JSON Blocks:', jsonMatches.length);
        jsonMatches.forEach((match, i) => {
          console.log(`JSON Block ${i + 1}:`, match);
        });
      } else {
        console.log('\n❌ No JSON blocks found in AI response');
      }
      
      console.log('\n🔍 Detected Recipes:', response.response?.detectedRecipes || []);
      
    } catch (e) {
      console.error('❌ Failed to parse response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e);
});

req.write(JSON.stringify(testData));
req.end();