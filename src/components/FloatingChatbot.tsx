import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  BookOpen,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { api } from '../lib/api';

interface FloatingChatbotProps {
  examTitle?: string;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ examTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I'm your **StudySync AI companion**. 
      
I know your exam timeline, your daily study sessions, and I'm grounded in your **uploaded notes**. Ask me to explain concepts, quiz you on hard topics, or review your schedule!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.chatAI(payloadMessages);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.text,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an issue connecting to the AI engine. ${err.message || 'Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptChip = (chipText: string) => {
    handleSendMessage(chipText);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-600 animate-pulse" />
          </div>
          <span className="text-xs font-bold hidden sm:inline">Ask AI Companion</span>
          <span className="px-1.5 py-0.5 bg-indigo-500 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-indigo-100">
            Grounded
          </span>
        </button>
      )}

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div
          className="w-[90vw] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
          id="floating-chatbot-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-100" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">StudySync AI Tutor</h3>
                <p className="text-[10px] text-indigo-200">Grounded in your notes & plan</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'reset',
                      role: 'assistant',
                      content: `Chat cleared. How can I help with your study plan today?`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ])
                }
                className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Clear chat history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Sources / Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-500">Sources: </span>
                        {msg.sources.join(', ')}
                      </div>
                    )}

                    <div
                      className={`text-[9px] mt-1 text-right ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">
                      Me
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  AI
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handlePromptChip("What should I focus on studying today?")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors shrink-0"
            >
              📅 Today's Focus
            </button>
            <button
              onClick={() => handlePromptChip("Explain cellular respiration chemiosmosis simply")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors shrink-0"
            >
              🧬 Explain Respiration
            </button>
            <button
              onClick={() => handlePromptChip("Why were hard topics given +50% time?")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors shrink-0"
            >
              🔥 Hard Topics
            </button>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your notes or study plan..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
