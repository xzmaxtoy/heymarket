#!/bin/bash

# Create a batch
echo "Creating batch..."
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/messages/batch" \
  -H "Authorization: Bearer sk_uPCtZENJgx" \
  -H "Content-Type: application/json" \
  -d '{
    "template": {
      "text": "Hello {{name}}, your order {{orderId}} is ready",
      "author": "Support Team"
    },
    "recipients": [
      {
        "phoneNumber": "3476811000",
        "variables": {
          "name": "Jesse",
          "orderId": "ORD123"
        }
      }
    ],
    "options": {
      "priority": "high",
      "retryStrategy": {
        "maxAttempts": 3,
        "backoffMinutes": 1
      }
    }
  }')

# Extract batch ID
BATCH_ID=$(echo $RESPONSE | grep -o '"batchId":"[^"]*' | cut -d'"' -f4)
echo "Batch ID: $BATCH_ID"

# Wait a moment for processing
sleep 2

# Get batch status
echo -e "\nGetting batch status..."
curl -s -X GET "http://localhost:3000/api/batch/$BATCH_ID" \
  -H "Authorization: Bearer sk_uPCtZENJgx" | json_pp

# Get batch results
echo -e "\nGetting batch results..."
curl -s -X GET "http://localhost:3000/api/batch/$BATCH_ID/results" \
  -H "Authorization: Bearer sk_uPCtZENJgx" | json_pp

# Get batch analytics
echo -e "\nGetting batch analytics..."
curl -s -X GET "http://localhost:3000/api/batch/$BATCH_ID/analytics" \
  -H "Authorization: Bearer sk_uPCtZENJgx" | json_pp

# Get batch errors
echo -e "\nGetting batch errors..."
curl -s -X GET "http://localhost:3000/api/batch/$BATCH_ID/errors" \
  -H "Authorization: Bearer sk_uPCtZENJgx" | json_pp
