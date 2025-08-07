import User from '../models/user.model';
import OrderAssignment from '../models/orderAssignment.model';
import connectDB from '../database';

interface LocationPoint {
  latitude: number;
  longitude: number;
}

interface AssignmentRequest {
  orderId: string;
  customerId: string;
  restaurantId: string;
  restaurantLocation: LocationPoint & { address?: string };
  customerLocation: LocationPoint & { address?: string };
  orderSummary: {
    totalAmount: number;
    itemCount: number;
    specialInstructions?: string;
    estimatedPreparationTime?: number;
  };
  priority?: number;
  assignmentRadius?: number;
}

interface DeliveryPartnerScore {
  partnerId: string;
  score: number;
  distance: number;
  availability: string;
  acceptanceRate: number;
  avgResponseTime: number;
  currentLoad: number;
  isEligible: boolean;
  reason?: string;
}

class OrderAssignmentService {
  private readonly DEFAULT_TIMEOUT_SECONDS = 30;
  private readonly DEFAULT_RADIUS_KM = 5;
  private readonly MAX_ASSIGNMENT_ATTEMPTS = 3;

  /**
   * Create a new order assignment and attempt to assign it to a delivery partner
   */
  async createAndAssignOrder(request: AssignmentRequest): Promise<OrderAssignment> {
    await connectDB();
    
    try {
      // Create the order assignment record
      const assignment = new OrderAssignment({
        orderId: request.orderId,
        customerId: request.customerId,
        restaurantId: request.restaurantId,
        restaurantLocation: {
          type: 'Point',
          coordinates: [request.restaurantLocation.longitude, request.restaurantLocation.latitude],
          address: request.restaurantLocation.address
        },
        customerLocation: {
          type: 'Point',
          coordinates: [request.customerLocation.longitude, request.customerLocation.latitude],
          address: request.customerLocation.address
        },
        orderSummary: request.orderSummary,
        priority: request.priority || 1,
        assignmentRadius: request.assignmentRadius || this.DEFAULT_RADIUS_KM,
        status: 'pending'
      });

      await assignment.save();

      // Immediately attempt to assign to a delivery partner
      await this.attemptAssignment(assignment._id.toString());

      return assignment;
    } catch (error) {
      console.error('Error creating order assignment:', error);
      throw error;
    }
  }

  /**
   * Find available delivery partners near the restaurant
   */
  async findAvailableDeliveryPartners(
    restaurantLocation: LocationPoint,
    radiusKm: number = this.DEFAULT_RADIUS_KM
  ): Promise<DeliveryPartnerScore[]> {
    await connectDB();

    try {
      // Find delivery partners within radius who are online and not busy
      const availablePartners = await User.find({
        role: 'delivery',
        'deliveryProfile.isActive': true,
        'deliveryProfile.isVerified': true,
        'deliveryProfile.availability.status': { $in: ['online'] },
        'deliveryProfile.currentLocation': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [restaurantLocation.longitude, restaurantLocation.latitude]
            },
            $maxDistance: radiusKm * 1000 // Convert km to meters
          }
        }
      }).select(
        '_id name deliveryProfile.currentLocation deliveryProfile.availability ' +
        'deliveryProfile.performance deliveryProfile.currentAssignments deliveryProfile.vehicleType'
      );

      // Score each delivery partner
      const scoredPartners: DeliveryPartnerScore[] = [];

      for (const partner of availablePartners) {
        const score = await this.calculatePartnerScore(partner, restaurantLocation);
        scoredPartners.push(score);
      }

      // Sort by score (highest first) and filter out ineligible partners
      return scoredPartners
        .filter(p => p.isEligible)
        .sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error finding available delivery partners:', error);
      throw error;
    }
  }

  /**
   * Calculate a score for a delivery partner based on various factors
   */
  private async calculatePartnerScore(partner: any, restaurantLocation: LocationPoint): Promise<DeliveryPartnerScore> {
    const profile = partner.deliveryProfile;
    
    // Calculate distance
    const distance = this.calculateDistance(
      restaurantLocation,
      {
        latitude: profile.currentLocation.coordinates[1],
        longitude: profile.currentLocation.coordinates[0]
      }
    );

    // Check eligibility
    const currentLoad = profile.currentAssignments?.assignedOrderIds?.length || 0;
    const maxOrders = profile.currentAssignments?.maxConcurrentOrders || 1;
    const isEligible = currentLoad < maxOrders && profile.availability.status === 'online';

    // Calculate score (0-100)
    let score = 0;
    let reason = '';

    if (!isEligible) {
      reason = currentLoad >= maxOrders ? 'At capacity' : 'Not available';
    } else {
      // Distance factor (closer is better) - 40 points max
      const distanceScore = Math.max(0, 40 - (distance * 4));
      
      // Acceptance rate factor - 25 points max
      const acceptanceScore = (profile.performance.acceptanceRate / 100) * 25;
      
      // Response time factor (faster is better) - 20 points max
      const avgResponseTime = profile.performance.avgResponseTime || 30;
      const responseScore = Math.max(0, 20 - (avgResponseTime / 30) * 20);
      
      // Current load factor (less busy is better) - 15 points max
      const loadScore = Math.max(0, 15 - (currentLoad * 5));

      score = distanceScore + acceptanceScore + responseScore + loadScore;
    }

    return {
      partnerId: partner._id.toString(),
      score: Math.round(score),
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      availability: profile.availability.status,
      acceptanceRate: profile.performance.acceptanceRate,
      avgResponseTime: profile.performance.avgResponseTime,
      currentLoad,
      isEligible,
      reason
    };
  }

  /**
   * Attempt to assign an order to the best available delivery partner
   */
  async attemptAssignment(assignmentId: string): Promise<boolean> {
    await connectDB();

    try {
      const assignment = await OrderAssignment.findById(assignmentId);
      if (!assignment || assignment.status !== 'pending') {
        return false;
      }

      // Check if we've exceeded max attempts
      if (assignment.currentAttempt >= assignment.maxAssignmentAttempts) {
        assignment.status = 'failed';
        await assignment.save();
        return false;
      }

      // Find available delivery partners
      const restaurantLocation = {
        latitude: assignment.restaurantLocation.coordinates[1],
        longitude: assignment.restaurantLocation.coordinates[0]
      };

      const availablePartners = await this.findAvailableDeliveryPartners(
        restaurantLocation,
        assignment.assignmentRadius
      );

      if (availablePartners.length === 0) {
        console.log('No available delivery partners found for assignment:', assignmentId);
        return false;
      }

      // Get the best available partner
      const bestPartner = availablePartners[0];
      
      // Update assignment
      await assignment.assignToDeliveryPartner(bestPartner.partnerId, this.DEFAULT_TIMEOUT_SECONDS);

      // Update delivery partner's assigned orders
      await User.findByIdAndUpdate(bestPartner.partnerId, {
        $push: { 'deliveryProfile.currentAssignments.assignedOrderIds': assignment.orderId }
      });

      assignment.eligibleDeliveryPartners = availablePartners.map(p => p.partnerId);
      assignment.lastAssignmentCheck = new Date();
      await assignment.save();

      console.log(`Order ${assignment.orderId} assigned to delivery partner ${bestPartner.partnerId}`);
      return true;

    } catch (error) {
      console.error('Error attempting assignment:', error);
      return false;
    }
  }

  /**
   * Handle timeout and reassign to next best partner
   */
  async handleTimeoutAndReassign(): Promise<void> {
    await connectDB();

    try {
      const timedOutAssignments = await OrderAssignment.findTimedOutAssignments();
      
      for (const assignment of timedOutAssignments) {
        console.log(`Handling timeout for order ${assignment.orderId}`);
        
        // Remove from current partner's assigned orders
        if (assignment.assignedTo) {
          await User.findByIdAndUpdate(assignment.assignedTo, {
            $pull: { 'deliveryProfile.currentAssignments.assignedOrderIds': assignment.orderId }
          });
        }

        // Handle timeout
        await assignment.handleTimeout();

        // Attempt reassignment
        await this.attemptAssignment(assignment._id.toString());
      }
    } catch (error) {
      console.error('Error handling timeouts:', error);
    }
  }

  /**
   * Accept an order assignment
   */
  async acceptAssignment(orderId: string, deliveryPartnerId: string): Promise<boolean> {
    await connectDB();

    try {
      const assignment = await OrderAssignment.findOne({ 
        orderId,
        assignedTo: deliveryPartnerId,
        status: 'assigned'
      });

      if (!assignment) {
        throw new Error('Assignment not found or not assigned to this partner');
      }

      // Accept the assignment
      await assignment.acceptAssignment(deliveryPartnerId);

      // Update delivery partner status
      await User.findByIdAndUpdate(deliveryPartnerId, {
        $pull: { 'deliveryProfile.currentAssignments.assignedOrderIds': orderId },
        $set: { 
          'deliveryProfile.currentAssignments.activeOrderId': orderId,
          'deliveryProfile.availability.status': 'busy'
        }
      });

      console.log(`Order ${orderId} accepted by delivery partner ${deliveryPartnerId}`);
      return true;

    } catch (error) {
      console.error('Error accepting assignment:', error);
      throw error;
    }
  }

  /**
   * Reject an order assignment
   */
  async rejectAssignment(orderId: string, deliveryPartnerId: string, reason?: string): Promise<boolean> {
    await connectDB();

    try {
      const assignment = await OrderAssignment.findOne({ 
        orderId,
        assignedTo: deliveryPartnerId,
        status: 'assigned'
      });

      if (!assignment) {
        throw new Error('Assignment not found or not assigned to this partner');
      }

      // Reject the assignment
      await assignment.rejectAssignment(deliveryPartnerId, reason);

      // Remove from delivery partner's assigned orders
      await User.findByIdAndUpdate(deliveryPartnerId, {
        $pull: { 'deliveryProfile.currentAssignments.assignedOrderIds': orderId }
      });

      console.log(`Order ${orderId} rejected by delivery partner ${deliveryPartnerId}. Reason: ${reason}`);

      // Attempt to reassign to next best partner
      await this.attemptAssignment(assignment._id.toString());

      return true;

    } catch (error) {
      console.error('Error rejecting assignment:', error);
      throw error;
    }
  }

  /**
   * Get current assignments for a delivery partner
   */
  async getPartnerAssignments(deliveryPartnerId: string): Promise<any[]> {
    await connectDB();

    try {
      const assignments = await OrderAssignment.find({
        assignedTo: deliveryPartnerId,
        status: { $in: ['assigned', 'accepted'] }
      }).sort({ assignedAt: -1 });

      return assignments;
    } catch (error) {
      console.error('Error getting partner assignments:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const orderAssignmentService = new OrderAssignmentService();
export default orderAssignmentService; 