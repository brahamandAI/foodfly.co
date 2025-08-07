// Central Address Management Service
// Ensures consistency between location selector, checkout, and user addresses
// Now uses database for authenticated users, localStorage for guests

export interface Address {
  _id?: string;
  type: 'home' | 'work' | 'other' | 'current';
  name: string;
  phone?: string;
  street?: string;
  landmark?: string;
  city: string;
  state?: string;
  pincode?: string;
  fullAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

export interface Location {
  _id?: string;
  type: 'home' | 'work' | 'other' | 'current';
  name: string;
  fullAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

class AddressService {
  private readonly STORAGE_KEY = 'userLocations';
  private readonly DEFAULT_LOCATION_KEY = 'defaultLocation';

  // Check if user is authenticated (not guest)
  private isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const isGuest = localStorage.getItem('guest') === 'true';
    return !!(token && !isGuest);
  }

  // Get current user ID
  private getCurrentUserId(): string | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id || JSON.parse(user)._id : null;
    } catch {
      return null;
    }
  }

  // Get all user addresses
  async getUserAddresses(): Promise<Address[]> {
    if (this.isAuthenticated()) {
      // Use database for authenticated users
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/addresses', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.addresses || [];
        }
      } catch (error) {
        console.error('Error fetching addresses from database:', error);
      }
    }

    // Fallback to localStorage for guests or on error
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading addresses from localStorage:', error);
      return [];
    }
  }

  // Add new address
  async addAddress(address: Omit<Address, '_id'>): Promise<Address> {
    if (this.isAuthenticated()) {
      // Use database for authenticated users
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/addresses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            label: address.type === 'home' ? 'Home' : address.type === 'work' ? 'Work' : 'Other',
            name: address.name,
            phone: address.phone || '',
            street: address.street || '',
            landmark: address.landmark || '',
            city: address.city,
            state: address.state || '',
            pincode: address.pincode || '',
            isDefault: address.isDefault
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            _id: data.address._id,
            type: data.address.label.toLowerCase() as any,
            name: data.address.name,
            phone: data.address.phone,
            street: data.address.street,
            landmark: data.address.landmark,
            city: data.address.city,
            state: data.address.state,
            pincode: data.address.pincode,
            fullAddress: address.fullAddress,
            coordinates: address.coordinates,
            isDefault: data.address.isDefault
          };
        }
      } catch (error) {
        console.error('Error adding address to database:', error);
      }
    }

    // Fallback to localStorage for guests or on error
    const addresses = await this.getUserAddresses();
    
    // If this is the first address, make it default
    if (addresses.length === 0) {
      address.isDefault = true;
    }
    
    // If this is set as default, remove default from others
    if (address.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    const newAddress: Address = {
      ...address,
      _id: Date.now().toString()
    };
    
    addresses.push(newAddress);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(addresses));
    
    // Update default location if this is default
    if (newAddress.isDefault) {
      this.setDefaultLocation(newAddress);
    }
    
    return newAddress;
  }

  // Update existing address
  async updateAddress(addressId: string, updates: Partial<Address>): Promise<boolean> {
    if (this.isAuthenticated()) {
      // Use database for authenticated users
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/addresses', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            addressId,
            label: updates.type === 'home' ? 'Home' : updates.type === 'work' ? 'Work' : 'Other',
            name: updates.name,
            phone: updates.phone,
            street: updates.street,
            landmark: updates.landmark,
            city: updates.city,
            state: updates.state,
            pincode: updates.pincode,
            isDefault: updates.isDefault
          }),
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error('Error updating address in database:', error);
      }
    }

    // Fallback to localStorage for guests or on error
    const addresses = await this.getUserAddresses();
    const index = addresses.findIndex(addr => addr._id === addressId);
    
    if (index === -1) return false;
    
    // If making this default, remove default from others
    if (updates.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    addresses[index] = { ...addresses[index], ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(addresses));
    
    // Update default location if this is default
    if (addresses[index].isDefault) {
      this.setDefaultLocation(addresses[index]);
    }
    
    return true;
  }

  // Delete address
  async deleteAddress(addressId: string): Promise<boolean> {
    if (this.isAuthenticated()) {
      // Use database for authenticated users
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/addresses?addressId=${addressId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error('Error deleting address from database:', error);
      }
    }

    // Fallback to localStorage for guests or on error
    const addresses = await this.getUserAddresses();
    const index = addresses.findIndex(addr => addr._id === addressId);
    
    if (index === -1) return false;
    
    const wasDefault = addresses[index].isDefault;
    addresses.splice(index, 1);
    
    // If deleted address was default, make first remaining address default
    if (wasDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
      this.setDefaultLocation(addresses[0]);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(addresses));
    
    // Clear default location if no addresses left
    if (addresses.length === 0) {
      localStorage.removeItem(this.DEFAULT_LOCATION_KEY);
    }
    
    return true;
  }

  // Set default address
  async setDefaultAddress(addressId: string): Promise<boolean> {
    return this.updateAddress(addressId, { isDefault: true });
  }

  // Get default address
  async getDefaultAddress(): Promise<Address | null> {
    const addresses = await this.getUserAddresses();
    return addresses.find(addr => addr.isDefault) || addresses[0] || null;
  }

  // Convert Address to Location format
  addressToLocation(address: Address): Location {
    return {
      _id: address._id,
      type: address.type,
      name: address.name,
      fullAddress: address.fullAddress,
      coordinates: address.coordinates,
      isDefault: address.isDefault
    };
  }

  // Convert Location to Address format
  locationToAddress(location: Location): Address {
    return {
      _id: location._id,
      type: location.type,
      name: location.name,
      fullAddress: location.fullAddress,
      coordinates: location.coordinates,
      isDefault: location.isDefault,
      city: this.extractCityFromAddress(location.fullAddress),
      state: this.extractStateFromAddress(location.fullAddress)
    };
  }

  // Set default location (for compatibility with existing code)
  private setDefaultLocation(address: Address): void {
    const location = {
      _id: address._id,
      type: address.type,
      name: address.name,
      fullAddress: address.fullAddress,
      coordinates: address.coordinates,
      isDefault: address.isDefault
    };
    localStorage.setItem(this.DEFAULT_LOCATION_KEY, JSON.stringify(location));
    localStorage.setItem('selectedLocation', JSON.stringify(location));
  }

  // Extract city from full address
  private extractCityFromAddress(fullAddress: string): string {
    const parts = fullAddress.split(',').map(part => part.trim());
    return parts[parts.length - 2] || parts[0] || '';
  }

  // Extract state from full address
  private extractStateFromAddress(fullAddress: string): string {
    const parts = fullAddress.split(',').map(part => part.trim());
    return parts[parts.length - 1] || '';
  }

  // Sync addresses with checkout addresses
  async syncWithCheckout(): Promise<void> {
    const addresses = await this.getUserAddresses();
    const checkoutAddresses = addresses.map(addr => ({
      _id: addr._id,
      type: addr.type,
      name: addr.name,
      phone: addr.phone || '',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state || '',
      pincode: addr.pincode || '',
      isDefault: addr.isDefault
    }));
    
    localStorage.setItem('checkoutAddresses', JSON.stringify(checkoutAddresses));
  }

  // Clear all addresses (for logout)
  clearAddresses(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.DEFAULT_LOCATION_KEY);
    localStorage.removeItem('selectedLocation');
    localStorage.removeItem('checkoutAddresses');
  }

  // Migrate guest addresses to database on login
  async migrateGuestAddresses(): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    try {
      const guestAddresses = localStorage.getItem(this.STORAGE_KEY);
      if (guestAddresses) {
        const addresses = JSON.parse(guestAddresses);
        
        for (const address of addresses) {
          try {
            await this.addAddress({
              type: address.type,
              name: address.name,
              phone: address.phone,
              street: address.street,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              fullAddress: address.fullAddress,
              coordinates: address.coordinates,
              isDefault: address.isDefault
            });
          } catch (error) {
            console.error('Error migrating address:', error);
          }
        }
        
        // Clear guest addresses after migration
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Successfully migrated guest addresses to database');
      }
    } catch (error) {
      console.error('Error migrating guest addresses:', error);
    }
  }
}

export const addressService = new AddressService(); 