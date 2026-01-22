'use client';

import { useState } from 'react';

export default function TestPDF() {
  const [fileId, setFileId] = useState('');

  const handleTest = () => {
    if (fileId) {
      // Open PDF viewer in a new window with minimal UI
      const pdfViewerUrl = `/pdf-viewer?fileId=${fileId}`;
      window.open(
        pdfViewerUrl, 
        '_blank',
        'width=1200,height=800,scrollbars=yes,resizable=yes,location=no,menubar=no,toolbar=no,status=no'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Test PDF Viewer</h1>
        
        <div className="mb-4">
          <label htmlFor="fileId" className="block text-sm font-medium text-gray-700 mb-2">
            File ID from Google Sheets:
          </label>
          <input
            type="text"
            id="fileId"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter file ID..."
          />
        </div>
        
        <button
          onClick={handleTest}
          disabled={!fileId}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Test PDF Viewer
        </button>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Instructions:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Get a file ID from your Google Sheets CSV</li>
            <li>Paste it in the input field above</li>
            <li>Click "Test PDF Viewer" to open the custom viewer</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
