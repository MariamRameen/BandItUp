import React, { useState } from 'react';
import Header from '../../components/Header';

export default function ReadingPractice() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(3600); 

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">Reading Practice</h1>
            <p className="text-[#777] text-sm">Scientific Article - Passage 1 of 3</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-[#7D3CFF]">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-sm text-[#777]">Time Remaining</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Passage Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
              <h3 className="font-semibold text-lg mb-4">The History of Urban Planning</h3>
              <div className="h-96 overflow-y-auto text-[#333] leading-relaxed">
                <p className="mb-4">
                  Urban planning has evolved significantly over the centuries, from the ancient grid patterns of Mohenjo-Daro to the sophisticated smart cities of today. The discipline encompasses the development and design of land use and the built environment, including air, water, and the infrastructure passing into and out of urban areas.
                </p>
                <p className="mb-4">
                  During the Industrial Revolution, rapid urbanization presented new challenges that required systematic planning approaches. This period saw the emergence of public health concerns, the need for improved transportation networks, and the creation of public parks. Reformers like Ebenezer Howard proposed the 'Garden City' movement, which emphasized self-contained communities surrounded by greenbelts.
                </p>
                <p className="mb-4">
                  The early 20th century witnessed the rise of modernist planning, particularly through architects like Le Corbusier, who advocated for high-rise buildings separated by green spaces and connected by efficient transportation networks. While these ideas influenced urban development globally, they also faced criticism for neglecting social and cultural aspects of city life.
                </p>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Question {currentQuestion} of 10</h3>
                <span className="text-sm text-[#777]">Multiple Choice</span>
              </div>

              <p className="text-[#333] mb-4">
                According to the passage, what was the primary motivation for early urban planning efforts during the Industrial Revolution?
              </p>

              <div className="space-y-3">
                {[
                  "Aesthetic improvement of cities",
                  "Public health concerns and rapid urbanization", 
                  "Military defense strategies",
                  "Religious and ceremonial purposes"
                ].map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 p-3 bg-[#F8F9FF] rounded-lg hover:bg-[#E8DCFF] cursor-pointer">
                    <input type="radio" name="readingQuestion" className="text-[#7D3CFF]" />
                    <span>{option}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button 
                  onClick={() => setCurrentQuestion(Math.max(1, currentQuestion - 1))}
                  disabled={currentQuestion === 1}
                  className="bg-[#F4F0FF] text-[#7D3CFF] px-4 py-2 rounded-lg hover:bg-[#E8DCFF] disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentQuestion(Math.min(10, currentQuestion + 1))}
                  className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]"
                >
                  {currentQuestion === 10 ? 'Submit Answers' : 'Next Question'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Question Navigator</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}