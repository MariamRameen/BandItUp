import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function ReadingSelection() {
  const readingTypes = [
    {
      title: "Scientific Article",
      description: "Academic texts with complex vocabulary and concepts",
      duration: "20 min",
      passages: 3,
      difficulty: "Advanced"
    },
    {
      title: "Narrative Passage", 
      description: "Story-based texts focusing on comprehension",
      duration: "15 min",
      passages: 2,
      difficulty: "Intermediate"
    },
    {
      title: "Analytical Report",
      description: "Data-driven texts requiring critical analysis",
      duration: "25 min", 
      passages: 3,
      difficulty: "Advanced"
    },
    {
      title: "Random IELTS Passage",
      description: "Mixed passage types from actual IELTS exams",
      duration: "20 min",
      passages: 3,
      difficulty: "Mixed"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Reading Practice</h1>
          <p className="text-[#777] text-sm">Improve your reading comprehension with various passage types</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {readingTypes.map((type, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">{type.title}</h3>
                  <p className="text-[#777] text-sm mb-4">{type.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-[#666] mb-4">
                    <span>{type.duration}</span>
                    <span>•</span>
                    <span>{type.passages} passages</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded ${
                      type.difficulty === 'Advanced' ? 'bg-red-100 text-red-800' :
                      type.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {type.difficulty}
                    </span>
                  </div>
                  
                  <Link to="/reading/practice">
                    <button className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg hover:bg-[#6B2FE6]">
                      Start Practice
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Reading Progress</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#777]">Current Band</p>
                  <p className="text-2xl font-bold text-[#7D3CFF]">7.0</p>
                  <p className="text-xs text-[#777]">CEFR Level: B2</p>
                </div>
                <div>
                  <p className="text-sm text-[#777] mb-2">Weekly Progress</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Tests Completed</span>
                      <span className="font-semibold">5</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Time Practiced</span>
                      <span className="font-semibold">2h 30m</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Band Improvement</span>
                      <span className="font-semibold text-green-600">+0.5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Quick Tips</h3>
              <ul className="text-sm text-[#666] space-y-2">
                <li>• Skim the passage first</li>
                <li>• Look for keywords in questions</li>
                <li>• Manage your time effectively</li>
                <li>• Practice different question types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}