export default function FavoritesPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white py-16">
      <h1 className="text-4xl font-bold text-[#ff8800] mb-4">Your Favorites</h1>
      <p className="text-lg text-gray-600 mb-8">All your favorite dishes in one place.</p>
      <div className="w-full max-w-2xl bg-pink-50 border-2 border-pink-200 rounded-xl p-8 text-center text-pink-700">
        <span className="text-2xl">❤️</span>
        <p className="mt-2">Your favorite items will appear here.</p>
      </div>
    </div>
  );
} 