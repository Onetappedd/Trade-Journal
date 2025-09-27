'use client';

import React from 'react';

export function CSVImporterTest() {
  console.log('[CSVImporterTest] Component mounted');
  
  return (
    <div data-testid="importer-mounted">
      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
        <h3 className="text-green-200 font-semibold mb-2">CSV Importer Test</h3>
        <p className="text-green-300">This is a test version of the CSV Importer component.</p>
        <div data-testid="import-file-input">File input placeholder</div>
        <div data-testid="import-start-button">Start button placeholder</div>
      </div>
    </div>
  );
}
