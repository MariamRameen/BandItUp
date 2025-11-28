
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function SpeakingSelection() {
  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Speaking Practice</h1>
          <p className="text-[#777] text-sm">Choose your practice mode and improve your speaking skills</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Last Band Score</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">6.5</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Sessions Completed</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">12</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Average Fluency</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">78%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-3">IELTS Structured Practice</h3>
            <p className="text-[#777] text-sm mb-4">Practice with official IELTS speaking test format including Part 1, 2, and 3</p>
            <Link to="/speaking/practice">
              <button className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg hover:bg-[#6B2FE6]">
                Start Practice
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-3">Free Speaking Mode</h3>
            <p className="text-[#777] text-sm mb-4">Practice speaking on various topics with AI feedback and pronunciation analysis</p>
            <Link to="/speaking/free-practice">
              <button className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg hover:bg-[#6B2FE6]">
                Start Practice
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}