import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/backend/utils/jwt';
import orderAssignmentService from '@/lib/backend/services/orderAssignmentService';
import OrderAssignment from '@/lib/backend/models/orderAssignment.model';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Only allow admins or the system to create assignments
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'orderId', 'customerId', 'restaurantId', 
      'restaurantLocation', 'customerLocation', 'orderSummary'
    ];
    
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate location format
    if (!body.restaurantLocation.latitude || !body.restaurantLocation.longitude) {
      return NextResponse.json(
        { error: 'Restaurant location must include latitude and longitude' },
        { status: 400 }
      );
    }

    if (!body.customerLocation.latitude || !body.customerLocation.longitude) {
      return NextResponse.json(
        { error: 'Customer location must include latitude and longitude' },
        { status: 400 }
      );
    }

    // Validate order summary
    if (!body.orderSummary.totalAmount || !body.orderSummary.itemCount) {
      return NextResponse.json(
        { error: 'Order summary must include totalAmount and itemCount' },
        { status: 400 }
      );
    }

    // Create and assign order
    const assignment = await orderAssignmentService.createAndAssignOrder({
      orderId: body.orderId,
      customerId: body.customerId,
      restaurantId: body.restaurantId,
      restaurantLocation: body.restaurantLocation,
      customerLocation: body.customerLocation,
      orderSummary: body.orderSummary,
      priority: body.priority || 1,
      assignmentRadius: body.assignmentRadius || 5
    });

    return NextResponse.json(
      {
        success: true,
        assignment: {
          id: assignment._id,
          orderId: assignment.orderId,
          status: assignment.status,
          assignedTo: assignment.assignedTo,
          assignedAt: assignment.assignedAt,
          timeoutAt: assignment.timeoutAt,
          currentAttempt: assignment.currentAttempt,
          maxAttempts: assignment.maxAssignmentAttempts
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Order assignment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const deliveryPartnerId = url.searchParams.get('deliveryPartnerId');

    if (deliveryPartnerId && decoded.role === 'delivery') {
      // Get assignments for a specific delivery partner
      if (decoded.userId !== deliveryPartnerId) {
        return NextResponse.json(
          { error: 'Can only view your own assignments' },
          { status: 403 }
        );
      }

      const assignments = await orderAssignmentService.getPartnerAssignments(deliveryPartnerId);
      return NextResponse.json({
        success: true,
        assignments
      });
    }

    // For admins, allow querying by order ID or get all pending assignments
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (orderId) {
      // Get specific order assignment
      const assignment = await OrderAssignment.findOne({ orderId });
      if (!assignment) {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        assignment
      });
    }

    // Get all pending assignments
    const assignments = await OrderAssignment.find({ 
      status: { $in: ['pending', 'assigned'] }
    }).sort({ priority: -1, createdAt: 1 });

    return NextResponse.json({
      success: true,
      assignments
    });

  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 