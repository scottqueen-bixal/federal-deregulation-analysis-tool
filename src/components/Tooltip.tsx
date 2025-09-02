'use client';

import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  show: boolean;
  id: string;
  className?: string;
}

export default React.memo(function Tooltip({ children, show, id, className = '' }: TooltipProps) {
  if (!show) return null;

  return (
    <div
      id={id}
      role="tooltip"
      className={`absolute z-50 w-80 p-4 bg-white border border-gray-300 rounded-lg shadow-lg -top-2 left-8 animate-fade-in ${className}`}
    >
      <div className="text-sm text-gray-900">
        {children}
      </div>
      {/* Tooltip arrow */}
      <div className="absolute top-3 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-300"></div>
      <div className="absolute top-3 -left-1 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div>
    </div>
  );
});
