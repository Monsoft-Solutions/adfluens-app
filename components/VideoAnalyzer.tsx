import React, { useState, useEffect, useRef } from 'react';
import { YouTubeVideo, YouTubeComment, ViralAnalysisResult, ChatMessage } from '../types';
import { analyzeVideoContent, chatWithVideoContext } from '../services/aiService';
import { Sparkles, RefreshCw, MessageSquare, Send, Lightbulb, Zap, FileText, Bot } from 'lucide-react';

interface VideoAnalyzerProps {
  video: YouTubeVideo;
  comments: YouTubeComment[];
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ video, comments }) => {
  const [analysis, setAnalysis] = useState<ViralAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = `video_analysis_${video.id}`;

  useEffect(() => {
    // Load from local storage if available
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAnalysis(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [video.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnalyze = async (force = false) => {
    if (!force && analysis) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeVideoContent(video, comments);
      setAnalysis(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      // Reset chat on new analysis
      setChatMessages([]); 
    } catch (err: any) {
      setError(err.message || "Failed to analyze video");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !analysis) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      // Convert internal chat format to Gemini history format
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await chatWithVideoContext(history, userMsg, video, analysis);
      
      setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-purple-600 rounded-full animate-spin"></div>
          <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mt-6">Analyzing Viral Mechanics...</h3>
        <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
          Extracting hooks, audience sentiment, and viral triggers from metadata and comments.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-8 shadow-sm text-center">
        <div className="bg-white p-4 rounded-full inline-flex mb-4 shadow-sm">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Uncover Viral Secrets</h2>
        <p className="text-gray-600 max-w-lg mx-auto mb-8">
          Use AI to analyze why this video worked. Get a summary, identify hooks, and generate new content ideas based on this success.
        </p>
        <button
          onClick={() => handleAnalyze()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-md flex items-center gap-2 mx-auto"
        >
          <Sparkles className="w-5 h-5" />
          Analyze Video Strategy
        </button>
        {error && <p className="text-red-600 mt-4 text-sm bg-red-50 p-2 rounded inline-block">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Viral Analysis Report
        </h2>
        <button 
          onClick={() => handleAnalyze(true)}
          className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-50"
        >
          <RefreshCw className="w-4 h-4" />
          Re-Analyze
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Static Analysis */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Executive Summary
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">{analysis.summary}</p>
          </div>

          {/* Hooks & Reasons */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Why It Went Viral
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">The Hooks</span>
                <ul className="space-y-2">
                  {analysis.hooks.map((hook, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-amber-500 font-bold">•</span>
                      {hook}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Viral Triggers</span>
                <ul className="space-y-2">
                  {analysis.viralReasons.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-amber-500 font-bold">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Ideas */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-green-600" />
              Content Ideas for You
            </h3>
            <ul className="space-y-3">
              {analysis.contentIdeas.map((idea, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-800 bg-white/60 p-3 rounded-lg border border-green-100/50">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="lg:h-[600px] flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Strategy Assistant</h3>
              <p className="text-xs text-gray-500">Ask questions about this video's performance</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 mt-10 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto opacity-20" />
                <p className="text-sm">Ask me how to adapt this format or specific questions about the hooks!</p>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm shadow-sm"
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || chatLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};