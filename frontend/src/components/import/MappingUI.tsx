import React from 'react';

interface MappingUIProps {
  headers: string[];
  mapping: Record<string, string | null>;
  onChange: (mapping: Record<string, string | null>) => void;
}

const CANONICAL_FIELDS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'side', label: 'Side' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'price', label: 'Price' },
  { key: 'trade_time_utc', label: 'Trade Time' },
  { key: 'underlying', label: 'Underlying' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'strike', label: 'Strike' },
  { key: 'option_type', label: 'Option Type' },
  { key: 'fees', label: 'Fees' },
  { key: 'venue', label: 'Venue' },
  { key: 'source', label: 'Source' }
];

export function MappingUI({ headers, mapping, onChange }: MappingUIProps) {
  const handleFieldChange = (canonicalField: string, selectedHeader: string) => {
    const newMapping = { ...mapping };
    
    if (selectedHeader === 'Unmapped') {
      newMapping[canonicalField] = null;
    } else {
      newMapping[canonicalField] = selectedHeader;
    }
    
    onChange(newMapping);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Map CSV Columns</h3>
      <p className="text-sm text-gray-600">
        Select which CSV column corresponds to each required field.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CANONICAL_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <select
              value={mapping[field.key] || 'Unmapped'}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Unmapped">Unmapped</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
