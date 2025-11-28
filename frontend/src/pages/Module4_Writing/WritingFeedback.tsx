import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function WritingFeedback() {
  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333]">Writing Feedback Report</h1>
          <p className="text-[#777] text-sm">Task 2 - Essay | Comprehensive Analysis & Improvement Suggestions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                  7.0
                </div>
                <h3 className="text-lg font-semibold">Overall Band Score</h3>
                <p className="text-[#777]">Word Count: 283 words</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E8FFF3] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#138A4D] font-semibold">7.0</span>
                  </div>
                  <p className="text-sm text-[#777]">Task Achievement</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FFF7EB] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#C2751C] font-semibold">6.5</span>
                  </div>
                  <p className="text-sm text-[#777]">Coherence</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F0F9FF] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#7D3CFF] font-semibold">7.5</span>
                  </div>
                  <p className="text-sm text-[#777]">Lexical Resource</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F4F0FF] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#7D3CFF] font-semibold">7.0</span>
                  </div>
                  <p className="text-sm text-[#777]">Grammar</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-3">Performance Analysis</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-[#E8FFF3] p-3 rounded-lg">
                    <p className="font-semibold text-[#138A4D]">✓ Strong vocabulary range</p>
                    <p className="text-[#666]">You used advanced academic vocabulary appropriately</p>
                  </div>
                  <div className="bg-[#FFF7EB] p-3 rounded-lg">
                    <p className="font-semibold text-[#C2751C]">→ Improve coherence</p>
                    <p className="text-[#666]">Use more linking words between paragraphs</p>
                  </div>
                  <div className="bg-[#F0F9FF] p-3 rounded-lg">
                    <p className="font-semibold text-[#7D3CFF]">→ Grammar accuracy</p>
                    <p className="text-[#666]">Watch subject-verb agreement in complex sentences</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Vocabulary Enhancement Suggestions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-[#F8F9FF] rounded">
                    <span>"very good" →</span>
                    <span className="text-[#7D3CFF] font-semibold">excellent, outstanding</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-[#F8F9FF] rounded">
                    <span>"important" →</span>
                    <span className="text-[#7D3CFF] font-semibold">significant, crucial</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-[#F8F9FF] rounded">
                    <span>"many" →</span>
                    <span className="text-[#7D3CFF] font-semibold">numerous, considerable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Recommended Practice</h3>
              <div className="space-y-3">
                <div className="bg-[#F8F9FF] p-3 rounded-lg">
                  <p className="font-semibold text-sm mb-1">Cohesive Devices Practice</p>
                  <p className="text-xs text-[#666]">Master transition words and linking phrases</p>
                  <button className="w-full bg-[#7D3CFF] text-white py-1 rounded text-xs mt-2 hover:bg-[#6B2FE6]">
                    Start Exercise
                  </button>
                </div>
                <div className="bg-[#F8F9FF] p-3 rounded-lg">
                  <p className="font-semibold text-sm mb-1">Complex Sentences</p>
                  <p className="text-xs text-[#666]">Build sophisticated sentence structures</p>
                  <button className="w-full bg-[#7D3CFF] text-white py-1 rounded text-xs mt-2 hover:bg-[#6B2FE6]">
                    Start Exercise
                  </button>
                </div>
                <div className="bg-[#F8F9FF] p-3 rounded-lg">
                  <p className="font-semibold text-sm mb-1">Academic Vocabulary</p>
                  <p className="text-xs text-[#666]">Expand your academic word list</p>
                  <button className="w-full bg-[#7D3CFF] text-white py-1 rounded text-xs mt-2 hover:bg-[#6B2FE6]">
                    Start Exercise
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/writing/practice">
                <button className="bg-[#7D3CFF] text-white px-4 py-3 rounded-lg hover:bg-[#6B2FE6]">
                  Practice Again
                </button>
              </Link>
              <Link to="/dashboard">
                <button className="bg-[#F4F0FF] text-[#7D3CFF] px-4 py-3 rounded-lg hover:bg-[#E8DCFF]">
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}