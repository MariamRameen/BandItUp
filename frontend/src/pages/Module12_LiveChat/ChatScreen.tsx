import React, { useState } from 'react';
import Header from '../../components/Header';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! I\'m your IELTS tutor. How can I help you today?', sender: 'bot', timestamp: '10:00 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const commonQuestions = [
    'How is my band score calculated?',
    'What\'s the best way to improve my writing?',
    'How can I practice speaking?',
    'When should I take the actual IELTS test?'
  ];

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (newMessage.trim()) {
    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    setNewMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "That's a great question! Based on your recent performance, I recommend focusing on coherence in your writing tasks. Would you like me to suggest some specific exercises?",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  }
};

  const handleQuickQuestion = (question: string) => {
  setNewMessage(question);
};

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#7D3CFF] text-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#7D3CFF] font-bold">
                AI
              </div>
              <div>
                <h2 className="font-semibold">IELTS Tutor Online</h2>
                <p className="text-sm opacity-90">Usually replies instantly</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-[#7D3CFF] text-white rounded-br-none'
                      : 'bg-[#F8F9FF] text-[#333] rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-[#777]'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Common Questions */}
          <div className="border-t border-[#F0E8FF] p-4">
            <p className="text-sm text-[#777] mb-3">Common questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {commonQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left p-3 bg-[#F8F9FF] hover:bg-[#E8DCFF] rounded-lg text-sm text-[#333] transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-[#F0E8FF] p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                maxLength={500}
              />
              <button
                type="submit"
                className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6] transition-colors"
              >
                Send
              </button>
            </form>
            <p className="text-xs text-[#777] mt-2 text-center">
              Max 500 characters per message
            </p>
          </div>

          {/* Feedback Section */}
          <div className="border-t border-[#F0E8FF] p-4 bg-[#F8F9FF]">
            <p className="text-sm text-[#777] mb-2">Was this response helpful?</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600">
                👍 Yes
              </button>
              <button className="flex-1 bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600">
                👎 No
              </button>
              <button className="flex-1 bg-[#7D3CFF] text-white py-2 rounded text-sm hover:bg-[#6B2FE6]">
                🐛 Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}