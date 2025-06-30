'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Flame, Heart } from 'lucide-react';
import { Playfair_Display, Dancing_Script, Cormorant_Garamond } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });
const cormorant = Cormorant_Garamond({ 
  weight: ['400', '600'],
  subsets: ['latin'] 
});

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  prepTime: string;
  isSpicy: boolean;
  isPopular: boolean;
}

const categories = [
  { name: 'North Indian', img: '/images/categories/North-indian.jpg' },
  { name: 'Chinese', img: '/images/categories/Chinese.jpg' },
  { name: 'Oriental', img: '/images/categories/Oriental.jpg' },
  { name: 'Italian', img: '/images/categories/Italian.jpg' },
  { name: 'European', img: '/images/categories/European.jpg' },
  { name: 'South Indian', img: '/images/categories/South-indian.jpg' },
  { name: 'Mughlai', img: '/images/categories/Mughlai.jpg' },
  { name: 'Fast Food', img: '/images/categories/Fast-food.jpg' },
  { name: 'Beverages', img: '/images/categories/Bevarages.jpg' },
  { name: 'Desserts', img: '/images/categories/Desserts.jpg' },
];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-[200px] bg-black">
        <Image
          src="/images/hero-burger.jpg"
          alt="Menu Hero"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className={`${cormorant.className} text-5xl md:text-6xl font-semibold mb-4 tracking-wider uppercase`}>
              <span className="text-red-500">M</span>enu
            </h1>
            <p className={`${dancingScript.className} text-3xl md:text-4xl text-gray-200 flex items-center justify-center gap-3 w-full max-w-2xl mx-auto`}>
              Made with <Heart className="w-8 h-8 text-red-500 fill-current animate-pulse" /> love
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-black">
      <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${cormorant.className} text-3xl font-semibold tracking-wide text-white`}>Categories</h2>
          <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'All'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-900 text-gray-200 hover:bg-gray-800'
              }`}
          >
            All
          </button>
        </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/menu/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`p-4 rounded-xl text-center transition-all ${
                  selectedCategory === category.name
                    ? 'bg-red-500 text-white shadow-lg scale-105'
                    : 'bg-black hover:bg-gray-900 text-white'
                }`}
              >
                <div className="w-32 h-32 mx-auto mb-3 relative overflow-hidden rounded-lg">
                  <Image
                    src={category.img}
                    alt={category.name}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 128px, 128px"
                    priority
                  />
                </div>
                <span className={`${cormorant.className} text-xl font-semibold tracking-wide`}>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 