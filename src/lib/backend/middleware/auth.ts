import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { config } from '../config';
import { NextRequest } from 'next/server';

export interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const isAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const isRestaurant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'restaurant') {
      return res.status(403).json({ error: 'Restaurant access required' });
    }
    next();
  } catch (error) {
    console.error('Restaurant check error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export interface AuthenticatedUser {
  _id: string;
  email: string;
  role: string;
}

export function verifyToken(request: NextRequest): AuthenticatedUser {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    // Handle different token formats - some use userId, some use _id
    const userId = decoded.userId || decoded._id || decoded.id;
    return {
      _id: userId,
      email: decoded.email,
      role: decoded.role || 'customer'
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    throw new Error('Invalid token');
  }
}

export function requireAuth(request: NextRequest): AuthenticatedUser {
  try {
    return verifyToken(request);
  } catch (error) {
    throw error;
  }
}

export function requireAdmin(request: NextRequest): AuthenticatedUser {
  const user = requireAuth(request);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
} 