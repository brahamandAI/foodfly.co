import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check admin user status
    const admin = await User.findOne({ 
      email: 'admin@foodfly.com',
      role: 'admin' 
    }).select('+password');

    return NextResponse.json({
      adminExists: !!admin,
      adminEmail: admin?.email,
      hasPassword: !!admin?.password,
      passwordLength: admin?.password?.length,
      isHashed: admin?.password?.startsWith('$2') || false
    });

  } catch (error: any) {
    console.error('Admin status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'admin@foodfly.com',
      role: 'admin' 
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      });
    }

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@foodfly.com',
      password: 'password', // Let the pre-save hook hash this
      phone: '+1234567890',
      role: 'admin',
      isEmailVerified: true
    });

    await admin.save();

    return NextResponse.json({
      message: 'Admin user created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error: any) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 