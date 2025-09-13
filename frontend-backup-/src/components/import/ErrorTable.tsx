import React from 'react';

interface ErrorRow {
  rowNo: number;
  errors: string[];
}

interface ErrorTableProps {
  rows: ErrorRow[];
}

export function ErrorTable({ rows }: ErrorTableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No errors found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Row
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Errors
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.rowNo}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <ul className="list-disc list-inside space-y-1">
                  {row.errors.map((error, errorIndex) => (
                    <li key={errorIndex} className="text-red-600">
                      {error}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
