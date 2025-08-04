'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  DollarSign, 
  ChefHat, 
  Calendar, 
  Users, 
  Clock,
  Heart,
  Phone,
  Mail,
  Award,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Cormorant_Garamond, Dancing_Script } from 'next/font/google';

const cormorant = Cormorant_Garamond({ 
  weight: ['400', '600'],
  subsets: ['latin'] 
});

const dancingScript = Dancing_Script({ subsets: ['latin'] });

interface Chef {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  chefProfile: {
    specialization: string[];
    experience: number;
    rating: number;
    totalEvents: number;
    priceRange: {
      min: number;
      max: number;
      currency: string;
    };
    portfolio: {
      photos: string[];
      description: string;
      signature_dishes: string[];
    };
    location: {
      serviceAreas: string[];
    };
    verification: {
      isVerified: boolean;
    };
  };
}

interface FilterOptions {
  cities: string[];
  cuisines: string[];
}

export default function ChefServicesPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [filteredChefs, setFilteredChefs] = useState<Chef[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ cities: [], cuisines: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);

  useEffect(() => {
    loadChefs();
  }, []);

  useEffect(() => {
    filterChefs();
  }, [chefs, searchQuery, selectedCity, selectedCuisine, priceRange]);

  const loadChefs = async () => {
    try {
      const response = await fetch('/api/chef-services/chefs');
      if (response.ok) {
        const data = await response.json();
        setChefs(data.chefs);
        setFilters(data.filters);
      } else {
        toast.error('Failed to load chefs');
      }
    } catch (error) {
      console.error('Error loading chefs:', error);
      toast.error('Failed to load chefs');
    } finally {
      setLoading(false);
    }
  };

  const filterChefs = () => {
    let filtered = [...chefs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(chef =>
        chef.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chef.chefProfile.specialization.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        chef.chefProfile.portfolio.signature_dishes.some(dish =>
          dish.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(chef =>
        chef.chefProfile.location.serviceAreas.includes(selectedCity)
      );
    }

    // Cuisine filter
    if (selectedCuisine) {
      filtered = filtered.filter(chef =>
        chef.chefProfile.specialization.includes(selectedCuisine)
      );
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(chef => {
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return chef.chefProfile.priceRange.min >= min && chef.chefProfile.priceRange.max <= max;
      });
    }

    setFilteredChefs(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-300">Loading amazing chefs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 py-20 border-b border-gray-700">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-burger.jpg"
            alt="Chef Services Hero"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <ChefHat className="h-16 w-16 text-orange-500" />
            <div className="flex items-center space-x-2">
              <Image
                src="/images/logo.png"
                alt="FoodFly"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <span className={`${cormorant.className} text-3xl font-semibold text-white tracking-wider`}>FoodFly</span>
            </div>
          </div>
          <h1 className={`${cormorant.className} text-5xl md:text-7xl font-semibold text-white mb-4 tracking-wider uppercase`}>
            <span className="text-orange-400">Personal</span> Chef Services
          </h1>
          <p className={`${dancingScript.className} text-2xl md:text-3xl text-gray-200 mb-4 flex items-center justify-center gap-3`}>
            Culinary Excellence <Sparkles className="w-8 h-8 text-orange-500 fill-current animate-pulse" /> at Your Service
          </p>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Book professional chefs for your special events, parties, and celebrations.
            Enjoy restaurant-quality cuisine in the comfort of your own space.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
            <Link
              href="/chef-services/book"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-4 px-8 rounded-full hover:from-orange-600 hover:to-red-600 transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Book a Chef Now
            </Link>
            <Link
              href="/chef/register"
              className="border-2 border-orange-500 text-orange-400 font-semibold py-4 px-8 rounded-full hover:bg-orange-500 hover:text-white transition duration-300 transform hover:scale-105"
            >
              Become a Chef Partner
            </Link>
          </div>
          
          {/* Chef Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-300 text-lg mb-3">Already a chef partner?</p>
            <Link
              href="/chef/login"
              className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-300 font-medium text-lg transition-colors"
            >
              <ChefHat className="h-5 w-5" />
              <span>Chef Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search chefs, cuisines, or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border border-gray-700 rounded-lg px-3 py-3 bg-gray-800 text-white focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Cities</option>
                {filters.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="border border-gray-700 rounded-lg px-3 py-3 bg-gray-800 text-white focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Cuisines</option>
                {filters.cuisines.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Min Price (₹)"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="border border-gray-700 rounded-lg px-3 py-3 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500"
              />

              <input
                type="number"
                placeholder="Max Price (₹)"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="border border-gray-700 rounded-lg px-3 py-3 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`${cormorant.className} text-4xl font-bold text-white tracking-wide mb-2`}>
              Available Chefs
            </h2>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg">
                {filteredChefs.length} {filteredChefs.length === 1 ? 'Chef' : 'Chefs'} Found
              </div>
              <div className="text-gray-300 text-sm">
                {chefs.length} total registered chefs
              </div>
            </div>
          </div>
        </div>

        {filteredChefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChefs.map((chef) => (
              <div key={chef._id} className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:border-red-500 transition-all duration-300 transform hover:scale-105">
                {/* Chef Photo */}
                <div className="h-48 bg-gray-800 relative">
                  {chef.profilePhoto ? (
                    <Image
                      src={chef.profilePhoto}
                      alt={chef.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ChefHat className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                  {chef.chefProfile.verification.isVerified && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full">
                      <Award className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Chef Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-white">{chef.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-300">{chef.chefProfile.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {chef.chefProfile.portfolio.description}
                  </p>

                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {chef.chefProfile.specialization.slice(0, 3).map((spec, index) => (
                      <span key={index} className="px-2 py-1 bg-red-900 text-red-200 text-xs rounded">
                        {spec}
                      </span>
                    ))}
                    {chef.chefProfile.specialization.length > 3 && (
                      <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">
                        +{chef.chefProfile.specialization.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{chef.chefProfile.experience} yrs exp</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{chef.chefProfile.totalEvents} events</span>
                    </div>
                  </div>

                  {/* Service Areas */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{chef.chefProfile.location.serviceAreas.slice(0, 2).join(', ')}</span>
                      {chef.chefProfile.location.serviceAreas.length > 2 && (
                        <span>+{chef.chefProfile.location.serviceAreas.length - 2} more</span>
                      )}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-lg font-semibold text-white">
                      <span className="text-green-400">💰</span>
                      <span>₹{chef.chefProfile.priceRange.min.toLocaleString()} - ₹{chef.chefProfile.priceRange.max.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/chef-services/book?chef=${chef._id}`}
                      className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg text-center hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
                    >
                      Book Now
                    </Link>
                    <button
                      onClick={() => setSelectedChef(chef)}
                      className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No chefs found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('');
                setSelectedCuisine('');
                setPriceRange({ min: '', max: '' });
              }}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Chef Detail Modal */}
      {selectedChef && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    {selectedChef.profilePhoto ? (
                      <Image
                        src={selectedChef.profilePhoto}
                        alt={selectedChef.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <ChefHat className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedChef.name}</h2>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-lg text-gray-300">{selectedChef.chefProfile.rating.toFixed(1)}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-300">{selectedChef.chefProfile.totalEvents} events completed</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChef(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-gray-400">{selectedChef.chefProfile.portfolio.description}</p>
                </div>

                {/* Specializations */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedChef.chefProfile.specialization.map((spec, index) => (
                      <span key={index} className="px-3 py-1 bg-red-900 text-red-200 rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Signature Dishes */}
                {selectedChef.chefProfile.portfolio.signature_dishes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Signature Dishes</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedChef.chefProfile.portfolio.signature_dishes.map((dish, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <span className="text-gray-300">{dish}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Contact</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-300">{selectedChef.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-300">{selectedChef.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-300">{selectedChef.chefProfile.location.serviceAreas.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Pricing</h3>
                  <div className="p-4 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Event Price Range:</span>
                      <span className="text-xl font-semibold text-red-400">
                        ₹{selectedChef.chefProfile.priceRange.min.toLocaleString()} - ₹{selectedChef.chefProfile.priceRange.max.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Link
                    href={`/chef-services/book?chef=${selectedChef._id}`}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-lg text-center hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
                    onClick={() => setSelectedChef(null)}
                  >
                    Book This Chef
                  </Link>
                  <button
                    onClick={() => setSelectedChef(null)}
                    className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}