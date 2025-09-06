import React from 'react';

interface ProgressBarProps {
  value: number; // 0..1
}

export function ProgressBar({ value }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value * 100));
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
