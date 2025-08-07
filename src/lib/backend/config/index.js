const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/foodfly',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3003',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: [
    'https://foodfly.co',
    'https://www.foodfly.co',
    'https://api.foodfly.co'
  ]
};

module.exports = { config }; 