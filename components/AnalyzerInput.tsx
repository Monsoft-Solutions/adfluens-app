import React, { useState } from 'react';
import { Search, AtSign } from 'lucide-react';

interface AnalyzerInputProps {
  onAnalyze: (channelId: string) => void;
  isLoading: boolean;
}

export const AnalyzerInput: React.FC<AnalyzerInputProps> = ({ onAnalyze, isLoading }) => {
  const [channelId, setChannelId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelId.trim()) {
      onAnalyze(channelId.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full flex-1">
            <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 mb-1.5">
              Channel Handle or ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="channelId"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-shadow outline-none"
                placeholder="e.g., @cgcosmetic or UC_x5X..."
                required
              />
            </div>
          </div>

          <div className="w-full sm:w-auto flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors focus:ring-4 focus:ring-red-100 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Analyzing...
                </span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          API keys are securely stored on the server. Just enter a channel handle or ID to get started.
        </p>
      </form>
    </div>
  );
};
