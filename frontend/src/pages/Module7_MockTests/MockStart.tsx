import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';

export default function MockStart() {
  const [currentSection, setCurrentSection] = useState('listening');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(9900); // 2 hours 45 minutes in seconds

  const sections = [
    { id: 'listening', name: 'Listening', icon: '👂', completed: false },
    { id: 'reading', name: 'Reading', icon: '📖', completed: false },
    { id: 'writing', name: 'Writing', icon: '✍️', completed: false },
    { id: 'speaking', name: 'Speaking', icon: '🎤', completed: false },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

 const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">Weekly Mock Test 3</h1>
            <p className="text-[#777] text-sm">Complete all exercises to receive your scores</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-[#7D3CFF]">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-[#777]">Time Remaining</p>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-[#777]">Section Progress</div>
            <div className="text-sm font-semibold text-[#7D3CFF]">25% Complete</div>
          </div>
          <div className="flex gap-4 mb-4">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`flex-1 py-3 rounded-lg text-center ${
                  currentSection === section.id ? 'bg-[#7D3CFF] text-white' : 'bg-[#F8F9FF] text-[#333]'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
          <div className="w-full bg-[#EDE3FF] h-3 rounded-full">
            <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              {/* Reading Section Content */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Reading Section</h2>
                  <p className="text-[#777] text-sm">Passage 1 of 3 - Academic Text</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">Question {currentQuestion} of 13</div>
                  <p className="text-xs text-[#777]">Multiple Choice</p>
                </div>
              </div>

              {/* Reading Passage */}
              <div className="bg-[#F8F9FF] p-4 rounded-lg mb-6 max-h-60 overflow-y-auto">
                <h3 className="font-semibold mb-3">Climate Change and Urban Development</h3>
                <p className="text-sm text-[#333] leading-relaxed mb-3">
                  Climate change represents one of the most significant challenges facing humanity in the 21st century. 
                  The primary driver of recent climate change is the emission of greenhouse gases from human activities, 
                  particularly the burning of fossil fuels for energy and transportation. These emissions trap heat in 
                  the Earth's atmosphere, leading to rising global temperatures.
                </p>
                <p className="text-sm text-[#333] leading-relaxed">
                  Scientific data indicates that global temperatures have risen by approximately 1.1°C since pre-industrial 
                  times, with the majority of this warming occurring in the past few decades. This temperature increase has 
                  led to numerous observable effects, including melting ice caps, rising sea levels, and more frequent extreme 
                  weather events.
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Question {currentQuestion}: According to the passage, what is the primary cause of recent climate change?</h3>
                  <div className="space-y-2">
                    {[
                      "Natural weather patterns",
                      "Greenhouse gas emissions from human activities",
                      "Solar radiation variations",
                      "Ocean current changes"
                    ].map((option, index) => (
                      <label key={index} className="flex items-center space-x-3 p-3 bg-[#F8F9FF] rounded-lg hover:bg-[#E8DCFF] cursor-pointer">
                        <input type="radio" name="question1" className="text-[#7D3CFF]" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {currentQuestion >= 2 && (
                  <div>
                    <h3 className="font-semibold mb-3">Question {currentQuestion}: The author suggests that renewable energy is:</h3>
                    <div className="space-y-2">
                      {[
                        "Too expensive for widespread use",
                        "Increasingly viable and cost-effective",
                        "Not effective in reducing emissions",
                        "Only suitable for wealthy countries"
                      ].map((option, index) => (
                        <label key={index} className="flex items-center space-x-3 p-3 bg-[#F8F9FF] rounded-lg hover:bg-[#E8DCFF] cursor-pointer">
                          <input type="radio" name="question2" className="text-[#7D3CFF]" />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-[#F0E8FF]">
                <button 
                  onClick={() => setCurrentQuestion(Math.max(1, currentQuestion - 1))}
                  disabled={currentQuestion === 1}
                  className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-2 rounded-lg hover:bg-[#E8DCFF] disabled:opacity-50"
                >
                  Previous
                </button>
                
                <p className="text-sm text-[#777] text-center">
                  You can review all your answers before submitting this section.
                </p>

                <button 
                  onClick={() => setCurrentQuestion(Math.min(13, currentQuestion + 1))}
                  className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg hover:bg-[#6B2FE6]"
                >
                  {currentQuestion === 13 ? 'Submit Section' : 'Next Question'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Section Progress */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Test Progress</h3>
              <div className="space-y-4">
                {sections.map(section => (
                  <div key={section.id} className="flex items-center justify-between">
                    <span className="text-sm">{section.name}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      currentSection === section.id ? 'bg-[#7D3CFF] text-white' :
                      section.completed ? 'bg-green-500 text-white' : 'bg-[#F8F9FF] text-[#333]'
                    }`}>
                      {currentSection === section.id ? '•' : section.completed ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Navigator */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 13 }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentQuestion(i + 1)}
                    className={`w-8 h-8 rounded text-sm ${
                      currentQuestion === i + 1 ? 'bg-[#7D3CFF] text-white' : 'bg-[#F8F9FF] text-[#333]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Instructions</h3>
              <ul className="text-sm text-[#666] space-y-2">
                <li>• You have 60 minutes for this section</li>
                <li>• Answer all questions</li>
                <li>• You can navigate between questions</li>
                <li>• Review your answers before submitting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}