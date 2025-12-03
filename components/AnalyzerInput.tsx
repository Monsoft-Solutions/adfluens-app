import React, { useState, useEffect } from 'react';
import { Search, Key, MonitorPlay } from 'lucide-react';

interface AnalyzerInputProps {
  onAnalyze: (channelId: string, apiKey: string) => void;
  initialApiKey: string;
  isLoading: boolean;
}

export const AnalyzerInput: React.FC<AnalyzerInputProps> = ({ onAnalyze, initialApiKey, isLoading }) => {
  const [channelId, setChannelId] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    setApiKey(initialApiKey);
  }, [initialApiKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelId.trim() && apiKey.trim()) {
      onAnalyze(channelId.trim(), apiKey.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
        
        <div className="w-full md:flex-1">
          <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 mb-1.5">
            Channel ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MonitorPlay className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="channelId"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-shadow outline-none"
              placeholder="e.g., UC_x5XG1OV2P6uZZ5FSM9Ttw"
              required
            />
          </div>
        </div>

        <div className="w-full md:flex-1">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1.5">
            Google Data API Key
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-shadow outline-none"
              placeholder="Paste your API key here"
              required
            />
          </div>
        </div>

        <div className="w-full md:w-auto">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors focus:ring-4 focus:ring-red-100 disabled:opacity-70 disabled:cursor-not-allowed"
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
      </form>
      <div className="mt-3 text-xs text-gray-500 flex items-start gap-1">
        <span>ℹ️</span>
        <p>API Key is stored locally in your browser for convenience.</p>
      </div>
    </div>
  );
};