import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '../utils/sessionManager';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
  session?: any;
}

export class DatabaseAuthMiddleware {
  // Validate session for any user type
  static async validateSession(request: NextRequest): Promise<{
    isValid: boolean;
    user?: any;
    session?: any;
    error?: string;
  }> {
    try {
      // Get token from cookies or authorization header
      const token = request.cookies.get('token')?.value || 
                   request.cookies.get('chef-token')?.value ||
                   request.cookies.get('delivery-token')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return { isValid: false, error: 'No token provided' };
      }

      // Validate session in database
      const validation = await SessionManager.validateSession(token);
      
      if (!validation.isValid) {
        return { isValid: false, error: 'Invalid or expired session' };
      }

      return {
        isValid: true,
        user: validation.user,
        session: validation.session
      };
    } catch (error) {
      console.error('Database auth middleware error:', error);
      return { isValid: false, error: 'Authentication failed' };
    }
  }

  // Validate chef-specific session
  static async validateChefSession(request: NextRequest): Promise<{
    isValid: boolean;
    chef?: any;
    session?: any;
    error?: string;
  }> {
    try {
      // Get chef-specific token
      const token = request.cookies.get('chef-token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return { isValid: false, error: 'No chef token provided' };
      }

      // Validate session in database
      const validation = await SessionManager.validateSession(token);
      
      if (!validation.isValid) {
        return { isValid: false, error: 'Invalid or expired chef session' };
      }

      // Ensure this is a chef session
      if (validation.user?.role !== 'chef') {
        return { isValid: false, error: 'Not a chef session' };
      }

      return {
        isValid: true,
        chef: validation.user,
        session: validation.session
      };
    } catch (error) {
      console.error('Chef auth middleware error:', error);
      return { isValid: false, error: 'Chef authentication failed' };
    }
  }

  // Validate regular user session (not chef or delivery)
  static async validateUserSession(request: NextRequest): Promise<{
    isValid: boolean;
    user?: any;
    session?: any;
    error?: string;
  }> {
    try {
      // Get regular user token
      const token = request.cookies.get('token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return { isValid: false, error: 'No user token provided' };
      }

      // Validate session in database
      const validation = await SessionManager.validateSession(token);
      
      if (!validation.isValid) {
        return { isValid: false, error: 'Invalid or expired user session' };
      }

      // Ensure this is NOT a chef or delivery session
      if (validation.user?.role === 'chef') {
        return { isValid: false, error: 'Chef users should use chef endpoints' };
      }

      if (validation.user?.role === 'delivery') {
        return { isValid: false, error: 'Delivery agents should use delivery endpoints' };
      }

      return {
        isValid: true,
        user: validation.user,
        session: validation.session
      };
    } catch (error) {
      console.error('User auth middleware error:', error);
      return { isValid: false, error: 'User authentication failed' };
    }
  }

  // Require authentication for API routes
  static requireAuth(allowedRoles?: string[]) {
    return async (request: NextRequest) => {
      const validation = await this.validateSession(request);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Authentication required' },
          { status: 401 }
        );
      }

      // Check role-based access if specified
      if (allowedRoles && !allowedRoles.includes(validation.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user and session to request (for TypeScript, this is just for documentation)
      const authenticatedRequest = request as AuthenticatedRequest;
      (authenticatedRequest as any).user = validation.user;
      (authenticatedRequest as any).session = validation.session;

      return null; // Continue to the actual handler
    };
  }

  // Require chef authentication
  static requireChefAuth() {
    return async (request: NextRequest) => {
      const validation = await this.validateChefSession(request);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Chef authentication required' },
          { status: 401 }
        );
      }

      // Add chef and session to request
      const authenticatedRequest = request as AuthenticatedRequest;
      (authenticatedRequest as any).user = validation.chef;
      (authenticatedRequest as any).session = validation.session;

      return null; // Continue to the actual handler
    };
  }

  // Require delivery authentication
  static requireDeliveryAuth() {
    return async (request: NextRequest) => {
      const validation = await this.validateDeliverySession(request);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Delivery authentication required' },
          { status: 401 }
        );
      }

      // Add delivery agent and session to request
      const authenticatedRequest = request as AuthenticatedRequest;
      (authenticatedRequest as any).user = validation.delivery;
      (authenticatedRequest as any).session = validation.session;

      return null; // Continue to the actual handler
    };
  }

  // Cleanup expired sessions (can be called periodically)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await SessionManager.cleanupExpiredSessions();
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}