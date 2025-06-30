import { Server } from 'socket.io';
import { Notification } from '../models/notification.model';
import { User } from '../models/user.model';

export class NotificationService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      // Join user's room
      socket.on('join', (userId: string) => {
        socket.join(userId);
      });

      // Leave user's room
      socket.on('leave', (userId: string) => {
        socket.leave(userId);
      });
    });
  }

  async createNotification(data: {
    userId: string;
    type: 'order' | 'delivery' | 'promo' | 'system';
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      const notification = await Notification.create({
        user: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: false,
      });

      // Emit notification to user's room
      this.io.to(data.userId).emit('notification', notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string) {
    try {
      return await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Helper methods for common notification types
  async notifyOrderStatus(userId: string, orderId: string, status: string) {
    return this.createNotification({
      userId,
      type: 'order',
      title: 'Order Update',
      message: `Your order #${orderId} is now ${status}`,
      data: { orderId, status },
    });
  }

  async notifyDeliveryUpdate(userId: string, orderId: string, status: string) {
    return this.createNotification({
      userId,
      type: 'delivery',
      title: 'Delivery Update',
      message: `Your delivery for order #${orderId} is ${status}`,
      data: { orderId, status },
    });
  }

  async notifyPromo(userId: string, promoCode: string, discount: number) {
    return this.createNotification({
      userId,
      type: 'promo',
      title: 'New Promotion',
      message: `Use code ${promoCode} for ${discount}% off your next order!`,
      data: { promoCode, discount },
    });
  }

  async notifySystem(userId: string, title: string, message: string) {
    return this.createNotification({
      userId,
      type: 'system',
      title,
      message,
    });
  }

  async sendOrderConfirmation(userId: string, orderId: string) {
    return this.createNotification({
      userId,
      type: 'order',
      title: 'Order Confirmed',
      message: `Your order has been confirmed and is being prepared!`,
      data: { orderId, status: 'confirmed' },
    });
  }
}

// Export a singleton instance for use in other modules
let notificationServiceInstance: NotificationService | null = null;

export const initializeNotificationService = (io: Server) => {
  notificationServiceInstance = new NotificationService(io);
  return notificationServiceInstance;
};

export const getNotificationService = () => {
  if (!notificationServiceInstance) {
    throw new Error('NotificationService not initialized. Call initializeNotificationService first.');
  }
  return notificationServiceInstance;
}; 