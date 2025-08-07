"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Deal {
  id: string;
  title: string;
  code: string;
  savings: number;
  active: boolean;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/deals')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch deals');
        return res.json();
      })
      .then((data: Deal[]) => setDeals(data))
      .catch(() => setError('Failed to load deals'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#232323] p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Manage Deals</h1>
        <Link href="/admin" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
      <div className="mb-6 flex justify-end">
        <button className="bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-dark transition">+ Add Deal</button>
      </div>
      <div className="bg-gray-100 rounded-xl shadow p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500 font-semibold">Loading deals...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 font-semibold">{error}</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Title</th>
                <th className="py-2">Code</th>
                <th className="py-2">Savings</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(deal => (
                <tr key={deal.id} className="border-b hover:bg-yellow-50">
                  <td className="py-2 font-semibold">{deal.title}</td>
                  <td className="py-2">{deal.code}</td>
                  <td className="py-2">{deal.savings}%</td>
                  <td className="py-2">
                    {deal.active ? (
                      <span className="text-green-600 font-bold">Active</span>
                    ) : (
                      <span className="text-gray-400 font-bold">Inactive</span>
                    )}
                  </td>
                  <td className="py-2 flex gap-2">
                    <button className="px-3 py-1 bg-yellow-400 text-[#232323] rounded hover:bg-yellow-500 font-semibold">Edit</button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 