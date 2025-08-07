'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  Mail, 
  Heart
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Logo and Contact Info */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          {/* Logo */}
          <Link href="/" className="inline-block mb-6 md:mb-0 group bg-black p-3 rounded-3xl">
            <Image
              src="/images/logo.png"
              alt="FoodFly"
              width={480}
              height={144}
              className="h-36 w-auto group-hover:scale-105 transition-transform duration-300 bg-[#232323] rounded-2xl p-3 border-4 border-black"
            />
          </Link>

          {/* Contact Information */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
            <div className="flex items-center space-x-4 group">
              <div className="p-3 bg-gray-800 rounded-full group-hover:bg-red-600 transition-all duration-300">
                <Phone className="h-6 w-6 text-red-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Call Us</p>
                <p className="text-white text-base">+91 9090020245</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 group">
              <div className="p-3 bg-gray-800 rounded-full group-hover:bg-red-600 transition-all duration-300">
                <Mail className="h-6 w-6 text-red-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email Us</p>
                <p className="text-white text-base">info@therobustrix.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 text-center">
          <p className="text-yellow-400 text-base font-bold mb-2">© 2025 Foodfly.com — All rights reserved.</p>
          <p className="text-yellow-400 text-base font-bold">
            Crafted with care and innovation in partnership with Robustrix / ब्रह्मांड AI (The Intelligence of the Cosmos).
          </p>
        </div>
      </div>
    </footer>
  );
} 