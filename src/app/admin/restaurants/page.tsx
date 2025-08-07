"use client";
import Link from 'next/link';

const restaurants = [
  { id: '1', name: 'Pizza Palace', owner: 'John Doe', status: 'Active' },
  { id: '2', name: 'Burger Junction', owner: 'Jane Smith', status: 'Inactive' },
  { id: '3', name: 'Spice Garden', owner: 'Bob Lee', status: 'Active' },
];

export default function AdminRestaurantsPage() {
  return (
    <div className="min-h-screen bg-white text-[#232323] p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Manage Restaurants</h1>
        <Link href="/admin" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
      <div className="bg-gray-100 rounded-xl shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Owner</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map(restaurant => (
              <tr key={restaurant.id} className="border-b hover:bg-yellow-50">
                <td className="py-2 font-semibold">{restaurant.name}</td>
                <td className="py-2">{restaurant.owner}</td>
                <td className="py-2">{restaurant.status}</td>
                <td className="py-2 flex gap-2">
                  <button className="px-3 py-1 bg-yellow-400 text-[#232323] rounded hover:bg-yellow-500 font-semibold">Edit</button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-semibold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 