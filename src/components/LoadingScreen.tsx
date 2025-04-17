import { useEffect, useState } from 'react';

const LoadingScreen = () => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  
  // Show timeout message if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 5000); // Show message after 5 seconds
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100">
      <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
      <p className="text-gray-600 text-lg mb-2">Loading...</p>
      
      {showTimeoutMessage && (
        <div className="mt-4 max-w-md text-center px-4">
          <p className="text-yellow-600 text-sm">
            This is taking longer than expected. If it continues, please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
