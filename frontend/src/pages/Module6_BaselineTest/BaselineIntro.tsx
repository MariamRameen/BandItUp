import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../services/api';

export default function BaselineIntro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [baselineDone, setBaselineDone] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkBaselineStatus = async () => {
      try {
        const profile = await api.getProfile();
        setBaselineDone(profile.baselineDone || false);
      } catch (error) {
        console.error('Error checking baseline status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkBaselineStatus();
  }, []);

  const handleCompleteBaseline = async () => {
    setLoading(true);
    try {
      await api.completeBaseline();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing baseline:', error);
      alert('Failed to complete baseline test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If baseline is already done, show a different view
  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5FF] dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]"></div>
      </div>
    );
  }

  if (baselineDone) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
        <Header />
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-[#F0E8FF] dark:border-gray-700 shadow-sm text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-semibold mb-4 dark:text-white">Baseline Test Completed!</h1>
            <p className="text-lg text-[#777] dark:text-gray-400 mb-8">
              You've already completed your baseline test. You now have full access to all features.
            </p>
            <Link to="/dashboard">
              <button className="bg-[#7D3CFF] text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-[#6B2FE6] transform hover:scale-105 transition-transform">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const testModules = [
    {
      name: "Listening",
      questions: "40 questions",
      icon: "👂"
    },
    {
      name: "Reading", 
      questions: "40 questions",
      icon: "📖"
    },
    {
      name: "Writing",
      tasks: "Task 1 & 2",
      icon: "✍️"
    },
    {
      name: "Speaking",
      format: "AI Interview simulation",
      icon: "🎤"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm text-center">
          <h1 className="text-3xl font-semibold mb-4">Welcome to BandItUp!</h1>
          <p className="text-lg text-[#777] mb-8">
            Let's see where you stand and kickstart your IELTS journey.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {testModules.map((module, index) => (
              <div key={index} className="bg-[#F8F9FF] p-4 rounded-lg">
                <div className="text-2xl mb-2">{module.icon}</div>
                <h3 className="font-semibold mb-1">{module.name}</h3>
                <p className="text-sm text-[#777]">
                  {module.questions || module.tasks || module.format}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[#F0F9FF] p-6 rounded-lg border border-[#E1F5FE] mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-sm mt-0.5">
                ⏱
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-[#7D3CFF] mb-1">Test Duration</h4>
                <p className="text-sm text-[#666]">
                  Approximately 2 hours 45 minutes total
                </p>
                <p className="text-xs text-[#777] mt-1">
                  Note: This test cannot be paused once started.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[#666] dark:text-gray-400 mb-8">
            Don't worry — this is just to understand your current level. 
            You'll get a full report and study plan after!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/baseline-test/start">
              <button className="bg-[#7D3CFF] text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-[#6B2FE6] transform hover:scale-105 transition-transform">
                Start My Baseline Test
              </button>
            </Link>
            
            {/* Dummy button to skip baseline for testing */}
            <button
              onClick={handleCompleteBaseline}
              disabled={loading}
              className="bg-gray-500 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-gray-600 transform hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completing...' : 'Skip (Demo Only)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}