// Central Address Management Service
// Ensures consistency between location selector, checkout, and user addresses

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

  // Get all user addresses
  getUserAddresses(): Address[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading addresses:', error);
      return [];
    }
  }

  // Add new address
  addAddress(address: Omit<Address, '_id'>): Address {
    const addresses = this.getUserAddresses();
    
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
  updateAddress(addressId: string, updates: Partial<Address>): boolean {
    const addresses = this.getUserAddresses();
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
  deleteAddress(addressId: string): boolean {
    const addresses = this.getUserAddresses();
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
  setDefaultAddress(addressId: string): boolean {
    const addresses = this.getUserAddresses();
    const targetIndex = addresses.findIndex(addr => addr._id === addressId);
    
    if (targetIndex === -1) return false;
    
    // Remove default from all addresses
    addresses.forEach(addr => addr.isDefault = false);
    
    // Set new default
    addresses[targetIndex].isDefault = true;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(addresses));
    
    // Update default location
    this.setDefaultLocation(addresses[targetIndex]);
    
    return true;
  }

  // Get default address
  getDefaultAddress(): Address | null {
    const addresses = this.getUserAddresses();
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
  syncWithCheckout(): void {
    const addresses = this.getUserAddresses();
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
}

export const addressService = new AddressService(); 