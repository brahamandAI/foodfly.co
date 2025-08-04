// Edge Runtime compatible configuration
// Directly accesses process.env without dotenv
export const edgeConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
};