import React from 'react';

interface MappingUIProps {
  headers: string[];
  mapping: Record<string, string | null>;
  onChange: (mapping: Record<string, string | null>) => void;
}

const CANONICAL_FIELDS = [
  { key: 'symbol', label: 'Symbol', required: true, description: 'Stock/option symbol (e.g., TSLA, TSLA250822C00325000)' },
  { key: 'side', label: 'Side', required: true, description: 'Buy or Sell' },
  { key: 'quantity', label: 'Quantity', required: true, description: 'Number of shares/contracts' },
  { key: 'price', label: 'Price', required: true, description: 'Price per share/contract' },
  { key: 'trade_time_utc', label: 'Trade Time', required: true, description: 'When the trade occurred' },
  { key: 'underlying', label: 'Underlying', required: false, description: 'For options: underlying stock symbol' },
  { key: 'expiry', label: 'Expiry', required: false, description: 'For options: expiration date' },
  { key: 'strike', label: 'Strike', required: false, description: 'For options: strike price' },
  { key: 'option_type', label: 'Option Type', required: false, description: 'For options: CALL or PUT' },
  { key: 'fees', label: 'Fees', required: false, description: 'Commission and fees' },
  { key: 'venue', label: 'Venue', required: false, description: 'Exchange or broker' },
  { key: 'source', label: 'Source', required: false, description: 'Data source identifier' }
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
      <div>
        <h3 className="text-lg font-medium text-foreground">Map CSV Columns</h3>
        <p className="text-sm text-muted-foreground">
          Select which CSV column corresponds to each field. <span className="text-red-500">*</span> indicates required fields.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CANONICAL_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={mapping[field.key] || 'Unmapped'}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                field.required && !mapping[field.key] 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
            >
              <option value="Unmapped">Unmapped</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Webull Options Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Symbol:</strong> Map to "Name" column (contains full option symbol like TSLA250822C00325000)</li>
          <li>• <strong>Trade Time:</strong> Map to "PLA TIM" column (contains timestamps like 08/09:ED1)</li>
          <li>• <strong>Price:</strong> Map to "Avg Price" column (contains prices like 3.51)</li>
          <li>• <strong>Quantity:</strong> Map to "Filled" column (contains filled quantities)</li>
          <li>• <strong>Underlying, Expiry, Strike, Option Type:</strong> Will be automatically extracted from the symbol</li>
        </ul>
      </div>
    </div>
  );
}
