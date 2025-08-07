'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, Check, AlertCircle } from 'lucide-react';

interface Topping {
  id: number;
  name: string;
  price: number;
  image: string;
  category: 'meat' | 'vegetables' | 'cheese' | 'sauces';
}

const toppings: Topping[] = [
  {
    id: 1,
    name: 'Pepperoni',
    price: 2.99,
    image: '/images/toppings/pepperoni.jpg',
    category: 'meat',
  },
  {
    id: 2,
    name: 'Mushrooms',
    price: 1.99,
    image: '/images/toppings/mushrooms.jpg',
    category: 'vegetables',
  },
  {
    id: 3,
    name: 'Extra Cheese',
    price: 1.99,
    image: '/images/toppings/cheese.jpg',
    category: 'cheese',
  },
  // Add more toppings as needed
];

const sizes = [
  { id: 'small', name: 'Small', price: 9.99, diameter: '10"' },
  { id: 'medium', name: 'Medium', price: 12.99, diameter: '12"' },
  { id: 'large', name: 'Large', price: 15.99, diameter: '14"' },
];

const crusts = [
  { id: 'classic', name: 'Classic', price: 0 },
  { id: 'thin', name: 'Thin Crust', price: 0 },
  { id: 'stuffed', name: 'Stuffed Crust', price: 2.99 },
];

export default function PizzaBuilderPage() {
  const [selectedSize, setSelectedSize] = useState(sizes[1]);
  const [selectedCrust, setSelectedCrust] = useState(crusts[0]);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [activeCategory, setActiveCategory] = useState<Topping['category']>('meat');

  const addTopping = (topping: Topping) => {
    if (selectedToppings.length < 5) {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const removeTopping = (toppingId: number) => {
    setSelectedToppings(selectedToppings.filter(t => t.id !== toppingId));
  };

  const calculateTotal = () => {
    const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return (selectedSize.price + selectedCrust.price + toppingsTotal).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pizza Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Build Your Pizza</h1>
            
            <div className="relative aspect-square max-w-md mx-auto mb-8">
              <Image
                src="/images/pizza-base.png"
                alt="Pizza Base"
                fill
                className="object-contain"
              />
              {/* Add topping previews here */}
            </div>

            {/* Size Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Choose Size</h2>
              <div className="grid grid-cols-3 gap-4">
                {sizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedSize.id === size.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-200'
                    }`}
                  >
                    <div className="font-semibold">{size.name}</div>
                    <div className="text-sm text-gray-600">{size.diameter}</div>
                    <div className="text-red-500 font-medium">${size.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Crust Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Choose Crust</h2>
              <div className="grid grid-cols-3 gap-4">
                {crusts.map(crust => (
                  <button
                    key={crust.id}
                    onClick={() => setSelectedCrust(crust)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCrust.id === crust.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-200'
                    }`}
                  >
                    <div className="font-semibold">{crust.name}</div>
                    {crust.price > 0 && (
                      <div className="text-red-500 font-medium">+${crust.price}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toppings Selection */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add Toppings</h2>
              <div className="text-sm text-gray-600">
                {selectedToppings.length}/5 toppings selected
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['meat', 'vegetables', 'cheese', 'sauces'].map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as Topping['category'])}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Toppings Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {toppings
                .filter(t => t.category === activeCategory)
                .map(topping => (
                  <div
                    key={topping.id}
                    className="relative p-4 rounded-xl border border-gray-200 hover:border-red-200 transition-colors"
                  >
                    <div className="relative w-full aspect-square mb-2">
                      <Image
                        src={topping.image}
                        alt={topping.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{topping.name}</h3>
                        <p className="text-red-500">+${topping.price}</p>
                      </div>
                      {selectedToppings.some(t => t.id === topping.id) ? (
                        <button
                          onClick={() => removeTopping(topping.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => addTopping(topping)}
                          disabled={selectedToppings.length >= 5}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Selected Toppings */}
            {selectedToppings.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold mb-4">Selected Toppings</h3>
                <div className="space-y-2">
                  {selectedToppings.map(topping => (
                    <div
                      key={topping.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{topping.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-red-500">+${topping.price}</span>
                        <button
                          onClick={() => removeTopping(topping.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Total</h3>
                <div className="text-2xl font-bold text-red-500">${calculateTotal()}</div>
              </div>
              <button className="w-full bg-red-500 text-white py-4 rounded-xl hover:bg-red-600 transition-colors font-semibold">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 