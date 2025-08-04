import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/backend/utils/jwt';
import User from '@/lib/backend/models/user.model';
import connectDB from '@/lib/backend/database';

export async function PUT(request: NextRequest) {
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

    // Only delivery partners can update their status
    if (decoded.role !== 'delivery') {
      return NextResponse.json(
        { error: 'Only delivery partners can update status' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { status, location } = body;

    // Validate status
    const validStatuses = ['online', 'offline', 'busy', 'break'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: online, offline, busy, break' },
        { status: 400 }
      );
    }

    // Find the delivery partner
    const deliveryPartner = await User.findById(decoded.userId);
    if (!deliveryPartner || deliveryPartner.role !== 'delivery') {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    // Update availability status
    const updateData: any = {
      'deliveryProfile.availability.status': status,
      'deliveryProfile.availability.lastStatusUpdate': new Date()
    };

    // Update location if provided
    if (location && location.latitude && location.longitude) {
      updateData['deliveryProfile.currentLocation'] = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        accuracy: location.accuracy,
        lastUpdated: new Date()
      };
    }

    // Set shift times for online/offline
    if (status === 'online' && deliveryPartner.deliveryProfile?.availability?.status !== 'online') {
      updateData['deliveryProfile.availability.shiftStartTime'] = new Date();
    } else if (status === 'offline' && deliveryPartner.deliveryProfile?.availability?.status === 'online') {
      updateData['deliveryProfile.availability.shiftEndTime'] = new Date();
    }

    const updatedPartner = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('_id name deliveryProfile.availability deliveryProfile.currentLocation');

    return NextResponse.json({
      success: true,
      message: `Status updated to ${status}`,
      user: {
        id: updatedPartner._id,
        name: updatedPartner.name,
        availability: updatedPartner.deliveryProfile?.availability,
        currentLocation: updatedPartner.deliveryProfile?.currentLocation
      }
    });

  } catch (error: any) {
    console.error('Status update error:', error);
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

    await connectDB();

    if (decoded.role === 'delivery') {
      // Get own status
      const deliveryPartner = await User.findById(decoded.userId)
        .select('_id name deliveryProfile.availability deliveryProfile.currentLocation deliveryProfile.performance');

      if (!deliveryPartner) {
        return NextResponse.json(
          { error: 'Delivery partner not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: deliveryPartner._id,
          name: deliveryPartner.name,
          availability: deliveryPartner.deliveryProfile?.availability,
          currentLocation: deliveryPartner.deliveryProfile?.currentLocation,
          performance: deliveryPartner.deliveryProfile?.performance
        }
      });

    } else if (decoded.role === 'admin') {
      // Get all delivery partners status
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const zone = url.searchParams.get('zone');

      const query: any = { role: 'delivery' };
      if (status) {
        query['deliveryProfile.availability.status'] = status;
      }
      if (zone) {
        query['deliveryProfile.currentZone'] = zone;
      }

      const deliveryPartners = await User.find(query)
        .select('_id name deliveryProfile.availability deliveryProfile.currentLocation deliveryProfile.currentZone deliveryProfile.performance')
        .sort({ 'deliveryProfile.availability.lastStatusUpdate': -1 });

      return NextResponse.json({
        success: true,
        partners: deliveryPartners.map(partner => ({
          id: partner._id,
          name: partner.name,
          availability: partner.deliveryProfile?.availability,
          currentLocation: partner.deliveryProfile?.currentLocation,
          currentZone: partner.deliveryProfile?.currentZone,
          performance: partner.deliveryProfile?.performance
        }))
      });

    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

  } catch (error: any) {
    console.error('Status fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 