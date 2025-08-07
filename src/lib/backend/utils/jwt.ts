import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (userId: string, role: string = 'customer') => {
  return jwt.sign(
    { userId, role },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwtSecret);
}; 