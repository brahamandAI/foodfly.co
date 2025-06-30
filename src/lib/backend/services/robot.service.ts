import { Server } from 'socket.io';
import Order from '../models/order.model';
import { NotificationService } from './notification.service';

interface RobotStatus {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  battery: number;
  status: 'moving' | 'waiting' | 'charging' | 'error';
  speed: number;
  estimatedArrival: Date;
  lastUpdated: Date;
}

export class RobotService {
  private io: Server;
  private notificationService: NotificationService;
  private robots: Map<string, RobotStatus>;

  constructor(io: Server, notificationService: NotificationService) {
    this.io = io;
    this.notificationService = notificationService;
    this.robots = new Map();
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      // Robot connects
      socket.on('robot_connect', (robotId: string) => {
        console.log(`Robot ${robotId} connected`);
        socket.join(`robot_${robotId}`);
      });

      // Robot disconnects
      socket.on('robot_disconnect', (robotId: string) => {
        console.log(`Robot ${robotId} disconnected`);
        socket.leave(`robot_${robotId}`);
      });

      // Robot status update
      socket.on('robot_status_update', async (data: { robotId: string; status: RobotStatus }) => {
        try {
          const { robotId, status } = data;
          this.robots.set(robotId, status);

          // Update order status if robot is assigned to an order
          const order = await Order.findOne({ 
            'deliveryMethod': 'robot',
            'status': { $in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] }
          });

          if (order) {
            // Update order with robot's current location
            order.currentLocation = {
              lat: status.location.lat,
              lng: status.location.lng,
              lastUpdated: new Date()
            };

            // Update order status based on robot status
            if (status.status === 'error') {
              order.status = 'cancelled';
              await this.notificationService.createNotification({
                userId: order.user.toString(),
                type: 'delivery',
                title: 'Delivery Issue',
                message: 'There was a technical issue with the robot. Your order has been cancelled.',
                data: { orderId: order._id }
              });
            }

            await order.save();

            // Emit update to all clients tracking this order
            this.io.to(`order_${order._id}`).emit('orderStatusUpdate', {
              orderId: order._id,
              status: order.status,
              currentLocation: order.currentLocation
            });
          }
        } catch (error) {
          console.error('Error handling robot status update:', error);
        }
      });
    });
  }

  // Assign robot to order
  async assignRobotToOrder(orderId: string, robotId: string) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const robot = this.robots.get(robotId);
      if (!robot) {
        throw new Error('Robot not found');
      }

      // Update order with robot information
      order.deliveryMethod = 'robot';
      order.status = 'confirmed';
      await order.save();

      // Notify restaurant and customer
      await this.notificationService.createNotification({
        userId: order.user.toString(),
        type: 'delivery',
        title: 'Robot Assigned',
        message: 'A robot has been assigned to deliver your order.',
        data: { orderId: order._id, robotId }
      });

      return { success: true, robot };
    } catch (error) {
      console.error('Error assigning robot to order:', error);
      throw error;
    }
  }

  // Get robot status
  getRobotStatus(robotId: string): RobotStatus | undefined {
    return this.robots.get(robotId);
  }

  // Get all available robots
  getAvailableRobots(): RobotStatus[] {
    return Array.from(this.robots.values()).filter(
      robot => robot.status === 'waiting' && robot.battery > 20
    );
  }
} 