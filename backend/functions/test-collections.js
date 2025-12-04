// Test script for collections API
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5001/api';

async function testCollectionsAPI() {
  console.log('🧪 Testing Collections API...\n');

  try {
    // Test health check first
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    console.log('');

    // Test creating a collection
    console.log('2. Testing collection creation...');
    const collectionData = {
      name: 'Test Collection',
      description: 'A test collection created via API',
      color: '#FF6B6B',
      icon: 'folder'
    };

    const createResponse = await fetch(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(collectionData)
    });

    console.log('Create response status:', createResponse.status);
    const createResult = await createResponse.json();
    console.log('Create result:', createResult);

    if (createResponse.ok) {
      console.log('✅ Collection created successfully!');
      console.log('Collection ID:', createResult.collection?.id);
      console.log('');

      // Test getting collections
      console.log('3. Testing get collections...');
      const getResponse = await fetch(`${API_BASE_URL}/collections`, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      console.log('Get response status:', getResponse.status);
      const getResult = await getResponse.json();
      console.log('Get result:', JSON.stringify(getResult, null, 2));

      if (getResponse.ok) {
        console.log('✅ Collections retrieved successfully!');
        console.log('Number of collections:', getResult.collections?.length || 0);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCollectionsAPI();