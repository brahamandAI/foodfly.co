import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      password,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadharNumber,
      panNumber,
      emergencyContact,
      workingHours,
      serviceAreas
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    if (!vehicleType || !vehicleNumber || !licenseNumber) {
      return NextResponse.json(
        { error: 'Vehicle information is required for delivery agents' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: phone.trim() }
      ]
    });

    if (existingUser) {
      // Handle existing user based on role
      if (existingUser.role === 'delivery') {
        return NextResponse.json(
          { 
            error: 'Delivery agent with this email or phone already exists',
            field: existingUser.email === email.toLowerCase() ? 'email' : 'phone'
          },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { 
            error: `This ${existingUser.email === email.toLowerCase() ? 'email' : 'phone'} is already registered as a ${existingUser.role}. Please use different credentials or upgrade your existing account.`,
            field: existingUser.email === email.toLowerCase() ? 'email' : 'phone',
            existingRole: existingUser.role,
            canUpgrade: false // For now, we don't allow upgrading to delivery
          },
          { status: 409 }
        );
      }
    }

    console.log('🚚 Creating new delivery agent user...');

    // Create delivery profile
    const deliveryProfile = {
      vehicleInfo: {
        type: vehicleType,
        number: vehicleNumber.toUpperCase(),
        licenseNumber: licenseNumber.toUpperCase()
      },
      documents: {
        aadharNumber: aadharNumber || '',
        panNumber: panNumber || '',
        licenseVerified: false,
        backgroundCheck: 'pending'
      },
      workingHours: workingHours || {
        start: '09:00',
        end: '21:00',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      serviceAreas: serviceAreas || [],
      emergencyContact: emergencyContact || '',
      availability: {
        status: 'offline', // Start as offline
        currentLocation: null,
        lastLocationUpdate: new Date()
      },
      performance: {
        rating: 0,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        cancelledDeliveries: 0,
        avgDeliveryTime: 0,
        onTimeDeliveries: 0,
        lastDeliveryCompletedAt: null
      },
      earnings: {
        totalEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        pendingPayments: 0
      }
    };

    console.log('✅ Delivery profile created:', deliveryProfile);

    // Create new delivery agent user (DELIVERY ONLY - NO MIXING WITH OTHER ROLES)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: 'delivery', // STRICTLY DELIVERY ROLE
      deliveryProfile,
      isEmailVerified: false,
      // Explicitly ensure no other role profiles
      chefProfile: undefined,
      // Mark as delivery-specific registration
      registrationType: 'delivery'
    });

    console.log('💾 Saving new delivery agent user...');
    await newUser.save();
    console.log('✅ Delivery agent user saved successfully');

    // Create database-persistent session for the new delivery agent
    const sessionData = await SessionManager.createSession(
      newUser._id.toString(),
      'delivery',
      request.headers
    );

    // Return delivery agent data without password
    const deliveryResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      deliveryProfile: newUser.deliveryProfile,
      isEmailVerified: newUser.isEmailVerified,
      createdAt: newUser.createdAt
    };

    // Create response with delivery agent data
    const response = NextResponse.json({
      message: 'Delivery agent registered successfully',
      delivery: deliveryResponse,
      token: sessionData.token,
      sessionId: sessionData.sessionId,
      userType: 'delivery',
      redirectTo: '/delivery/login'
    });

    // Note: For registration, we redirect to login instead of auto-login
    // So we don't set the cookie here
    
    return response;

  } catch (error) {
    console.error('❌ Delivery agent registration error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = error.keyPattern?.email ? 'email' : 'phone';
      return NextResponse.json(
        { 
          error: `Delivery agent with this ${field} already exists`,
          field
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}