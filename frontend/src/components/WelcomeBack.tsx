import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, TrendingUp, Clock, Book } from 'lucide-react';

const API_URL = "http://localhost:4000/api/notifications";
const auth = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  },
});

interface InactivityData {
  isInactive: boolean;
  daysInactive: number;
  message: {
    title: string;
    message: string;
    icon: string;
  } | null;
}

export default function WelcomeBack() {
  const navigate = useNavigate();
  const [inactivity, setInactivity] = useState<InactivityData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkInactivity();
  }, []);

  const checkInactivity = async () => {
    // Check if already dismissed this session
    const sessionDismissed = sessionStorage.getItem('welcomeBackDismissed');
    if (sessionDismissed) return;
    
    try {
      const res = await fetch(`${API_URL}/inactivity`, auth());
      const data = await res.json();
      
      if (data.success && data.isInactive && data.message) {
        setInactivity(data);
        setIsVisible(true);
      }
    } catch (err) {
      console.error("Failed to check inactivity:", err);
    }
  };

  const handleDismiss = async () => {
    setIsVisible(false);
    setDismissed(true);
    sessionStorage.setItem('welcomeBackDismissed', 'true');
    
    try {
      await fetch(`${API_URL}/returned`, {
        method: "POST",
        ...auth(),
      });
    } catch (err) {
      console.error("Failed to mark as returned:", err);
    }
  };

  const handleStartStudying = () => {
    handleDismiss();
    navigate('/study-planner');
  };

  const handleTakeQuickTask = () => {
    handleDismiss();
    navigate('/vocabulary'); // Quick task = vocabulary practice
  };

  if (!isVisible || !inactivity || !inactivity.message || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] p-6 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <span className="text-5xl mb-4 block">{inactivity.message.icon}</span>
            <h2 className="text-2xl font-bold">{inactivity.message.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#666] text-center mb-6">
            {inactivity.message.message}
          </p>

          {/* Inactivity Stats */}
          <div className="bg-[#F8F6FF] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <Clock className="mx-auto mb-1 text-[#7D3CFF]" size={24} />
                <p className="text-2xl font-bold text-[#7D3CFF]">{inactivity.daysInactive}</p>
                <p className="text-xs text-[#777]">Days away</p>
              </div>
              <div className="h-12 w-px bg-[#E0E0E0]" />
              <div className="text-center">
                <Sparkles className="mx-auto mb-1 text-amber-500" size={24} />
                <p className="text-sm text-[#666]">Your goals<br />are waiting!</p>
              </div>
            </div>
          </div>

          {/* Quick Start Suggestions */}
          <div className="space-y-3 mb-6">
            <p className="text-sm text-[#777] text-center">Get back on track with:</p>
            
            <button
              onClick={handleTakeQuickTask}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E0E0E0] hover:border-[#7D3CFF] hover:bg-[#F8F6FF] transition-colors"
            >
              <Book className="w-5 h-5 text-[#7D3CFF]" />
              <div className="text-left flex-1">
                <p className="font-medium">Quick Vocabulary Practice</p>
                <p className="text-xs text-[#777]">5 minutes • Easy start</p>
              </div>
              <TrendingUp size={16} className="text-[#7D3CFF]" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 px-4 rounded-xl border border-[#E0E0E0] text-[#666] hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleStartStudying}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white font-semibold hover:from-[#6B2FE6] hover:to-[#5A20E0] transition-colors"
            >
              Let's Go!
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
