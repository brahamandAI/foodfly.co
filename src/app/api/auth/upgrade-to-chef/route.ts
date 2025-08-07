import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { generateToken } from '@/lib/backend/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      email,
      password,
      specialization,
      experience,
      priceRange,
      serviceAreas,
      description,
      signatureDishes 
    } = body;

    console.log('🔄 Upgrading user to chef:', { email });

    // Find existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await existingUser.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Check if user is already a chef
    if (existingUser.role === 'chef') {
      return NextResponse.json(
        { error: 'User is already registered as a chef. Try logging in.' },
        { status: 400 }
      );
    }

    // Validate chef data
    if (!specialization || !Array.isArray(specialization) || specialization.length === 0) {
      return NextResponse.json(
        { error: 'At least one cuisine specialization is required' },
        { status: 400 }
      );
    }

    if (!serviceAreas || !Array.isArray(serviceAreas) || serviceAreas.length === 0) {
      return NextResponse.json(
        { error: 'At least one service area is required' },
        { status: 400 }
      );
    }

    // Create chef profile
    const chefProfile = {
      specialization: specialization.filter(spec => spec && spec.trim()),
      experience: parseInt(experience) || 1,
      rating: 5.0,
      totalEvents: 0,
      priceRange: {
        min: parseFloat(priceRange?.min) || 1000,
        max: parseFloat(priceRange?.max) || 5000,
        currency: priceRange?.currency || 'INR'
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

    // Upgrade user to chef
    existingUser.role = 'chef';
    existingUser.chefProfile = chefProfile;
    
    console.log('💾 Upgrading user to chef role...');
    await existingUser.save();
    console.log('✅ User upgraded to chef successfully');

    // Generate new token with chef role
    const token = generateToken(existingUser._id.toString(), 'chef');

    // Return chef data without password
    const chefResponse = {
      _id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      phone: existingUser.phone,
      role: 'chef',
      chefProfile: existingUser.chefProfile,
      isEmailVerified: existingUser.isEmailVerified,
      lastLogin: existingUser.lastLogin,
      picture: existingUser.picture
    };

    return NextResponse.json({
      message: 'Successfully upgraded to chef account!',
      chef: chefResponse,
      token,
      upgraded: true
    });

  } catch (error) {
    console.error('❌ Chef upgrade error:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to upgrade to chef. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}