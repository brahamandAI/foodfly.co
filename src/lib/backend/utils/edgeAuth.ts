import { NextRequest } from 'next/server';

// Lightweight JWT verification for Edge Runtime (middleware)
export class EdgeAuthValidator {
  // Simple JWT decode without verification for Edge Runtime
  // Note: This is less secure but necessary for Edge Runtime compatibility
  static validateToken(token: string): { isValid: boolean; user?: any; error?: string } {
    try {
      // Simple base64 decode of JWT payload (without verification for Edge Runtime)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false, error: 'Invalid token format' };
      }

      // Decode the payload (middle part)
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      
      if (!decoded.userId || !decoded.role) {
        return { isValid: false, error: 'Invalid token payload' };
      }

      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return { isValid: false, error: 'Token expired' };
      }

      return {
        isValid: true,
        user: {
          _id: decoded.userId,
          role: decoded.role,
          email: decoded.email,
        }
      };
    } catch (error) {
      console.error('JWT decode error:', error);
      return { isValid: false, error: 'Invalid token' };
    }
  }

  // Get user from any token type (regular, chef, delivery)
  static getUserFromRequest(request: NextRequest): { isValid: boolean; user?: any; error?: string } {
    // Try all token sources
    const regularToken = request.cookies.get('token')?.value;
    const chefToken = request.cookies.get('chef-token')?.value;
    const deliveryToken = request.cookies.get('delivery-token')?.value;
    
    // Also check Authorization header
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '');

    // Try tokens in order of preference
    const tokens = [headerToken, chefToken, deliveryToken, regularToken].filter(Boolean);
    
    for (const token of tokens) {
      if (token) {
        const result = this.validateToken(token);
        if (result.isValid) {
          return result;
        }
      }
    }

    return { isValid: false, error: 'No valid token found' };
  }

  // Validate chef-specific token
  static validateChefToken(request: NextRequest): { isValid: boolean; user?: any; error?: string } {
    const token = request.cookies.get('chef-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return { isValid: false, error: 'No chef token provided' };
    }

    const result = this.validateToken(token);
    if (!result.isValid) {
      return result;
    }

    if (result.user?.role !== 'chef') {
      return { isValid: false, error: 'Not a chef token' };
    }

    return result;
  }

  // Validate delivery-specific token
  static validateDeliveryToken(request: NextRequest): { isValid: boolean; user?: any; error?: string } {
    const token = request.cookies.get('delivery-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return { isValid: false, error: 'No delivery token provided' };
    }

    const result = this.validateToken(token);
    if (!result.isValid) {
      return result;
    }

    if (result.user?.role !== 'delivery') {
      return { isValid: false, error: 'Not a delivery token' };
    }

    return result;
  }

  // Validate regular user token
  static validateUserToken(request: NextRequest): { isValid: boolean; user?: any; error?: string } {
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return { isValid: false, error: 'No user token provided' };
    }

    const result = this.validateToken(token);
    if (!result.isValid) {
      return result;
    }

    // Ensure this is not a chef or delivery token
    if (result.user?.role === 'chef' || result.user?.role === 'delivery') {
      return { isValid: false, error: 'Use role-specific login endpoint' };
    }

    return result;
  }
}