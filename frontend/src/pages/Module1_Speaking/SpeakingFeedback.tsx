import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function SpeakingFeedback() {
  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333]">Speaking Feedback</h1>
          <p className="text-[#777] text-sm">AI-generated evaluation based on your test attempt</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                  6.5
                </div>
                <h3 className="text-lg font-semibold">Predicted Band Score</h3>
                <p className="text-[#777] text-sm">Your current speaking level is Upper Intermediate (B2)</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E8FFF3] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#138A4D] font-semibold">7.0</span>
                  </div>
                  <p className="text-sm text-[#777]">Fluency & Coherence</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FFF7EB] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#C2751C] font-semibold">6.5</span>
                  </div>
                  <p className="text-sm text-[#777]">Grammar Accuracy</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F0F9FF] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#7D3CFF] font-semibold">6.0</span>
                  </div>
                  <p className="text-sm text-[#777]">Vocabulary Range</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F4F0FF] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#7D3CFF] font-semibold">6.5</span>
                  </div>
                  <p className="text-sm text-[#777]">Pronunciation</p>
                </div>
              </div>

              <div className="bg-[#F8F9FF] p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Pronunciation Insights</h4>
                <p className="text-sm text-[#666]">Words mispronounced: "development", "technology"</p>
                <p className="text-sm text-[#666]">Stress issues: "ecoNOmic" instead of "eCONomic"</p>
              </div>

              <div className="flex gap-3">
                <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                  Play Native Reference
                </button>
                <button className="bg-[#F4F0FF] text-[#7D3CFF] px-4 py-2 rounded-lg hover:bg-[#E8DCFF]">
                  View Transcript Alignment
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Improvement Tips</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-[#E8FFF3] p-3 rounded-lg">
                  <p className="font-semibold text-[#138A4D]">✓ Add linking phrases</p>
                  <p className="text-[#666]">Use "on the other hand" to improve coherence</p>
                </div>
                <div className="bg-[#FFF7EB] p-3 rounded-lg">
                  <p className="font-semibold text-[#C2751C]">→ Work on vowel sounds</p>
                  <p className="text-[#666]">Practice /æ/ vs /ɑ:/ sounds</p>
                </div>
                <div className="bg-[#F0F9FF] p-3 rounded-lg">
                  <p className="font-semibold text-[#7D3CFF]">→ Extend answers</p>
                  <p className="text-[#666]">Try to speak for longer in Part 2</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Overall Progress</h3>
              <div className="w-full bg-[#EDE3FF] h-3 rounded-full mb-2">
                <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-[#777] text-center">6/10 areas improved</p>
            </div>

            <div className="flex gap-3">
              <Link to="/speaking/practice">
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
      </div>
    </div>
  );
}