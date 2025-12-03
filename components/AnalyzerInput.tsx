import React, { useState, useEffect } from 'react';
import { Search, MonitorPlay, Key, Settings } from 'lucide-react';

interface AnalyzerInputProps {
  onAnalyze: (channelId: string, apiKey: string) => void;
  isLoading: boolean;
}

export const AnalyzerInput: React.FC<AnalyzerInputProps> = ({ onAnalyze, isLoading }) => {
  const [channelId, setChannelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('youtube_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelId.trim()) {
      if (apiKey.trim()) {
        localStorage.setItem('youtube_api_key', apiKey.trim());
      }
      onAnalyze(channelId.trim(), apiKey.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full flex-1">
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

          <div className="w-full sm:w-auto flex gap-2">
             <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-lg border transition-colors ${showSettings ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              title="API Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
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

        {showSettings && (
          <div className="pt-2 border-t border-gray-100 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1.5">
              YouTube API Key <span className="text-gray-400 font-normal">(Optional if environment key is valid)</span>
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
                placeholder="Paste your Google Data API Key here"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Key is saved locally in your browser. Leave empty to try using the environment key.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};