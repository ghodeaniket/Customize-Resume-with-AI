// test-openrouter.js
const axios = require('axios');
const config = require('./config/config');

// Initialize OpenRouter client
const openrouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${config.openrouter.apiKey}`,
    'HTTP-Referer': config.openrouter.serviceUrl,
    'Content-Type': 'application/json'
  }
});

async function testOpenRouter() {
  try {
    console.log('Testing OpenRouter API with key:', config.openrouter.apiKey.substring(0, 5) + '...');
    
    const response = await openrouterClient.post('/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: [
        { role: "user", content: "Hello, can you tell me a short joke?" }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    console.log('OpenRouter API test successful!');
    console.log('Response:', response.data.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('Error testing OpenRouter API:');
    console.error('Status:', error.response ? error.response.status : 'N/A');
    console.error('Message:', error.message);
    
    if (error.response && error.response.data) {
      console.error('Response data:', error.response.data);
    }
    
    console.error('Please check your OpenRouter API key in config/config.js');
    return false;
  }
}

// Run the test
testOpenRouter();
