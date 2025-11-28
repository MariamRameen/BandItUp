import React, { useState } from 'react';
import Header from '../../components/Header';

export default function ListeningPractice() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333]">Listening Practice</h1>
          <p className="text-[#777] text-sm">BBC News Broadcast - UK Accent</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold text-lg">Audio Player</h3>
                  <p className="text-[#777] text-sm">Time remaining: 6:45</p>
                </div>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
                >
                  {isPlaying ? 'Pause' : 'Play Audio'}
                </button>
              </div>

              <div className="bg-[#F8F9FF] p-4 rounded-lg mb-6">
                <div className="h-4 bg-[#E2D9FF] rounded-full"></div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Question {currentQuestion} of 10</h4>
                <p className="text-[#333]">What is the main topic of this news report?</p>
                
                <div className="space-y-3">
                  {[
                    "Climate change policies",
                    "Economic growth statistics", 
                    "Technology innovations",
                    "Healthcare improvements"
                  ].map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 p-3 bg-[#F8F9FF] rounded-lg hover:bg-[#E8DCFF] cursor-pointer">
                      <input type="radio" name="question1" className="text-[#7D3CFF]" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentQuestion(Math.max(1, currentQuestion - 1))}
                disabled={currentQuestion === 1}
                className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF] disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentQuestion(Math.min(10, currentQuestion + 1))}
                className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
              >
                {currentQuestion === 10 ? 'Finish' : 'Next Question'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentQuestion(i + 1)}
                    className={`w-10 h-10 rounded-lg ${
                      currentQuestion === i + 1 ? 'bg-[#7D3CFF] text-white' : 'bg-[#F8F9FF] text-[#333]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Progress</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Questions Answered</span>
                  <span className="font-semibold">3/10</span>
                </div>
                <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                  <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Transcript</h3>
              <button className="w-full bg-[#F4F0FF] text-[#7D3CFF] py-2 rounded-lg hover:bg-[#E8DCFF]">
                Show Transcript
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}