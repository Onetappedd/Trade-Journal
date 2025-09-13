import React from 'react';

interface SummaryCardProps {
  inserted: number;
  failed: number;
  duplicates: number;
  onRollback?: () => void;
}

export function SummaryCard({ inserted, failed, duplicates, onRollback }: SummaryCardProps) {
  const total = inserted + failed + duplicates;
  const successRate = total > 0 ? (inserted / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Import Summary</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{inserted}</div>
          <div className="text-sm text-gray-600">Inserted</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{duplicates}</div>
          <div className="text-sm text-gray-600">Duplicates</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Success Rate</span>
          <span>{successRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {onRollback && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onRollback}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Rollback Import
          </button>
        </div>
      )}
    </div>
  );
}
