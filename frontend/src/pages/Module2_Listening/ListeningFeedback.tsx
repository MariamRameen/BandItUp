import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function ListeningFeedback() {
  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333]">Listening Practice Feedback</h1>
          <p className="text-[#777] text-sm">Complete analysis of your performance</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              6.5
            </div>
            <h3 className="text-lg font-semibold">Predicted Band Score</h3>
            <p className="text-[#777]">Competent user level (B2)</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#7D3CFF]">80%</p>
              <p className="text-sm text-[#777]">Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7D3CFF]">8</p>
              <p className="text-sm text-[#777]">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7D3CFF]">2</p>
              <p className="text-sm text-[#777]">Incorrect</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7D3CFF]">29:15</p>
              <p className="text-sm text-[#777]">Total Time</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-3">Skills Breakdown</h4>
            <div className="space-y-3">
              {[
                { skill: 'Main Ideas', score: 7.5 },
                { skill: 'Specific Details', score: 6.5 },
                { skill: 'Inference', score: 7.0 },
                { skill: 'Vocabulary in Context', score: 7.5 },
                { skill: 'Accent Recognition', score: 6.5 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-[#EDE3FF] h-2 rounded-full">
                      <div 
                        className="bg-[#7D3CFF] h-full rounded-full" 
                        style={{ width: `${(item.score / 9) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-8">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#F8F9FF] p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-2">AI Feedback Summary</h4>
            <p className="text-sm text-[#666] mb-2">
              ✓ Strong ability at identifying specific details like names and dates. You consistently capture numerical information and proper nouns accurately.
            </p>
            <p className="text-sm text-[#666]">
              → Area to improve: Focus on distinguishing similar-sounding words. This caused 3 incorrect answers in Section 2.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Suggested Practice Drills</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#E8FFF3] p-3 rounded-lg border border-[#C6FDE7]">
                <p className="font-semibold text-[#138A4D] text-sm">Number Recognition</p>
                <p className="text-xs text-[#666]">Practice identifying numbers and dates accurately</p>
              </div>
              <div className="bg-[#FFF7EB] p-3 rounded-lg border border-[#FFE5C2]">
                <p className="font-semibold text-[#C2751C] text-sm">Business Meeting Vocabulary</p>
                <p className="text-xs text-[#666]">Focus on workplace and training terminology</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/listening/practice">
            <button className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]">
              Try Again
            </button>
          </Link>
          <Link to="/dashboard">
            <button className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF]">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}