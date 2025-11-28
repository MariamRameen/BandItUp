import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';

export default function BaselineTest() {
  const [currentSection, setCurrentSection] = useState('listening');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(9900); // 2 hours 45 minutes in seconds

  const sections = [
    { id: 'listening', name: 'Listening', icon: '👂', completed: true },
    { id: 'reading', name: 'Reading', icon: '📖', completed: false },
    { id: 'writing', name: 'Writing', icon: '✍️', completed: false },
    { id: 'speaking', name: 'Speaking', icon: '🎤', completed: false },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

 const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">Baseline Test</h1>
            <p className="text-[#777] text-sm">Complete all sections to receive your band score</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-[#7D3CFF]">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-[#777]">Time Remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-[#777]">Section Progress</div>
            <div className="text-sm font-semibold text-[#7D3CFF]">25% Complete</div>
          </div>
          <div className="w-full bg-[#EDE3FF] h-3 rounded-full">
            <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              {/* Section Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Listening Section</h2>
                  <p className="text-[#777] text-sm">Section 1 - Conversation</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">Question {currentQuestion} of 40</div>
                  <p className="text-xs text-[#777]">Multiple Choice</p>
                </div>
              </div>

              {/* Audio Player */}
              <div className="bg-[#F8F9FF] p-4 rounded-lg mb-6">
                <div className="flex items-center gap-4">
                  <button className="w-12 h-12 bg-[#7D3CFF] rounded-full flex items-center justify-center text-white hover:bg-[#6B2FE6]">
                    ▶
                  </button>
                  <div className="flex-1">
                    <div className="bg-[#E2D9FF] h-2 rounded-full mb-2"></div>
                    <div className="flex justify-between text-xs text-[#777]">
                      <span>0:00</span>
                      <span>2:30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Select the correct answer:</h3>
                <p className="text-[#333] mb-4">
                  What time does the library open on weekends?
                </p>

                <div className="space-y-3">
                  {[
                    "9:00 AM",
                    "10:00 AM", 
                    "11:00 AM",
                    "12:00 PM"
                  ].map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 p-3 bg-[#F8F9FF] rounded-lg hover:bg-[#E8DCFF] cursor-pointer">
                      <input type="radio" name="question1" className="text-[#7D3CFF]" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-[#F0E8FF]">
                <button 
                  onClick={() => setCurrentQuestion(Math.max(1, currentQuestion - 1))}
                  disabled={currentQuestion === 1}
                  className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-2 rounded-lg hover:bg-[#E8DCFF] disabled:opacity-50"
                >
                  Previous
                </button>
                
                <p className="text-sm text-[#777]">
                  You can review all your answers before submitting this part.
                </p>

                <button 
                  onClick={() => setCurrentQuestion(Math.min(40, currentQuestion + 1))}
                  className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg hover:bg-[#6B2FE6]"
                >
                  {currentQuestion === 40 ? 'Submit Section' : 'Next Question'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Section Navigation */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Test Sections</h3>
              <div className="space-y-3">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${
                      currentSection === section.id ? 'bg-[#7D3CFF] text-white' : 
                      section.completed ? 'bg-[#E8FFF3] text-[#138A4D]' : 'bg-[#F8F9FF] text-[#333]'
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <div>
                      <div className="font-semibold">{section.name}</div>
                      {section.completed && (
                        <div className="text-xs">Completed</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Navigator */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentQuestion(i + 1)}
                    className={`w-8 h-8 rounded text-sm ${
                      currentQuestion === i + 1 ? 'bg-[#7D3CFF] text-white' : 'bg-[#F8F9FF] text-[#333]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Warning */}
            {timeLeft < 300 && (
              <div className="bg-red-100 border border-red-300 p-4 rounded-lg">
                <p className="text-red-800 text-sm font-semibold">
                  ⚠️ Less than 5 minutes remaining!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}