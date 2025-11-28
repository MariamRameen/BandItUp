
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function ListeningSelection() {
  const practiceOptions = [
    { title: "BBC News Broadcast", duration: "8 min", accent: "UK", difficulty: "Advanced" },
    { title: "Phone Inquiry", duration: "9 min", accent: "AU", difficulty: "Intermediate" },
    { title: "Travel Dialogue", duration: "6 min", accent: "US", difficulty: "Beginner" },
    { title: "Daily Conversation", duration: "5 min", accent: "US", difficulty: "Beginner" },
    { title: "Academic Lecture", duration: "12 min", accent: "UK", difficulty: "Advanced" },
    { title: "Job Interview", duration: "7 min", accent: "AU", difficulty: "Intermediate" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Listening Practice</h1>
          <p className="text-[#777] text-sm">Improve your listening skills with various accents and topics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {practiceOptions.map((option, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-[#F0E8FF] shadow-sm">
                  <h3 className="font-semibold mb-2">{option.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#777] mb-3">
                    <span>{option.duration}</span>
                    <span>•</span>
                    <span>{option.accent} accent</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      option.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      option.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {option.difficulty}
                    </span>
                    <Link to="/listening/practice">
                      <button className="bg-[#7D3CFF] text-white px-3 py-1 rounded text-sm hover:bg-[#6B2FE6]">
                        Start
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Progress Overview</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#777]">Average Band</p>
                  <p className="text-2xl font-bold text-[#7D3CFF]">6.8</p>
                </div>
                <div>
                  <p className="text-sm text-[#777]">Accuracy</p>
                  <p className="text-xl font-semibold text-[#7D3CFF]">84%</p>
                </div>
                <div>
                  <p className="text-sm text-[#777] mb-2">Accent Progress</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>British</span>
                      <span>80%</span>
                    </div>
                    <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                      <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}