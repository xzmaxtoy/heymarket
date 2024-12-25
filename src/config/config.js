import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  heymarketBaseUrl: 'https://api.heymarket.com/v1',
  heymarketApiKey: process.env.HEYMARKET_API_KEY,
  environment: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
