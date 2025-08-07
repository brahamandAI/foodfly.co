import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

// Security middleware setup
export const setupSecurityMiddleware = (app: Express) => {
  // Basic security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  });
  app.use('/api/', limiter);

  // Request validation
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Validate content type
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!req.is('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type' });
      }
    }

    // Validate request size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 1024 * 1024) { // 1MB limit
      return res.status(413).json({ error: 'Request Entity Too Large' });
    }

    next();
  });

  // Error handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
  });
}; 