import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';
import User from '@/lib/backend/models/user.model';

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
    const status = searchParams.get('status'); // online, offline, busy, break
    const zone = searchParams.get('zone');
    const verified = searchParams.get('verified'); // true, false
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { role: 'delivery' };

    if (status) {
      query['deliveryProfile.availability.status'] = status;
    }

    if (zone) {
      query['deliveryProfile.currentZone'] = { $regex: zone, $options: 'i' };
    }

    if (verified !== null && verified !== undefined) {
      query['deliveryProfile.isVerified'] = verified === 'true';
    }

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    // Get delivery partners with aggregation for performance metrics
    const deliveryPartners = await User.find(query)
      .select('-password -googleId')
      .sort({ 'deliveryProfile.joinedAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate additional metrics
    const partnersWithMetrics = deliveryPartners.map(partner => {
      const profile = partner.deliveryProfile;
      
      return {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        isEmailVerified: partner.isEmailVerified,
        createdAt: partner.createdAt,
        deliveryProfile: {
          ...profile,
          // Calculate derived metrics
          efficiency: profile?.performance ? 
            Math.round((profile.performance.completedDeliveries / 
            (profile.performance.completedDeliveries + profile.performance.cancelledDeliveries || 1)) * 100) : 0,
          avgEarnings: profile?.performance ? 
            (profile.performance.completedDeliveries * 50) : 0, // Assuming ₹50 per delivery
          lastActiveFormatted: profile?.availability?.lastStatusUpdate ? 
            new Date(profile.availability.lastStatusUpdate).toLocaleString() : 'Never',
          isOnline: profile?.availability?.status === 'online' || profile?.availability?.status === 'busy'
        }
      };
    });

    // Get summary statistics
    const summaryStats = await User.aggregate([
      { $match: { role: 'delivery' } },
      {
        $group: {
          _id: null,
          totalPartners: { $sum: 1 },
          verifiedPartners: {
            $sum: {
              $cond: [{ $eq: ['$deliveryProfile.isVerified', true] }, 1, 0]
            }
          },
          onlinePartners: {
            $sum: {
              $cond: [{ $eq: ['$deliveryProfile.availability.status', 'online'] }, 1, 0]
            }
          },
          busyPartners: {
            $sum: {
              $cond: [{ $eq: ['$deliveryProfile.availability.status', 'busy'] }, 1, 0]
            }
          },
          totalDeliveries: {
            $sum: '$deliveryProfile.performance.completedDeliveries'
          },
          avgAcceptanceRate: {
            $avg: '$deliveryProfile.performance.acceptanceRate'
          }
        }
      }
    ]);

    return NextResponse.json({
      deliveryPartners: partnersWithMetrics,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + deliveryPartners.length < totalCount
      },
      summary: summaryStats[0] || {
        totalPartners: 0,
        verifiedPartners: 0,
        onlinePartners: 0,
        busyPartners: 0,
        totalDeliveries: 0,
        avgAcceptanceRate: 0
      },
      message: 'Delivery partners retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get delivery partners error:', error);
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
      partnerId, 
      action, // 'update', 'verify', 'activate', 'deactivate', 'updatePerformance'
      updates 
    } = await request.json();

    if (!partnerId || !action) {
      return NextResponse.json(
        { error: 'Partner ID and action are required' },
        { status: 400 }
      );
    }

    const partner = await User.findOne({ _id: partnerId, role: 'delivery' });

    if (!partner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    let updateQuery: any = {};

    switch (action) {
      case 'verify':
        updateQuery = {
          'deliveryProfile.isVerified': true,
          'deliveryProfile.govtIdProof.verified': true
        };
        break;

      case 'activate':
        updateQuery = {
          'deliveryProfile.isActive': true
        };
        break;

      case 'deactivate':
        updateQuery = {
          'deliveryProfile.isActive': false,
          'deliveryProfile.availability.status': 'offline'
        };
        break;

      case 'update':
        if (updates) {
          // Allow updating specific fields
          const allowedFields = [
            'name', 'phone', 'email',
            'deliveryProfile.vehicleType',
            'deliveryProfile.vehicleNumber',
            'deliveryProfile.currentZone',
            'deliveryProfile.currentAssignments.maxConcurrentOrders',
            'deliveryProfile.rating'
          ];

          for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
              updateQuery[key] = value;
            }
          }
        }
        break;

      case 'updatePerformance':
        if (updates.performance) {
          for (const [key, value] of Object.entries(updates.performance)) {
            updateQuery[`deliveryProfile.performance.${key}`] = value;
          }
        }
        break;

      case 'resetPassword':
        // Generate a temporary password
        const bcrypt = require('bcryptjs');
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        updateQuery = {
          password: hashedPassword
        };

        // You might want to send this password via email/SMS in a real app
        return NextResponse.json({
          message: 'Password reset successfully',
          temporaryPassword: tempPassword,
          partnerId: partner._id
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the partner
    const updatedPartner = await User.findByIdAndUpdate(
      partnerId,
      updateQuery,
      { new: true, select: '-password -googleId' }
    );

    return NextResponse.json({
      message: `Delivery partner ${action} successful`,
      partner: updatedPartner,
      action
    });

  } catch (error: any) {
    console.error('Update delivery partner error:', error);
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
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    // Check if partner has active orders
    const partner = await User.findOne({ _id: partnerId, role: 'delivery' });

    if (!partner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    // Check for active assignments
    if (partner.deliveryProfile?.currentAssignments?.activeOrderId || 
        (partner.deliveryProfile?.currentAssignments?.assignedOrderIds?.length > 0)) {
      return NextResponse.json(
        { error: 'Cannot delete partner with active orders. Please reassign orders first.' },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate instead of actual deletion
    await User.findByIdAndUpdate(partnerId, {
      'deliveryProfile.isActive': false,
      'deliveryProfile.availability.status': 'offline',
      'deliveryProfile.deletedAt': new Date()
    });

    return NextResponse.json({
      message: 'Delivery partner deactivated successfully',
      partnerId
    });

  } catch (error: any) {
    console.error('Delete delivery partner error:', error);
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