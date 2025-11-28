import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';

export default function WritingPractice() {
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2400); // 40 minutes in seconds
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setWordCount(essay.trim() ? essay.split(/\s+/).length : 0);
    setIsSaved(false);
  }, [essay]);

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

  const handleAutoSave = () => {
    setIsSaved(true);
    // Simulate auto-save
    setTimeout(() => setIsSaved(false), 30000);
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">Writing Practice</h1>
            <p className="text-[#777] text-sm">Task 2 - Essay | Writing in progress...</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isSaved ? 'text-green-600' : 'text-orange-500'}`}>
              {isSaved ? 'Saved' : 'Unsaved'}
            </span>
            <div className="text-right">
              <div className="text-lg font-semibold text-[#7D3CFF]">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-sm text-[#777]">Time Remaining</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Task Question</h3>
                <p className="text-[#333] bg-[#F8F9FF] p-4 rounded-lg">
                  Some people believe that social media has had a positive impact on society, while others think it has been largely negative. Discuss both views and give your own opinion.
                </p>
              </div>

              <div className="mb-4">
                <textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="Start typing your essay here..."
                  className="w-full h-96 p-4 border border-[#E2D9FF] rounded-lg resize-none focus:outline-none focus:border-[#7D3CFF]"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-[#777]">
                  Word Count: <span className="font-semibold">{wordCount}</span> / 250 minimum
                </div>
                <button
                  onClick={handleAutoSave}
                  className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg hover:bg-[#6B2FE6]"
                >
                  Save Draft
                </button>
              </div>
            </div>

            <button className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700">
              Submit Response
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Remember</h3>
              <div className="space-y-3 text-sm text-[#666]">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5"></div>
                  <span>Write at least 250 words</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5"></div>
                  <span>You should spend about 40 minutes on this task</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5"></div>
                  <span>Discuss both viewpoints</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5"></div>
                  <span>Provide your own opinion with examples</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5"></div>
                  <span>Your work is automatically saved every 30 seconds</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Writing Tips</h3>
              <ul className="text-sm text-[#666] space-y-2">
                <li>• Plan your essay structure before writing</li>
                <li>• Use formal academic language</li>
                <li>• Include clear topic sentences</li>
                <li>• Support arguments with examples</li>
                <li>• Leave time for proofreading</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}