'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, IndianRupee, TrendingUp, Calendar, Package, Star, Clock, Coins, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RealUserGuard from '@/components/RealUserGuard';

interface EarningsData {
  daily: {
    date: string;
    earnings: number;
    deliveries: number;
    hours: number;
  }[];
  weekly: {
    week: string;
    earnings: number;
    deliveries: number;
  }[];
  summary: {
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    totalEarnings: number;
    avgPerDelivery: number;
    totalDeliveries: number;
    rating: number;
  };
}

export default function EarningsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>('daily');
  const [earnings, setEarnings] = useState<EarningsData>({
    daily: [
      { date: '2024-01-15', earnings: 850, deliveries: 8, hours: 6 },
      { date: '2024-01-14', earnings: 920, deliveries: 9, hours: 7 },
      { date: '2024-01-13', earnings: 760, deliveries: 7, hours: 5.5 },
      { date: '2024-01-12', earnings: 1100, deliveries: 11, hours: 8 },
      { date: '2024-01-11', earnings: 680, deliveries: 6, hours: 5 },
      { date: '2024-01-10', earnings: 840, deliveries: 8, hours: 6.5 },
      { date: '2024-01-09', earnings: 950, deliveries: 9, hours: 7 },
    ],
    weekly: [
      { week: 'This Week', earnings: 4200, deliveries: 38 },
      { week: 'Last Week', earnings: 5800, deliveries: 52 },
      { week: '2 Weeks Ago', earnings: 5200, deliveries: 48 },
      { week: '3 Weeks Ago', earnings: 4900, deliveries: 45 },
    ],
    summary: {
      todayEarnings: 850,
      weekEarnings: 4200,
      monthEarnings: 18500,
      totalEarnings: 47300,
      avgPerDelivery: 125,
      totalDeliveries: 378,
      rating: 4.8
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <RealUserGuard requiredRoles={['delivery', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between py-4 px-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">💰 Earnings</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </header>

        <main className="pb-20">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 p-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Coins className="h-6 w-6" />
                <span className="text-sm opacity-80">Today</span>
              </div>
              <div className="text-2xl font-bold">₹{earnings.summary.todayEarnings}</div>
              <div className="text-sm opacity-80">8 deliveries</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm opacity-80">This Week</span>
              </div>
              <div className="text-2xl font-bold">₹{earnings.summary.weekEarnings}</div>
              <div className="text-sm opacity-80">38 deliveries</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm opacity-80">This Month</span>
              </div>
              <div className="text-2xl font-bold">₹{earnings.summary.monthEarnings}</div>
              <div className="text-sm opacity-80">165 deliveries</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Star className="h-6 w-6" />
                <span className="text-sm opacity-80">Rating</span>
              </div>
              <div className="text-2xl font-bold">{earnings.summary.rating}</div>
              <div className="text-sm opacity-80">Excellent</div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white mx-4 mb-6 rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Lifetime Earnings</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">₹{earnings.summary.totalEarnings.toLocaleString()}</div>
              <div className="text-gray-500">
                {earnings.summary.totalDeliveries} deliveries • ₹{earnings.summary.avgPerDelivery} avg per delivery
              </div>
            </div>
          </div>

          {/* Period Toggle */}
          <div className="px-4 mb-6">
            <div className="bg-gray-100 rounded-2xl p-1 flex">
              <button
                onClick={() => setSelectedPeriod('daily')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  selectedPeriod === 'daily'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Daily Breakdown
              </button>
              <button
                onClick={() => setSelectedPeriod('weekly')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  selectedPeriod === 'weekly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Weekly Summary
              </button>
            </div>
          </div>

          {/* Earnings List */}
          <div className="px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {selectedPeriod === 'daily' ? (
                <div className="divide-y divide-gray-100">
                  {earnings.daily.map((day, index) => (
                    <div key={day.date} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formatDate(day.date)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-3">
                            <span className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              {day.deliveries} orders
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {day.hours}h
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            ₹{day.earnings}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₹{Math.round(day.earnings / day.deliveries)}/order
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(day.earnings / 1200) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {earnings.weekly.map((week, index) => (
                    <div key={week.week} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{week.week}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            {week.deliveries} deliveries
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            ₹{week.earnings}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₹{Math.round(week.earnings / week.deliveries)}/order
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(week.earnings / 6000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="m-4 mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">💳 Payment Schedule</h3>
            <div className="text-blue-800 space-y-1">
              <p className="text-sm">• Weekly payments every Monday</p>
              <p className="text-sm">• Direct bank transfer within 24 hours</p>
              <p className="text-sm">• Next payout: Monday, Jan 22nd</p>
              <p className="text-sm font-semibold">• Amount: ₹{earnings.summary.weekEarnings}</p>
            </div>
          </div>

          {/* Tips */}
          <div className="m-4 bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
            <h3 className="font-bold text-yellow-900 mb-2">💡 Earning Tips</h3>
            <div className="text-yellow-800 space-y-1">
              <p className="text-sm">• Work during peak hours (11 AM - 2 PM, 6 PM - 10 PM)</p>
              <p className="text-sm">• Maintain high customer ratings for more orders</p>
              <p className="text-sm">• Complete deliveries quickly for bonuses</p>
              <p className="text-sm">• Stay online during rainy days for surge pricing</p>
            </div>
          </div>
        </main>
      </div>
    </RealUserGuard>
  );
}