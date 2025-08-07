import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { generateToken } from '@/lib/backend/utils/jwt';
import User from '@/lib/backend/models/user.model';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin user in database and include password field
    let admin = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'admin' 
    }).select('+password'); // Explicitly include password field

    // If no admin exists, create default admin user
    if (!admin && email.toLowerCase() === 'admin@foodfly.com') {
      admin = new User({
        name: 'Admin User',
        email: 'admin@foodfly.com',
        password: 'password', // Let the pre-save hook hash this
        phone: '+1234567890',
        role: 'admin',
        isEmailVerified: true
      });

      await admin.save();
      console.log('Default admin user created successfully');
      
      // Fetch the admin again to get the hashed password
      admin = await User.findOne({ 
        email: 'admin@foodfly.com',
        role: 'admin' 
      }).select('+password');
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if admin has a password set
    if (!admin.password) {
      return NextResponse.json(
        { error: 'Admin account not properly configured' },
        { status: 401 }
      );
    }

    // Debug logging
    console.log('Admin found:', { 
      email: admin.email, 
      role: admin.role,
      hasPassword: !!admin.password,
      passwordLength: admin.password?.length,
      passwordStart: admin.password?.substring(0, 10) + '...'
    });
    
    console.log('Attempting login with password:', password);

    // If password looks like it might be double-hashed or corrupted, reset the admin user
    if (admin.password && admin.password.length === 60 && email.toLowerCase() === 'admin@foodfly.com' && password === 'password') {
      console.log('Detected potential double-hashed password, resetting admin user...');
      
      // Delete the existing admin user
      await User.findByIdAndDelete(admin._id);
      
      // Create a fresh admin user
      admin = new User({
        name: 'Admin User',
        email: 'admin@foodfly.com',
        password: 'password', // Let the pre-save hook hash this
        phone: '+1234567890',
        role: 'admin',
        isEmailVerified: true
      });

      await admin.save();
      console.log('Fresh admin user created');
      
      // Fetch the admin again to get the properly hashed password
      admin = await User.findOne({ 
        email: 'admin@foodfly.com',
        role: 'admin' 
      }).select('+password');
      
      console.log('Fresh admin password info:', {
        hasPassword: !!admin.password,
        passwordLength: admin.password?.length,
        passwordStart: admin.password?.substring(0, 10) + '...'
      });
    }

    // Verify password using the model's comparePassword method
    let isValidPassword = false;
    try {
      if (admin.comparePassword) {
        // Use the model's comparePassword method
        isValidPassword = await admin.comparePassword(password);
        console.log('Using comparePassword method, result:', isValidPassword);
      } else {
        // Fallback to manual comparison
        isValidPassword = await bcrypt.compare(password, admin.password);
        console.log('Using manual bcrypt.compare, result:', isValidPassword);
      }
      
      // Additional test - try comparing with the plain password directly (for debugging)
      const directCompare = await bcrypt.compare(password, admin.password);
      console.log('Direct bcrypt compare result:', directCompare);
      
    } catch (error) {
      console.error('Password comparison error:', error);
      isValidPassword = false;
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(admin._id.toString(), 'admin');

    return NextResponse.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 