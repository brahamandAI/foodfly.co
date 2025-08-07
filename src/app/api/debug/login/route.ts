import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required for debug' },
        { status: 400 }
      );
    }

    console.log('Debug login attempt for:', email);

    // Find user and include password for debugging
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    const debugInfo = {
      email: email,
      userExists: !!user,
      userEmail: user?.email,
      userName: user?.name,
      userRole: user?.role,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length,
      isPasswordHashed: user?.password?.startsWith('$2') || false,
      attemptedPassword: password,
      databaseConnection: 'Connected'
    };

    if (!user) {
      return NextResponse.json({
        ...debugInfo,
        message: 'User not found in database',
        suggestion: 'Check if the email is correct or if user was created successfully'
      });
    }

    // Test password comparison
    let passwordMatch = false;
    let comparisonError = null;
    
    try {
      passwordMatch = await user.comparePassword(password);
    } catch (error: any) {
      comparisonError = error.message;
    }

    return NextResponse.json({
      ...debugInfo,
      passwordMatch,
      comparisonError,
      message: passwordMatch ? 'Login would succeed' : 'Password does not match',
      suggestion: passwordMatch ? 
        'Login should work - check frontend for issues' : 
        'Password is incorrect or user needs to reset password'
    });

  } catch (error: any) {
    console.error('Debug login error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed',
        message: error.message,
        databaseConnection: 'Failed'
      },
      { status: 500 }
    );
  }
} 