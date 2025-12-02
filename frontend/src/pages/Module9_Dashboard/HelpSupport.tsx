
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, MessageCircle } from 'lucide-react';

export default function Help(): JSX.Element {
  const navigate = useNavigate();

  const handleNavigate = (path: string): void => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <HelpCircle size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#333]">Help & Support</h1>
              <p className="text-[#666]">Get assistance with your IELTS preparation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <h2 className="text-xl font-bold text-blue-700 mb-4">Live Support</h2>
              <p className="text-blue-600 mb-4">Chat with our support team in real-time for immediate assistance.</p>
              <button 
                 onClick={() => navigate('/chat')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                <MessageCircle size={20} />
                Start Live Chat
              </button>
            </div>

            
          </div>

          <div className="border-t border-[#F0E8FF] pt-8">
            <h2 className="text-2xl font-bold mb-4 text-[#333]">Common Questions</h2>
            <div className="space-y-4">
              {[
                "How do I track my progress?",
                "Where can I find practice tests?",
                "How to improve my speaking score?",
                "Technical issues with audio recording"
              ].map((question: string, index: number) => (
                <div key={index} className="p-4 bg-[#F8F9FF] rounded-xl hover:bg-[#F0F2FF] transition-colors">
                  <p className="font-medium text-[#666]">{question}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-700 mb-2">Still Need Help?</h3>
            <p className="text-emerald-600 mb-4">Our team is here to assist you with any questions or issues.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleNavigate('/dashboard')}
                className="px-6 py-2 border border-emerald-500 text-emerald-500 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}