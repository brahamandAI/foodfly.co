import crypto from 'crypto';
import { Session } from '../models/session.model';
import { generateToken, verifyToken } from './jwt';

export class SessionManager {
  // Create a hash of the token for secure storage
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Extract device info from request headers
  private static extractDeviceInfo(headers: any): any {
    return {
      userAgent: headers['user-agent'] || '',
      ip: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
      deviceType: this.detectDeviceType(headers['user-agent'] || ''),
    };
  }

  private static detectDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  // Create a new session and return the JWT token
  static async createSession(
    userId: string, 
    userType: 'customer' | 'chef' | 'delivery' | 'admin',
    requestHeaders?: any
  ): Promise<{ token: string; sessionId: string }> {
    try {
      // Generate JWT token
      const token = generateToken(userId, userType);
      const tokenHash = this.hashToken(token);
      
      // Extract device info
      const deviceInfo = requestHeaders ? this.extractDeviceInfo(requestHeaders) : undefined;
      
      // Create session in database
      const session = await Session.createSession(userId, userType, tokenHash, deviceInfo);
      
      console.log(`✅ Session created for ${userType} user:`, userId);
      
      return {
        token,
        sessionId: session._id.toString(),
      };
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  // Validate a session by token
  static async validateSession(token: string): Promise<{ isValid: boolean; user?: any; session?: any }> {
    try {
      // First verify the JWT token structure
      const decoded = verifyToken(token) as any;
      if (!decoded.userId || !decoded.role) {
        return { isValid: false };
      }

      // Check if session exists and is active in database
      const tokenHash = this.hashToken(token);
      const session = await Session.findActiveSession(tokenHash);
      
      if (!session) {
        console.log('❌ Session not found or inactive for token');
        return { isValid: false };
      }

      // Update last activity
      await session.updateActivity();
      
      // Populate user data
      await session.populate('userId');
      const user = session.userId as any;
      
      if (!user) {
        console.log('❌ User not found for session');
        await Session.invalidateSession(tokenHash);
        return { isValid: false };
      }

      // Verify user type matches
      if (user.role !== session.userType) {
        console.log('❌ User role mismatch with session type');
        await Session.invalidateSession(tokenHash);
        return { isValid: false };
      }

      console.log(`✅ Session validated for ${session.userType} user:`, user._id);
      
      return {
        isValid: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          chefProfile: user.chefProfile,
          deliveryProfile: user.deliveryProfile,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
        },
        session: {
          _id: session._id,
          userType: session.userType,
          lastActivity: session.lastActivity,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        }
      };
    } catch (error) {
      console.error('❌ Error validating session:', error);
      return { isValid: false };
    }
  }

  // Invalidate a specific session
  static async invalidateSession(token: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      await Session.invalidateSession(tokenHash);
      console.log('✅ Session invalidated');
    } catch (error) {
      console.error('❌ Error invalidating session:', error);
      throw new Error('Failed to invalidate session');
    }
  }

  // Invalidate all sessions for a user
  static async invalidateAllUserSessions(
    userId: string, 
    userType?: 'customer' | 'chef' | 'delivery' | 'admin'
  ): Promise<void> {
    try {
      await Session.invalidateAllUserSessions(userId, userType);
      console.log(`✅ All ${userType || 'user'} sessions invalidated for:`, userId);
    } catch (error) {
      console.error('❌ Error invalidating user sessions:', error);
      throw new Error('Failed to invalidate user sessions');
    }
  }

  // Get all active sessions for a user
  static async getUserSessions(
    userId: string, 
    userType?: 'customer' | 'chef' | 'delivery' | 'admin'
  ): Promise<any[]> {
    try {
      const sessions = await Session.findUserSessions(userId, userType);
      return sessions.map(session => ({
        _id: session._id,
        userType: session.userType,
        deviceInfo: session.deviceInfo,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      }));
    } catch (error) {
      console.error('❌ Error fetching user sessions:', error);
      return [];
    }
  }

  // Cleanup expired sessions (can be called periodically)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await Session.cleanupExpiredSessions();
      console.log('✅ Expired sessions cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up sessions:', error);
    }
  }

  // Extend session expiry
  static async extendSession(token: string, hours: number = 24): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const session = await Session.findActiveSession(tokenHash);
      
      if (!session) {
        return false;
      }

      await session.extend(hours);
      console.log('✅ Session extended');
      return true;
    } catch (error) {
      console.error('❌ Error extending session:', error);
      return false;
    }
  }
}