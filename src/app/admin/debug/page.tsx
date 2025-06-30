'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, Trash2 } from 'lucide-react';

export default function DebugPage() {
  const [localStorageData, setLocalStorageData] = useState<{[key: string]: any}>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLocalStorageData();
  }, []);

  const loadLocalStorageData = () => {
    const data: {[key: string]: any} = {};
    
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        try {
          // Try to parse as JSON
          data[key] = JSON.parse(value || '');
        } catch {
          // If not JSON, store as string
          data[key] = value;
        }
      }
    }
    
    setLocalStorageData(data);
  };

  const clearKey = (key: string) => {
    if (confirm(`Are you sure you want to delete the key "${key}"?`)) {
      localStorage.removeItem(key);
      loadLocalStorageData();
    }
  };

  const filteredData = Object.entries(localStorageData).filter(([key, value]) => 
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const orderRelatedKeys = Object.keys(localStorageData).filter(key => 
    key.includes('order') || key.includes('cart') || key.includes('address')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Debug - localStorage Contents</h1>
                <p className="text-gray-600">View all localStorage data to debug missing orders</p>
              </div>
            </div>
            
            <button
              onClick={loadLocalStorageData}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(localStorageData).length}</div>
              <div className="text-sm text-blue-700">Total Keys</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{orderRelatedKeys.length}</div>
              <div className="text-sm text-green-700">Order/Cart/Address Keys</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {orderRelatedKeys.filter(key => key.includes('order')).length}
              </div>
              <div className="text-sm text-yellow-700">Order Keys</div>
            </div>
          </div>
        </div>

        {/* Order Related Keys */}
        {orderRelatedKeys.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order/Cart/Address Related Keys</h2>
            <div className="space-y-2">
              {orderRelatedKeys.map(key => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{key}</div>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(localStorageData[key]) 
                        ? `Array with ${localStorageData[key].length} items`
                        : typeof localStorageData[key] === 'object'
                        ? 'Object'
                        : 'String'
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => clearKey(key)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search keys or values..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* All Data */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">All localStorage Data</h2>
          <div className="space-y-4">
            {filteredData.map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{key}</h3>
                  <button
                    onClick={() => clearKey(key)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded overflow-auto max-h-40">
                  <pre>{JSON.stringify(value, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No matching data found' : 'No data in localStorage'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 