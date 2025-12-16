import React, { useState, useEffect } from 'react';

function App() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from Laravel API
    fetch('/api/')
      .then(response => response.json())
      .then(data => {
        setApiData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching API:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to OneChat
          </h1>
          <p className="text-gray-600 mb-6">
            Laravel + React + Tailwind CSS is ready!
          </p>
          
          {/* Laravel API Integration Example */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Laravel API Status
            </h2>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : apiData ? (
              <div>
                <p className="text-green-600 font-medium">
                  ✓ {apiData.message}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Version: {apiData.version}
                </p>
              </div>
            ) : (
              <p className="text-red-600">API connection failed</p>
            )}
          </div>

          <div className="flex gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200">
              Get Started
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition duration-200">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

