import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('🍳 Chef registration request body:', body);
    
    const { 
      name, 
      email, 
      phone, 
      password, 
      specialization,
      experience,
      priceRange,
      serviceAreas,
      description,
      signatureDishes 
    } = body;

    console.log('🔍 Extracted fields:', {
      name, email, phone, 
      hasPassword: !!password,
      specialization, experience, priceRange, serviceAreas,
      description, signatureDishes
    });

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Validate specialization array
    if (!specialization || !Array.isArray(specialization) || specialization.length === 0) {
      return NextResponse.json(
        { error: 'At least one cuisine specialization is required' },
        { status: 400 }
      );
    }

    // Validate service areas array
    if (!serviceAreas || !Array.isArray(serviceAreas) || serviceAreas.length === 0) {
      return NextResponse.json(
        { error: 'At least one service area is required' },
        { status: 400 }
      );
    }

    // Validate experience
    if (!experience || isNaN(parseInt(experience))) {
      return NextResponse.json(
        { error: 'Valid experience is required' },
        { status: 400 }
      );
    }

    // Validate price range
    if (!priceRange || !priceRange.min || !priceRange.max) {
      return NextResponse.json(
        { error: 'Price range (min and max) is required' },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
    if (existingEmailUser) {
      // If existing user is not a chef, suggest upgrade
      if (existingEmailUser.role !== 'chef') {
        return NextResponse.json(
          { 
            error: 'User with this email already exists as a customer',
            canUpgrade: true,
            field: 'email',
            existingRole: existingEmailUser.role
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'Chef with this email already exists. Try logging in instead.',
            field: 'email'
          },
          { status: 400 }
        );
      }
    }

    // Check if user already exists with this phone
    const existingPhoneUser = await User.findOne({ phone: phone.trim() });
    if (existingPhoneUser) {
      // If existing user is not a chef, suggest upgrade
      if (existingPhoneUser.role !== 'chef') {
        return NextResponse.json(
          { 
            error: 'User with this phone number already exists as a customer',
            canUpgrade: true,
            field: 'phone',
            existingRole: existingPhoneUser.role
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'Chef with this phone number already exists. Try logging in instead.',
            field: 'phone'
          },
          { status: 400 }
        );
      }
    }

    // Create chef profile with proper validation
    const chefProfile = {
      specialization: specialization.filter(spec => spec && spec.trim()),
      experience: parseInt(experience),
      rating: 5.0, // Default rating for new chefs
      totalEvents: 0, // Add missing field
      priceRange: {
        min: parseFloat(priceRange.min),
        max: parseFloat(priceRange.max),
        currency: priceRange.currency || 'INR'
      },
      location: {
        serviceAreas: serviceAreas.filter(area => area && area.trim())
      },
      portfolio: {
        photos: [],
        description: description || '',
        signature_dishes: Array.isArray(signatureDishes) ? signatureDishes.filter(dish => dish && dish.trim()) : []
      },
      availability: {
        status: 'offline',
        weeklySchedule: {
          monday: { available: true, timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00'] },
          tuesday: { available: true, timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00'] },
          wednesday: { available: true, timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00'] },
          thursday: { available: true, timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00'] },
          friday: { available: true, timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00'] },
          saturday: { available: true, timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00'] },
          sunday: { available: true, timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00'] }
        },
        blackoutDates: []
      },
      verification: {
        isVerified: false,
        documents: {
          certifications: [],
          experience_letters: [],
          health_certificate: undefined
        }
      },
      performance: {
        acceptanceRate: 100,
        avgResponseTime: 30,
        completedEvents: 0,
        cancelledEvents: 0
      }
    };

    console.log('✅ Chef profile created:', chefProfile);

    // Create new chef user (CHEF ONLY - NO MIXING WITH OTHER ROLES)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: 'chef', // STRICTLY CHEF ROLE
      chefProfile,
      isEmailVerified: false,
      // Explicitly ensure no other role profiles
      deliveryProfile: undefined,
      // Mark as chef-specific registration
      registrationType: 'chef'
    });

    console.log('💾 Saving new chef user...');
    await newUser.save();
    console.log('✅ Chef user saved successfully');

    // Create database-persistent session for the new chef
    const sessionData = await SessionManager.createSession(
      newUser._id.toString(),
      'chef',
      request.headers
    );

    // Return chef data without password
    const chefResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      chefProfile: newUser.chefProfile,
      isEmailVerified: newUser.isEmailVerified,
      createdAt: newUser.createdAt
    };

    // Create response with chef data
    const response = NextResponse.json({
      message: 'Chef registered successfully',
      chef: chefResponse,
      token: sessionData.token,
      sessionId: sessionData.sessionId,
      userType: 'chef',
      redirectTo: '/chef/login'
    });

    // Note: For registration, we redirect to login instead of auto-login
    // So we don't set the cookie here
    
    return response;

  } catch (error) {
    console.error('❌ Chef registration error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error instanceof Error && error.message.includes('E11000 duplicate key error')) {
      let duplicateField = 'field';
      let userFriendlyMessage = 'A user with this information already exists';
      
      if (error.message.includes('email_1')) {
        duplicateField = 'email';
        userFriendlyMessage = 'A user with this email already exists';
      } else if (error.message.includes('phone_1')) {
        duplicateField = 'phone';
        userFriendlyMessage = 'A user with this phone number already exists';
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyMessage,
          field: duplicateField
        },
        { status: 400 }
      );
    }
    
    // More detailed error logging for other errors
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to register chef. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}