import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';
import OrderAssignment from '@/lib/backend/models/orderAssignment.model';
import User from '@/lib/backend/models/user.model';
import { orderAssignmentService } from '@/lib/backend/services/orderAssignmentService';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const user = verifyToken(request);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, assigned, accepted, in_transit, delivered, cancelled, failed
    const assignedTo = searchParams.get('assignedTo'); // delivery partner ID
    const orderId = searchParams.get('orderId');
    const priority = searchParams.get('priority'); // low, medium, high, urgent
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (orderId) {
      query.orderId = orderId;
    }

    if (priority) {
      query.priority = priority;
    }

    // Get total count for pagination
    const totalCount = await OrderAssignment.countDocuments(query);

    // Get order assignments with populated delivery partner details
    const assignments = await OrderAssignment.find(query)
      .populate('assignedTo', 'name phone email deliveryProfile.vehicleType deliveryProfile.vehicleNumber deliveryProfile.rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enhance assignments with additional data
    const enhancedAssignments = assignments.map(assignment => {
      const timeElapsed = Date.now() - new Date(assignment.createdAt).getTime();
      const isTimedOut = assignment.timeoutAt && new Date() > new Date(assignment.timeoutAt);
      
      return {
        ...assignment,
        timeElapsed: Math.round(timeElapsed / 1000), // seconds
        isTimedOut,
        formattedCreatedAt: new Date(assignment.createdAt).toLocaleString(),
        formattedAssignedAt: assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : null,
        formattedAcceptedAt: assignment.acceptedAt ? new Date(assignment.acceptedAt).toLocaleString() : null,
        responseTime: assignment.assignedAt && assignment.acceptedAt ? 
          Math.round((new Date(assignment.acceptedAt).getTime() - new Date(assignment.assignedAt).getTime()) / 1000) : null,
        assignmentHistory: assignment.assignmentHistory.map(history => ({
          ...history,
          formattedTimestamp: new Date(history.timestamp).toLocaleString()
        }))
      };
    });

    // Get summary statistics
    const summaryStats = await OrderAssignment.aggregate([
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          pendingAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          assignedAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0]
            }
          },
          acceptedAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
            }
          },
          inTransitAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'in_transit'] }, 1, 0]
            }
          },
          deliveredAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
            }
          },
          cancelledAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          },
          failedAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          },
          avgAttempts: {
            $avg: '$currentAttempt'
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $and: ['$assignedAt', '$acceptedAt'] },
                {
                  $divide: [
                    { $subtract: ['$acceptedAt', '$assignedAt'] },
                    1000
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);

    // Get timed out assignments count
    const timedOutCount = await OrderAssignment.countDocuments({
      status: 'assigned',
      timeoutAt: { $lt: new Date() }
    });

    return NextResponse.json({
      assignments: enhancedAssignments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + assignments.length < totalCount
      },
      summary: {
        ...(summaryStats[0] || {
          totalAssignments: 0,
          pendingAssignments: 0,
          assignedAssignments: 0,
          acceptedAssignments: 0,
          inTransitAssignments: 0,
          deliveredAssignments: 0,
          cancelledAssignments: 0,
          failedAssignments: 0,
          avgAttempts: 0,
          avgResponseTime: 0
        }),
        timedOutCount
      },
      message: 'Order assignments retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get order assignments error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const user = verifyToken(request);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { 
      assignmentId, 
      action, // 'updateStatus', 'reassign', 'cancel', 'extendTimeout', 'forceAssign'
      newStatus,
      newDeliveryPartnerId,
      notes,
      priority
    } = await request.json();

    if (!assignmentId || !action) {
      return NextResponse.json(
        { error: 'Assignment ID and action are required' },
        { status: 400 }
      );
    }

    const assignment = await OrderAssignment.findById(assignmentId);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Order assignment not found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'updateStatus':
        if (!newStatus) {
          return NextResponse.json(
            { error: 'New status is required' },
            { status: 400 }
          );
        }

        const validStatuses = ['pending', 'assigned', 'accepted', 'in_transit', 'delivered', 'cancelled', 'failed'];
        if (!validStatuses.includes(newStatus)) {
          return NextResponse.json(
            { error: 'Invalid status' },
            { status: 400 }
          );
        }

        assignment.status = newStatus;
        
        if (newStatus === 'delivered') {
          assignment.deliveredAt = new Date();
        } else if (newStatus === 'cancelled') {
          assignment.cancelledAt = new Date();
        } else if (newStatus === 'in_transit') {
          assignment.pickedUpAt = new Date();
        }

        if (notes) {
          assignment.adminNotes = notes;
        }

        await assignment.save();
        result = assignment;
        break;

      case 'reassign':
        if (!newDeliveryPartnerId) {
          return NextResponse.json(
            { error: 'New delivery partner ID is required' },
            { status: 400 }
          );
        }

        // Verify the new delivery partner exists and is available
        const newPartner = await User.findOne({ 
          _id: newDeliveryPartnerId, 
          role: 'delivery',
          'deliveryProfile.isActive': true,
          'deliveryProfile.isVerified': true
        });

        if (!newPartner) {
          return NextResponse.json(
            { error: 'Invalid or unavailable delivery partner' },
            { status: 400 }
          );
        }

        // Remove from old partner's assignments if applicable
        if (assignment.assignedTo) {
          await User.findByIdAndUpdate(assignment.assignedTo, {
            $pull: { 'deliveryProfile.currentAssignments.assignedOrderIds': assignment.orderId }
          });
        }

        // Assign to new partner
        result = await assignment.assignToDeliveryPartner(newDeliveryPartnerId);
        
        // Add to new partner's assignments
        await User.findByIdAndUpdate(newDeliveryPartnerId, {
          $addToSet: { 'deliveryProfile.currentAssignments.assignedOrderIds': assignment.orderId }
        });

        break;

      case 'cancel':
        assignment.status = 'cancelled';
        assignment.cancelledAt = new Date();
        assignment.adminNotes = notes || 'Cancelled by admin';

        // Remove from partner's assignments if applicable
        if (assignment.assignedTo) {
          await User.findByIdAndUpdate(assignment.assignedTo, {
            $pull: { 'deliveryProfile.currentAssignments.assignedOrderIds': assignment.orderId }
          });
        }

        await assignment.save();
        result = assignment;
        break;

      case 'extendTimeout':
        if (assignment.status === 'assigned') {
          const newTimeout = new Date();
          newTimeout.setSeconds(newTimeout.getSeconds() + 30); // Extend by 30 seconds
          assignment.timeoutAt = newTimeout;
          await assignment.save();
          result = assignment;
        } else {
          return NextResponse.json(
            { error: 'Can only extend timeout for assigned orders' },
            { status: 400 }
          );
        }
        break;

      case 'forceAssign':
        if (!newDeliveryPartnerId) {
          return NextResponse.json(
            { error: 'Delivery partner ID is required for force assignment' },
            { status: 400 }
          );
        }

        // Force assign even if partner is busy (admin override)
        result = await assignment.assignToDeliveryPartner(newDeliveryPartnerId);
        
        await User.findByIdAndUpdate(newDeliveryPartnerId, {
          $addToSet: { 'deliveryProfile.currentAssignments.assignedOrderIds': assignment.orderId }
        });

        break;

      case 'updatePriority':
        if (priority) {
          assignment.priority = priority;
          await assignment.save();
          result = assignment;
        } else {
          return NextResponse.json(
            { error: 'Priority is required' },
            { status: 400 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Populate delivery partner details in result
    const populatedResult = await OrderAssignment.findById(result._id)
      .populate('assignedTo', 'name phone email deliveryProfile.vehicleType deliveryProfile.vehicleNumber');

    return NextResponse.json({
      message: `Assignment ${action} successful`,
      assignment: populatedResult,
      action
    });

  } catch (error: any) {
    console.error('Update order assignment error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const user = verifyToken(request);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const assignment = await OrderAssignment.findById(assignmentId);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Order assignment not found' },
        { status: 404 }
      );
    }

    // Can only delete pending or failed assignments
    if (!['pending', 'failed', 'cancelled'].includes(assignment.status)) {
      return NextResponse.json(
        { error: 'Can only delete pending, failed, or cancelled assignments' },
        { status: 400 }
      );
    }

    // Remove from partner's assignments if applicable
    if (assignment.assignedTo) {
      await User.findByIdAndUpdate(assignment.assignedTo, {
        $pull: { 'deliveryProfile.currentAssignments.assignedOrderIds': assignment.orderId }
      });
    }

    await OrderAssignment.findByIdAndDelete(assignmentId);

    return NextResponse.json({
      message: 'Order assignment deleted successfully',
      assignmentId
    });

  } catch (error: any) {
    console.error('Delete order assignment error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for bulk operations
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const user = verifyToken(request);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { action, assignmentIds, newStatus, newDeliveryPartnerId } = await request.json();

    if (!action || !assignmentIds || !Array.isArray(assignmentIds)) {
      return NextResponse.json(
        { error: 'Action and assignment IDs array are required' },
        { status: 400 }
      );
    }

    let results = [];

    switch (action) {
      case 'bulkUpdateStatus':
        if (!newStatus) {
          return NextResponse.json(
            { error: 'New status is required for bulk update' },
            { status: 400 }
          );
        }

        const updateResult = await OrderAssignment.updateMany(
          { _id: { $in: assignmentIds } },
          { 
            status: newStatus,
            ...(newStatus === 'cancelled' && { cancelledAt: new Date() }),
            ...(newStatus === 'delivered' && { deliveredAt: new Date() })
          }
        );

        results = { modifiedCount: updateResult.modifiedCount };
        break;

      case 'bulkReassign':
        if (!newDeliveryPartnerId) {
          return NextResponse.json(
            { error: 'New delivery partner ID is required for bulk reassign' },
            { status: 400 }
          );
        }

        // Process each assignment individually for proper tracking
        for (const assignmentId of assignmentIds) {
          try {
            const assignment = await OrderAssignment.findById(assignmentId);
            if (assignment && assignment.status === 'assigned') {
              await assignment.assignToDeliveryPartner(newDeliveryPartnerId);
              results.push({ assignmentId, success: true });
            } else {
              results.push({ assignmentId, success: false, reason: 'Not in assigned status' });
            }
          } catch (error) {
            results.push({ assignmentId, success: false, reason: error.message });
          }
        }
        break;

      case 'handleTimeouts':
        // Process all timed out assignments
        const timeoutResult = await orderAssignmentService.handleTimeoutAndReassign();
        results = timeoutResult;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid bulk action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Bulk ${action} completed`,
      results,
      action
    });

  } catch (error: any) {
    console.error('Bulk order assignment operation error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 