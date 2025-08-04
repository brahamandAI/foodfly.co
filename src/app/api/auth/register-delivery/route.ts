import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { generateToken } from '@/lib/backend/utils/jwt';

interface DeliveryRegistrationRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
  vehicleType: 'bike' | 'bicycle' | 'scooter' | 'robo';
  vehicleNumber?: string;
  currentZone: string;
  profilePhoto?: string;
  govtIdProof?: {
    type: 'aadhar' | 'pan' | 'driving_license' | 'other';
    number: string;
    document?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: DeliveryRegistrationRequest = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'phone', 'password', 'vehicleType', 'currentZone'];
    const missingFields = requiredFields.filter(field => !body[field as keyof DeliveryRegistrationRequest]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(body.phone.replace(/[\s\-\(\)]/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate password strength
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingUserByPhone = await User.findOne({ phone: body.phone });
    if (existingUserByPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (body.email) {
      const existingUserByEmail = await User.findOne({ email: body.email.toLowerCase() });
      if (existingUserByEmail) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }

    // Create delivery profile
    const deliveryProfile = {
      vehicleType: body.vehicleType,
      vehicleNumber: body.vehicleNumber?.toUpperCase() || undefined,
      currentZone: body.currentZone,
      profilePhoto: body.profilePhoto,
      govtIdProof: body.govtIdProof ? {
        ...body.govtIdProof,
        verified: false // Initially unverified
      } : undefined,
      isVerified: false,
      isActive: true,
      totalDeliveries: 0,
      joinedAt: new Date()
    };

    // Create new delivery agent user
    const newUser = new User({
      name: body.name.trim(),
      phone: body.phone,
      email: body.email?.toLowerCase().trim(),
      password: body.password,
      role: 'delivery',
      isEmailVerified: false,
      deliveryProfile
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id.toString(), newUser.role);

    // Return success response without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      deliveryProfile: {
        vehicleType: newUser.deliveryProfile?.vehicleType,
        vehicleNumber: newUser.deliveryProfile?.vehicleNumber,
        currentZone: newUser.deliveryProfile?.currentZone,
        isVerified: newUser.deliveryProfile?.isVerified,
        isActive: newUser.deliveryProfile?.isActive,
        totalDeliveries: newUser.deliveryProfile?.totalDeliveries,
        joinedAt: newUser.deliveryProfile?.joinedAt
      },
      createdAt: newUser.createdAt
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Delivery agent registered successfully',
        user: userResponse,
        token
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Delivery registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 