import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'indigo', 
  className = '',
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    indigo: 'text-indigo-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]}
            animate-spin
          `}
        >
          <svg 
            className="w-full h-full" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color]} opacity-75`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;