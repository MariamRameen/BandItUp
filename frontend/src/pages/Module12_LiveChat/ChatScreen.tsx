import React, { useState, useRef, useEffect } from 'react';
import Header from '../../components/Header';
import ReportModal from '../../components/ReportModal';
import ReactMarkdown from 'react-markdown';
import { ThumbsUp, ThumbsDown, Bug } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  source?: 'knowledge_base' | 'hybrid' | 'gpt';
}

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

const BASE_URL = 'http://localhost:4000/api/chat';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const WORD_LIMIT = 50;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your IELTS Buddy 👋 Ask me anything about IELTS — band scores, tips, strategies or how to use this app!",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState('');

  const historyRef = useRef<HistoryItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commonQuestions = [
    'How is my band score calculated?',
    "What's the best way to improve writing?",
    'How can I practice speaking?',
    'When should I take the IELTS test?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    setWordCount(countWords(val));
    if (error) setError('');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    if (countWords(text) > WORD_LIMIT) {
      setError(`Please keep your message under ${WORD_LIMIT} words.`);
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = { id: Date.now(), text, sender: 'user', timestamp };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');
    setWordCount(0);
    setError('');
    setIsTyping(true);

    try {
      const response = await fetch(`${BASE_URL}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: text, history: historyRef.current }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get response');

      const botMsg: Message = {
        id: Date.now() + 1,
        text: data.reply,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
      };
      setMessages((prev) => [...prev, botMsg]);

      const newHistory: HistoryItem[] = [
        ...historyRef.current,
        { role: 'user' as const, content: text },
        { role: 'assistant' as const, content: data.reply },
      ].slice(-8);
      historyRef.current = newHistory;

    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: err.message || 'Sorry, something went wrong. Please try again.',
        sender: 'bot' as const,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} />}

      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-[#7D3CFF] text-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#7D3CFF] font-bold">IB</div>
              <div>
                <h2 className="font-semibold">IELTS BUDDY</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-sm opacity-90">Online · Usually replies instantly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'bot' && (
                  <div className="w-7 h-7 bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">IB</div>
                )}
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-[#7D3CFF] text-white rounded-br-none'
                    : 'bg-[#F8F9FF] text-[#333] rounded-bl-none border border-[#F0E8FF]'
                }`}>
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>

                 
                  {message.sender === 'bot' && message.source && (
                    <p className="text-xs mt-2 italic opacity-60">
                      {message.source === 'knowledge_base' || message.source === 'hybrid'
                        ? '📄 Extracted from official internal documentation'
                        : '🤖 Here whenever you need help.'}
                    </p>
                  )}

                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-purple-200' : 'text-[#999]'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">IB</div>
                <div className="bg-[#F8F9FF] border border-[#F0E8FF] px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-[#7D3CFF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#7D3CFF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#7D3CFF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <p className="text-xs text-[#999] mt-1">Please be patient...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

         
          <div className="border-t border-[#F0E8FF] p-4">
            <p className="text-sm text-[#777] mb-3">Common questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {commonQuestions.map((question, index) => (
                <button key={index} onClick={() => sendMessage(question)} disabled={isTyping}
                  className="text-left p-3 bg-[#F8F9FF] hover:bg-[#E8DCFF] rounded-lg text-sm text-[#333] transition-colors disabled:opacity-50">
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-[#F0E8FF] p-4">
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text" value={newMessage} onChange={handleInputChange}
                placeholder="Type your question... (max 50 words)" disabled={isTyping}
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                  wordCount > WORD_LIMIT ? 'border-red-400' : 'border-[#E2D9FF] focus:border-[#7D3CFF]'
                }`}
              />
              <button type="submit" disabled={isTyping || !newMessage.trim() || wordCount > WORD_LIMIT}
                className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isTyping ? '...' : 'Send'}
              </button>
            </form>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-[#777]">Max 50 words per message</p>
              <p className={`text-xs ${wordCount > WORD_LIMIT ? 'text-red-500 font-medium' : 'text-[#999]'}`}>
                {wordCount}/{WORD_LIMIT} words
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div className="border-t border-[#F0E8FF] p-4 bg-[#F8F9FF]">
            <p className="text-sm text-[#777] mb-2">Was this response helpful?</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"><ThumbsUp className="w-4 h-4" /> Yes</button>
              <button className="flex-1 bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600 flex items-center justify-center gap-1"><ThumbsDown className="w-4 h-4" /> No</button>
              <button onClick={() => setShowReportModal(true)}
                className="flex-1 bg-[#7D3CFF] text-white py-2 rounded text-sm hover:bg-[#6B2FE6] transition-colors flex items-center justify-center gap-1">
                <Bug className="w-4 h-4" /> Report Issue
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

