import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  heymarketBaseUrl: 'https://api.heymarket.com/v1',
  heymarketApiKey: process.env.HEYMARKET_API_KEY,
  environment: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  employeeListUrl: process.env.EMPLOYEE_LIST_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTg1J0pU183WUQ1vhF1LvUytmOQj9pW3Ug-lzZGdcQYcZcGI7OzALWHfPpat5r7JsCPypR10Lj3sSfR/pub?gid=1976861448&single=true&output=csv'
};
