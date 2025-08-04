import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/backend/utils/jwt';
import orderAssignmentService from '@/lib/backend/services/orderAssignmentService';
import OrderAssignment from '@/lib/backend/models/orderAssignment.model';

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
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

    // Only delivery partners can accept/reject assignments
    if (decoded.role !== 'delivery') {
      return NextResponse.json(
        { error: 'Only delivery partners can respond to assignments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, reason } = body; // action: 'accept' or 'reject'
    const orderId = params.orderId;
    const deliveryPartnerId = decoded.userId;

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Verify the assignment exists and is assigned to this partner
    const assignment = await OrderAssignment.findOne({
      orderId,
      assignedTo: deliveryPartnerId,
      status: 'assigned'
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not assigned to you' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      const success = await orderAssignmentService.acceptAssignment(orderId, deliveryPartnerId);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Assignment accepted successfully',
          orderId,
          status: 'accepted'
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to accept assignment' },
          { status: 500 }
        );
      }
    } else if (action === 'reject') {
      const success = await orderAssignmentService.rejectAssignment(
        orderId, 
        deliveryPartnerId, 
        reason
      );
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Assignment rejected successfully',
          orderId,
          status: 'rejected',
          reason
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to reject assignment' },
          { status: 500 }
        );
      }
    }

  } catch (error: any) {
    console.error('Assignment response error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
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

    const orderId = params.orderId;

    // Get assignment details
    const assignment = await OrderAssignment.findOne({ orderId });
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = decoded.role === 'admin';
    const isAssignedDeliveryPartner = decoded.role === 'delivery' && assignment.assignedTo === decoded.userId;
    const isCustomer = decoded.role === 'customer' && assignment.customerId === decoded.userId;

    if (!isAdmin && !isAssignedDeliveryPartner && !isCustomer) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this assignment' },
        { status: 403 }
      );
    }

    // Return appropriate level of detail based on role
    let responseData;

    if (isAdmin) {
      // Admins get full details
      responseData = assignment;
    } else if (isAssignedDeliveryPartner) {
      // Delivery partners get order details they need
      responseData = {
        orderId: assignment.orderId,
        status: assignment.status,
        restaurantLocation: assignment.restaurantLocation,
        customerLocation: assignment.customerLocation,
        orderSummary: assignment.orderSummary,
        assignedAt: assignment.assignedAt,
        timeoutAt: assignment.timeoutAt,
        priority: assignment.priority
      };
    } else if (isCustomer) {
      // Customers get limited info about their order's assignment status
      responseData = {
        orderId: assignment.orderId,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        acceptedAt: assignment.acceptedAt,
        currentAttempt: assignment.currentAttempt
      };
    }

    return NextResponse.json({
      success: true,
      assignment: responseData
    });

  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 