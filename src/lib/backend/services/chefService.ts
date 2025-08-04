import connectDB from '@/lib/backend/database';
import ChefEventRequest from '@/lib/backend/models/chefEvent.model';
import Chef from '@/lib/backend/models/chef.model';

export interface ChefNotification {
  id: string;
  type: 'new_request' | 'event_reminder' | 'customer_message' | 'rating_received';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  eventId?: string;
  customerId?: string;
}

export class ChefService {
  // Get chef notifications
  static async getChefNotifications(chefId: string): Promise<ChefNotification[]> {
    try {
      await connectDB();

      const notifications: ChefNotification[] = [];

      // Get new event requests
      const newRequests = await ChefEventRequest.find({
        'chef.id': chefId,
        status: 'chef_assigned',
        'timeline.respondedAt': { $exists: false }
      }).sort({ 'timeline.assignedAt': -1 });

      newRequests.forEach(request => {
        notifications.push({
          id: `new_request_${request._id}`,
          type: 'new_request',
          title: 'New Event Request',
          message: `New ${request.eventDetails.type} event request for ${request.eventDetails.guestCount} guests`,
          timestamp: request.timeline.assignedAt || request.timeline.requestedAt,
          read: false,
          eventId: request._id.toString(),
          customerId: request.customer.id
        });
      });

      // Get upcoming events (within 24 hours)
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);

      const upcomingEvents = await ChefEventRequest.find({
        'chef.id': chefId,
        status: 'confirmed',
        'eventDetails.date': {
          $gte: new Date(),
          $lte: tomorrow
        }
      });

      upcomingEvents.forEach(event => {
        notifications.push({
          id: `reminder_${event._id}`,
          type: 'event_reminder',
          title: 'Upcoming Event',
          message: `You have an event "${event.eventDetails.title}" scheduled soon`,
          timestamp: new Date(),
          read: false,
          eventId: event._id.toString(),
          customerId: event.customer.id
        });
      });

      // Get unread customer messages
      const unreadMessages = await ChefEventRequest.find({
        'chef.id': chefId,
        'communication.messages': {
          $elemMatch: {
            sender: 'customer',
            read: false
          }
        }
      });

      unreadMessages.forEach(event => {
        const lastMessage = event.communication.messages
          .filter(msg => msg.sender === 'customer' && !msg.read)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        if (lastMessage) {
          notifications.push({
            id: `message_${event._id}_${lastMessage.timestamp.getTime()}`,
            type: 'customer_message',
            title: 'New Message',
            message: `Message from ${event.customer.name}: ${lastMessage.message.substring(0, 50)}...`,
            timestamp: lastMessage.timestamp,
            read: false,
            eventId: event._id.toString(),
            customerId: event.customer.id
          });
        }
      });

      // Sort notifications by timestamp (newest first)
      return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      console.error('Error fetching chef notifications:', error);
      return [];
    }
  }

  // Mark event messages as read
  static async markMessagesAsRead(chefId: string, eventId: string): Promise<boolean> {
    try {
      await connectDB();

      await ChefEventRequest.updateOne(
        {
          _id: eventId,
          'chef.id': chefId
        },
        {
          $set: {
            'communication.messages.$[elem].read': true
          }
        },
        {
          arrayFilters: [
            { 'elem.sender': 'customer', 'elem.read': false }
          ]
        }
      );

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Get chef dashboard stats
  static async getChefDashboardStats(chefId: string) {
    try {
      await connectDB();

      const stats = await ChefEventRequest.aggregate([
        { $match: { 'chef.id': chefId } },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            completedEvents: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            pendingEvents: {
              $sum: { $cond: [{ $in: ['$status', ['chef_assigned', 'accepted', 'confirmed']] }, 1, 0] }
            },
            totalEarnings: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$payment.amount', 0] }
            },
            avgRating: {
              $avg: { $cond: [{ $exists: ['$rating.customerRating.stars'] }, '$rating.customerRating.stars', null] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalEvents: 0,
        completedEvents: 0,
        pendingEvents: 0,
        totalEarnings: 0,
        avgRating: 5.0
      };

      // Get recent events
      const recentEvents = await ChefEventRequest.find({
        'chef.id': chefId
      })
      .sort({ 'timeline.requestedAt': -1 })
      .limit(5)
      .select('eventDetails.title eventDetails.date status customer.name');

      return {
        ...result,
        recentEvents
      };

    } catch (error) {
      console.error('Error fetching chef dashboard stats:', error);
      return {
        totalEvents: 0,
        completedEvents: 0,
        pendingEvents: 0,
        totalEarnings: 0,
        avgRating: 5.0,
        recentEvents: []
      };
    }
  }

  // Update chef availability status
  static async updateChefAvailability(chefId: string, status: 'available' | 'busy' | 'offline'): Promise<boolean> {
    try {
      await connectDB();

      await Chef.findByIdAndUpdate(chefId, {
        $set: {
          'chefProfile.availability.status': status,
          'chefProfile.availability.lastStatusUpdate': new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating chef availability:', error);
      return false;
    }
  }
}