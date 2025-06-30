"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Tag, Users, Percent, Gift, Star, Zap, CreditCard, Utensils, Search, Sparkles, Brain } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  description: string;
  savings: number;
  expiryDate: string;
  category: 'new_user' | 'combo' | 'special' | 'seasonal' | 'group' | 'payment' | 'time';
  tags: string[];
  code?: string;
  isProminent?: boolean;
  minOrder?: number;
  maxDiscount?: number;
  timing?: string;
  paymentMethod?: string;
}

interface AIRecommendation {
  dealId: string;
  confidence: number;
  reason: string;
}

const categories = [
  { id: 'all', label: 'All Offers', icon: Tag },
  { id: 'new_user', label: 'New User Offers', icon: Gift },
  { id: 'payment', label: 'Payment Offers', icon: CreditCard },
  { id: 'time', label: 'Time-Based Offers', icon: Clock },
  { id: 'combo', label: 'Combo Deals', icon: Utensils },
  { id: 'special', label: 'Special Offers', icon: Star }
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCopyNotification, setShowCopyNotification] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/deals')
      .then(res => res.json())
      .then((data: Deal[]) => setDeals(data));
  }, []);

  // Simulate AI recommendation generation
  const generateAIRecommendations = async () => {
    setLoading(true);
    try {
      // This would be replaced with actual API call to your AI service
      const mockAIResponse: AIRecommendation[] = [
        {
          dealId: 'new1',
          confidence: 0.95,
          reason: 'Based on your first visit to our platform'
        },
        {
          dealId: 'time1',
          confidence: 0.85,
          reason: 'Matches your usual ordering time'
        },
        {
          dealId: 'combo1',
          confidence: 0.75,
          reason: 'Popular choice for your group size'
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      setAiRecommendations(mockAIResponse);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Smart search with AI suggestions
  const handleSmartSearch = (term: string) => {
    setSearchTerm(term);
    // This would include AI-powered search suggestions
    // For now, we'll use basic search
  };

  useEffect(() => {
    if (isAiEnabled) {
      generateAIRecommendations();
    }
  }, [isAiEnabled]);

  const filteredDeals = deals.filter(deal => {
    const matchesCategory = selectedCategory === 'all' || deal.category === selectedCategory;
    const matchesSearch = 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setShowCopyNotification(code);
    setTimeout(() => setShowCopyNotification(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-[#1a1a1a] text-[#d4af37]">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10 z-0" />
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="relative z-20 container mx-auto px-4 h-full flex items-center"
        >
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#d4af37] to-[#e6c456] bg-clip-text text-transparent"
            >
              Exclusive Deals & Offers
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-[#d4af37]/80 leading-relaxed"
            >
              Discover amazing savings on your favorite meals, crafted specially for you
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex items-center gap-4"
            >
              <button
                onClick={() => setIsAiEnabled(!isAiEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isAiEnabled 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-[#232323] text-[#d4af37]/70'
                }`}
              >
                <Brain className="w-5 h-5" />
                {isAiEnabled ? 'AI Enabled' : 'Enable AI'}
              </button>
              {loading && (
                <span className="text-[#d4af37]/70 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Processing...
                </span>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* AI Recommendations Section */}
      {isAiEnabled && aiRecommendations.length > 0 && (
        <div className="container mx-auto px-4 -mt-20 relative z-30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-purple-900/50 rounded-2xl p-8 shadow-2xl border border-purple-500/20 backdrop-blur-sm mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-400">AI Recommended Deals</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiRecommendations.map((rec) => {
                const deal = deals.find(d => d.id === rec.dealId);
                if (!deal) return null;
                return (
                  <motion.div
                    key={rec.dealId}
                    whileHover={{ scale: 1.02 }}
                    className="bg-purple-900/20 rounded-xl p-6 border border-purple-500/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-purple-400">{deal.title}</h3>
                      <div className="px-2 py-1 bg-purple-500/20 rounded-full text-sm text-purple-400">
                        {Math.round(rec.confidence * 100)}% Match
                      </div>
                    </div>
                    <p className="text-sm text-purple-400/70 mb-4">{rec.reason}</p>
                    <button
                      onClick={() => handleCopyCode(deal.code || '')}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      {deal.code ? 'Copy Code' : 'View Deal'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col md:flex-row gap-4 items-center justify-between mb-12"
        >
          <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-5 py-3 rounded-xl whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#e6c456] text-black shadow-lg'
                      : 'bg-[#232323] text-[#d4af37] hover:bg-[#2a2a2a] border border-[#d4af37]/20'
                  }`}
                >
                  <Icon size={18} />
                  {category.label}
                </motion.button>
              );
            })}
          </div>
          <motion.div 
            variants={fadeInUp}
            className="relative w-full md:w-64"
          >
            <div className="relative">
              <input
                type="text"
                placeholder={isAiEnabled ? "AI-powered search..." : "Search offers..."}
                value={searchTerm}
                onChange={(e) => handleSmartSearch(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-[#232323] text-[#d4af37] placeholder-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37] border border-[#d4af37]/20 transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#d4af37]/50 flex items-center gap-2">
                {isAiEnabled && <Brain className="w-4 h-4" />}
                <Search size={18} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Deals Grid */}
        <AnimatePresence>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredDeals.map((deal) => (
              <motion.div
                key={deal.id}
                variants={fadeInUp}
                layout
                className="group"
              >
                <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-[#d4af37]/10 hover:border-[#d4af37]/30">
                  <div className="p-8 border-b border-[#d4af37]/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#e6c456] bg-clip-text text-transparent">
                        {deal.title}
                      </h3>
                      <div className="bg-gradient-to-r from-[#d4af37] to-[#e6c456] text-black px-4 py-2 rounded-full font-semibold">
                        {typeof deal.savings === 'number' && deal.savings > 100 ? `₹${deal.savings} OFF` : `${deal.savings}% OFF`}
                      </div>
                    </div>
                    <p className="text-[#d4af37]/70 text-lg">{deal.description}</p>
                  </div>
                  <div className="p-8">
                    <div className="space-y-3 mb-6">
                      {deal.minOrder && (
                        <div className="flex items-center gap-3 text-sm text-[#d4af37]/70">
                          <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
                            <Tag size={16} />
                          </div>
                          <span>Min order: ₹{deal.minOrder}</span>
                        </div>
                      )}
                      {deal.maxDiscount && (
                        <div className="flex items-center gap-3 text-sm text-[#d4af37]/70">
                          <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
                            <Zap size={16} />
                          </div>
                          <span>Max discount: ₹{deal.maxDiscount}</span>
                        </div>
                      )}
                      {deal.timing && (
                        <div className="flex items-center gap-3 text-sm text-[#d4af37]/70">
                          <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
                            <Clock size={16} />
                          </div>
                          <span>{deal.timing}</span>
                        </div>
                      )}
                      {deal.paymentMethod && (
                        <div className="flex items-center gap-3 text-sm text-[#d4af37]/70">
                          <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
                            <CreditCard size={16} />
                          </div>
                          <span>{deal.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                    {deal.code && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#232323] px-4 py-3 rounded-xl font-mono flex-1 text-center border border-[#d4af37]/20">
                          {deal.code}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopyCode(deal.code!)}
                          className="bg-gradient-to-r from-[#d4af37] to-[#e6c456] text-black px-5 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap"
                        >
                          {showCopyNotification === deal.code ? 'Copied!' : 'Copy'}
                        </motion.button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {deal.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 bg-[#d4af37]/10 rounded-full text-sm border border-[#d4af37]/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#d4af37]/70 mb-6">
                      <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
                        <Clock size={16} />
                      </div>
                      <span>Valid till: {new Date(deal.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-[#d4af37] to-[#e6c456] text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Order Now
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredDeals.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-2xl text-[#d4af37]/70">No offers found matching your criteria</p>
          </motion.div>
        )}
      </div>
    </div>
  );
} 