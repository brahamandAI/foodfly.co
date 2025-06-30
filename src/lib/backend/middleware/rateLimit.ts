import rateLimit from 'express-rate-limit';

// Create a default limiter
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Export both the default limiter and a function to create new limiters
export { defaultLimiter as rateLimiter };
export const createRateLimiter = (options: any) => rateLimit(options); 