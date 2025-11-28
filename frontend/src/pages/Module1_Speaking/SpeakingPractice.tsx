
import React, { useState } from 'react';
import Header from '../../components/Header';

export default function SpeakingPractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPart, setCurrentPart] = useState(1);

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333]">Speaking Practice - Part {currentPart}</h1>
          <p className="text-[#777] text-sm">Record your response and get AI feedback</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Question</h3>
                <p className="text-[#333] bg-[#F8F9FF] p-4 rounded-lg">
                  Tell me about your hometown. What do you like most about it?
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Tips</h3>
                <ul className="text-[#777] text-sm list-disc list-inside space-y-1">
                  <li>Speak for 1-2 minutes</li>
                  <li>Use descriptive vocabulary</li>
                  <li>Maintain good pronunciation</li>
                </ul>
              </div>

              <div className="text-center">
                {!isRecording ? (
                  <button 
                    onClick={() => setIsRecording(true)}
                    className="bg-[#7D3CFF] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#6B2FE6]"
                  >
                    Tap to Record
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-sm">Recording</span>
                    </div>
                    <button 
                      onClick={() => setIsRecording(false)}
                      className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
                    >
                      Stop Recording
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Speaking Parts</h3>
              <div className="space-y-3">
                {[1, 2, 3].map(part => (
                  <button
                    key={part}
                    onClick={() => setCurrentPart(part)}
                    className={`w-full text-left p-3 rounded-lg ${
                      currentPart === part ? 'bg-[#7D3CFF] text-white' : 'bg-[#F8F9FF] text-[#333]'
                    }`}
                  >
                    Part {part}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Progress</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Questions Completed</span>
                  <span className="font-semibold">3/12</span>
                </div>
                <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                  <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}