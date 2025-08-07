export default function NotificationsPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white py-16">
      <h1 className="text-4xl font-bold text-[#ff8800] mb-4">Notifications</h1>
      <p className="text-lg text-gray-600 mb-8">Stay updated with the latest alerts and updates.</p>
      <div className="w-full max-w-2xl bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center text-blue-700">
        <span className="text-2xl">🔔</span>
        <p className="mt-2">Your notifications will appear here.</p>
      </div>
    </div>
  );
} 