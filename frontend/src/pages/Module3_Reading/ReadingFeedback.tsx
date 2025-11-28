import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function ReadingFeedback() {
  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333]">Reading Test Results</h1>
          <p className="text-[#777] text-sm">Review your performance and detailed feedback</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              7.0
            </div>
            <h3 className="text-lg font-semibold">Predicted Band Score</h3>
            <p className="text-[#777]">Good user level with room for improvement</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
            <div>
              <p className="text-xl font-bold text-[#7D3CFF]">75%</p>
              <p className="text-sm text-[#777]">Accuracy</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#7D3CFF]">30/40</p>
              <p className="text-sm text-[#777]">Correct</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#7D3CFF]">52:30</p>
              <p className="text-sm text-[#777]">Time Taken</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#7D3CFF]">Advanced</p>
              <p className="text-sm text-[#777]">Difficulty</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-3">Performance Summary</h4>
            <p className="text-sm text-[#666]">
              You demonstrated strong comprehension of main ideas but struggled with inference questions. 
              Your reading speed is good, but you could benefit from more practice with complex sentence structures.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Recommended Micro-Drills</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#E8FFF3] p-4 rounded-lg border border-[#C6FDE7]">
                <p className="font-semibold text-[#138A4D] text-sm mb-2">Find Evidence Fast</p>
                <p className="text-xs text-[#666] mb-3">Practice locating specific information quickly in passages</p>
                <button className="w-full bg-[#138A4D] text-white py-2 rounded text-xs hover:bg-[#0D6B3A]">
                  Start Drill
                </button>
              </div>
              <div className="bg-[#FFF7EB] p-4 rounded-lg border border-[#FFE5C2]">
                <p className="font-semibold text-[#C2751C] text-sm mb-2">Inference Mastery</p>
                <p className="text-xs text-[#666] mb-3">Develop skills for understanding implied meanings</p>
                <button className="w-full bg-[#C2751C] text-white py-2 rounded text-xs hover:bg-[#9D5E16]">
                  Start Drill
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/reading/practice">
            <button className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]">
              Practice Again
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