import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function BaselineIntro() {
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

          <p className="text-[#666] mb-8">
            Don't worry — this is just to understand your current level. 
            You'll get a full report and study plan after!
          </p>

          <Link to="/baseline-test">
            <button className="bg-[#7D3CFF] text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-[#6B2FE6] transform hover:scale-105 transition-transform">
              Start My Baseline Test
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}