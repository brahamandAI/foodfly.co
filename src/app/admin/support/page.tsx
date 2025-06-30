"use client";
import Link from 'next/link';

const tickets = [
  { id: '1', subject: 'Order not delivered', user: 'John Doe', status: 'Open' },
  { id: '2', subject: 'Payment issue', user: 'Jane Smith', status: 'Closed' },
  { id: '3', subject: 'App bug', user: 'Bob Lee', status: 'Open' },
];

export default function AdminSupportPage() {
  return (
    <div className="min-h-screen bg-white text-[#232323] p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Support Tickets</h1>
        <Link href="/admin" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
      <div className="bg-gray-100 rounded-xl shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Subject</th>
              <th className="py-2">User</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id} className="border-b hover:bg-yellow-50">
                <td className="py-2 font-semibold">{ticket.subject}</td>
                <td className="py-2">{ticket.user}</td>
                <td className="py-2">{ticket.status}</td>
                <td className="py-2 flex gap-2">
                  <button className="px-3 py-1 bg-yellow-400 text-[#232323] rounded hover:bg-yellow-500 font-semibold">View</button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-semibold">Close</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 