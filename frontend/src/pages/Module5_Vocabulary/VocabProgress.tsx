import React from 'react';
import Header from '../../components/Header';

export default function VocabProgress() {
  const wordHistory = [
    { word: "substantial", band: 6, attempts: 5, accuracy: 80, lastReview: "2025-01-10", status: "mastered" },
    { word: "inevitable", band: 6, attempts: 3, accuracy: 67, lastReview: "2025-01-09", status: "learning" },
    { word: "meticulous", band: 7, attempts: 4, accuracy: 50, lastReview: "2025-01-08", status: "difficult" },
    { word: "profound", band: 7, attempts: 2, accuracy: 100, lastReview: "2025-01-07", status: "mastered" },
    { word: "ubiquitous", band: 8, attempts: 5, accuracy: 40, lastReview: "2025-01-06", status: "difficult" },
  ];

  const bands = [
    { level: 4, total: 150, learned: 150 },
    { level: 5, total: 200, learned: 120 },
    { level: 6, total: 250, learned: 85 },
    { level: 7, total: 300, learned: 45 },
    { level: 8, total: 350, learned: 12 },
    { level: 9, total: 400, learned: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Vocabulary Progress</h1>
          <p className="text-[#777] text-sm">Track your vocabulary learning journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-3xl font-bold text-[#7D3CFF]">412</p>
            <p className="text-sm text-[#777]">Total Words Learned</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-3xl font-bold text-[#7D3CFF]">48</p>
            <p className="text-sm text-[#777]">Days Streak</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-3xl font-bold text-[#7D3CFF]">67%</p>
            <p className="text-sm text-[#777]">Average Accuracy</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-3xl font-bold text-[#7D3CFF]">6</p>
            <p className="text-sm text-[#777]">Week Streak</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold mb-4">Vocabulary Growth</h3>
            <div className="h-48 bg-[#F8F9FF] rounded-lg flex items-center justify-center text-[#AAA]">
              Line Chart - Words Learned Over Time
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold mb-4">Quiz Performance</h3>
            <div className="h-48 bg-[#F8F9FF] rounded-lg flex items-center justify-center text-[#AAA]">
              Bar Chart - Accuracy by Week
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold mb-4">Band-wise Completion</h3>
            <div className="space-y-4">
              {bands.map((band) => {
                const percentage = (band.learned / band.total) * 100;
                return (
                  <div key={band.level} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Band {band.level}</span>
                      <span>{band.learned}/{band.total} words ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-[#EDE3FF] h-3 rounded-full">
                      <div 
                        className="bg-[#7D3CFF] h-full rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Word History</h3>
              <div className="flex gap-2">
                <button className="bg-[#F4F0FF] text-[#7D3CFF] px-3 py-1 rounded text-sm hover:bg-[#E8DCFF]">
                  Export CSV
                </button>
                <button className="bg-[#7D3CFF] text-white px-3 py-1 rounded text-sm hover:bg-[#6B2FE6]">
                  Export PDF
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0E8FF]">
                    <th className="text-left py-2">Word</th>
                    <th className="text-left py-2">Band</th>
                    <th className="text-left py-2">Attempts</th>
                    <th className="text-left py-2">Accuracy</th>
                    <th className="text-left py-2">Last Review</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wordHistory.map((word, index) => (
                    <tr key={index} className="border-b border-[#F0E8FF]">
                      <td className="py-3 font-medium">{word.word}</td>
                      <td className="py-3">Band {word.band}</td>
                      <td className="py-3">{word.attempts}</td>
                      <td className="py-3">{word.accuracy}%</td>
                      <td className="py-3">{word.lastReview}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          word.status === 'mastered' ? 'bg-green-100 text-green-800' :
                          word.status === 'learning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {word.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-[#7D3CFF] hover:text-[#6B2FE6] text-sm">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}