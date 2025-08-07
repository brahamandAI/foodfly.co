import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/backend/middleware/auth';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    const dbUser = await User.findById(user._id).select('addresses');
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Direct mapping - no transformation needed since model matches frontend
    const addresses = (dbUser.addresses || []).map(addr => ({
      _id: addr._id,
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt
    }));

    return NextResponse.json({
      addresses,
      message: 'Addresses retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get addresses error:', error);
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

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    const { label, name, phone, street, landmark, city, state, pincode, isDefault } = await request.json();

    // Validate required fields
    if (!label || !name || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'All required fields must be provided (label, name, phone, street, city, state, pincode)' },
        { status: 400 }
      );
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be 6 digits' },
        { status: 400 }
      );
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If setting as default, make all other addresses non-default
    if (isDefault) {
      dbUser.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Create new address - direct mapping since model matches frontend
    const newAddress = {
      label: label.trim(),
      name: name.trim(),
      phone: phone.trim(),
      street: street.trim(),
      landmark: landmark ? landmark.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault: !!isDefault || dbUser.addresses.length === 0 // First address is default
    };

    dbUser.addresses.push(newAddress);
    await dbUser.save();

    // Get the saved address with generated _id
    const savedAddress = dbUser.addresses[dbUser.addresses.length - 1];

    return NextResponse.json({
      message: 'Address added successfully',
      address: {
        _id: savedAddress._id,
        label: savedAddress.label,
        name: savedAddress.name,
        phone: savedAddress.phone,
        street: savedAddress.street,
        landmark: savedAddress.landmark,
        city: savedAddress.city,
        state: savedAddress.state,
        pincode: savedAddress.pincode,
        isDefault: savedAddress.isDefault,
        createdAt: savedAddress.createdAt
      }
    });

  } catch (error: any) {
    console.error('Add address error:', error);
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
    
    const user = verifyToken(request);
    
    const { addressId, label, name, phone, street, landmark, city, state, pincode, isDefault } = await request.json();

    if (!addressId) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the address to update
    const addressIndex = dbUser.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, make all other addresses non-default
    if (isDefault) {
      dbUser.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update the address - direct field mapping
    const updatedAddress = {
      ...dbUser.addresses[addressIndex].toObject(),
      ...(label && { label: label.trim() }),
      ...(name && { name: name.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(street && { street: street.trim() }),
      ...(landmark !== undefined && { landmark: landmark.trim() }),
      ...(city && { city: city.trim() }),
      ...(state && { state: state.trim() }),
      ...(pincode && { pincode: pincode.trim() }),
      ...(isDefault !== undefined && { isDefault })
    };

    dbUser.addresses[addressIndex] = updatedAddress;
    await dbUser.save();

    return NextResponse.json({
      message: 'Address updated successfully',
      address: {
        _id: updatedAddress._id,
        label: updatedAddress.label,
        name: updatedAddress.name,
        phone: updatedAddress.phone,
        street: updatedAddress.street,
        landmark: updatedAddress.landmark,
        city: updatedAddress.city,
        state: updatedAddress.state,
        pincode: updatedAddress.pincode,
        isDefault: updatedAddress.isDefault
      }
    });

  } catch (error: any) {
    console.error('Update address error:', error);
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
    
    const user = verifyToken(request);
    
    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');

    if (!addressId) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find and remove the address
    const addressIndex = dbUser.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    const deletedAddress = dbUser.addresses[addressIndex];
    dbUser.addresses.splice(addressIndex, 1);

    // If the deleted address was default and there are other addresses, make the first one default
    if (deletedAddress.isDefault && dbUser.addresses.length > 0) {
      dbUser.addresses[0].isDefault = true;
    }

    await dbUser.save();

    return NextResponse.json({
      message: 'Address deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete address error:', error);
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
