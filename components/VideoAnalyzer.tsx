
import React, { useState, useEffect, useRef } from 'react';
import { YouTubeVideo, YouTubeComment, ViralAnalysisResult, ChatMessage } from '../types';
import { analyzeVideoContent, chatWithVideoContext } from '../services/aiService';
import { Sparkles, RefreshCw, MessageSquare, Send, Lightbulb, Zap, FileText, Bot, Play, ExternalLink } from 'lucide-react';

interface VideoAnalyzerProps {
  video: YouTubeVideo;
  comments: YouTubeComment[];
  apiKey: string;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ video, comments, apiKey }) => {
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
    } else {
      setAnalysis(null);
    }
  }, [video.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const handleAnalyze = async (force = false) => {
    if (!force && analysis) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeVideoContent(video, comments, apiKey);
      setAnalysis(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      if (force) {
         setChatMessages([]); 
      }
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

      const responseText = await chatWithVideoContext(history, userMsg, video, analysis, apiKey);
      
      setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-gray-100 border-t-purple-600 rounded-full animate-spin"></div>
          <Sparkles className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Analyzing Video Content...</h3>
        <p className="text-gray-500 text-sm mt-3 text-center max-w-md leading-relaxed">
          Gemini is accessing the video page, analyzing the structure, and extracting viral insights.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-xl border border-purple-100 p-10 shadow-sm text-center">
        <div className="bg-white p-4 rounded-full inline-flex mb-6 shadow-md ring-4 ring-purple-50">
          <Sparkles className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Uncover Viral Secrets</h2>
        <p className="text-gray-600 max-w-lg mx-auto mb-8 text-base">
          Use AI to analyze why this video worked. We'll use Google Search grounding to understand the video content and generate actionable ideas.
        </p>
        <button
          onClick={() => handleAnalyze()}
          className="group bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-purple-200 flex items-center gap-3 mx-auto"
        >
          <Play className="w-5 h-5 fill-current" />
          Analyze Video Strategy
        </button>
        {error && (
          <div className="mt-6 flex justify-center">
             <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-2 rounded-lg">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Viral Analysis Report
          </h2>
          <p className="text-xs text-gray-500 mt-1">Generated by Gemini 2.5 Flash</p>
        </div>
        <button 
          onClick={() => handleAnalyze(true)}
          className="text-sm text-gray-600 hover:text-purple-600 flex items-center gap-1.5 transition-colors px-4 py-2 rounded-lg hover:bg-purple-50 border border-transparent hover:border-purple-100 font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Re-Analyze
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Static Analysis */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
              <FileText className="w-4 h-4 text-blue-500" />
              Executive Summary
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm border-l-2 border-blue-500 pl-4">{analysis.summary}</p>
          </div>

          {/* Hooks & Reasons */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
              <Zap className="w-4 h-4 text-amber-500" />
              Viral Breakdown
            </h3>
            
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-gray-500 mb-2 block flex items-center gap-1">
                  The Hooks (Attention Grabbers)
                </span>
                <ul className="space-y-2">
                  {analysis.hooks.map((hook, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                      <span className="text-amber-500 font-bold">•</span>
                      {hook}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <span className="text-xs font-semibold text-gray-500 mb-2 block flex items-center gap-1">
                  Why It Went Viral (Psychology)
                </span>
                <ul className="space-y-2">
                  {analysis.viralReasons.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/50">
                      <span className="text-purple-500 font-bold">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Ideas */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              Content Ideas for You
            </h3>
            <ul className="space-y-3">
              {analysis.contentIdeas.map((idea, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-800 bg-white/80 p-3.5 rounded-lg border border-emerald-100/50 shadow-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{idea}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Sources / Grounding */}
          {analysis.sources && analysis.sources.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <h3 className="font-bold text-gray-500 mb-2 text-xs uppercase tracking-wider">
                Sources Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.sources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-white px-2 py-1 rounded border border-gray-200"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Chat */}
        <div className="lg:h-full lg:min-h-[600px] flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
               <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Strategy Assistant</h3>
              <p className="text-xs text-gray-500">Ask questions about this video's performance</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white custom-scrollbar">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-4 p-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 opacity-20" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-600">No questions yet</p>
                    <p className="text-xs text-gray-400 mt-1">Try asking: "How can I apply this hook to my niche?"</p>
                </div>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-200">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
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
                className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm shadow-sm transition-shadow"
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || chatLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
