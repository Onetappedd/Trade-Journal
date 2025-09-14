// Script to trigger the matching engine for the recent import
const fetch = require('node-fetch');

async function triggerMatchingEngine() {
  try {
    const response = await fetch('https://riskr.net/api/matching/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // This would need to be replaced with actual token
      },
      body: JSON.stringify({
        userId: '1be0b06d-ceff-4746-bf66-d33f2c0459cf',
        sinceImportRunId: 'd5921752-58b2-4230-9806-35ff9f5f8711'
      })
    });

    const result = await response.json();
    console.log('Matching engine result:', result);
  } catch (error) {
    console.error('Error triggering matching engine:', error);
  }
}

triggerMatchingEngine();
