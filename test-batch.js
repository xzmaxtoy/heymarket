import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testBatch() {
  try {
    // Send test batch to backend
    const response = await axios.post('http://localhost:3000/api/batch', {
      text: 'Test message from integration',
      recipients: [{
        phoneNumber: '3476811000',
        variables: {}
      }],
      options: {
        priority: 'normal'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HEYMARKET_API_KEY}`
      }
    });

    const backendBatch = response.data;

    console.log('Backend batch created:', backendBatch);
    
    // Poll for status updates
    const batchId = backendBatch.data.batchId;
    let complete = false;
    
    while (!complete) {
      const statusResponse = await axios.get(`http://localhost:3000/api/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.HEYMARKET_API_KEY}`
        }
      });
      const status = statusResponse.data;
      
      console.log('Batch status:', {
        status: status.data.status,
        progress: status.data.progress
      });
      
      if (status.data.status === 'completed' || status.data.status === 'failed') {
        complete = true;
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before next poll
      }
    }

    console.log('Batch test completed');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBatch();
