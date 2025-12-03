import React from 'react';
import { Youtube } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 text-white p-1.5 rounded-lg">
            <Youtube className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            YouTube Channel <span className="text-red-600">Analyzer</span>
          </h1>
        </div>
      </div>
    </header>
  );
};