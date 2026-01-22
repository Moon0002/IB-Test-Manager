import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 py-8 px-6 text-center border-t border-gray-200 mt-12 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
    </footer>
  );
} 