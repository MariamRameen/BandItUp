import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MockResult() {
  const sectionScores = [
    { skill: 'Listening', baseline: 6.5, current: 7.0 },
    { skill: 'Reading', baseline: 6.0, current: 6.5 },
    { skill: 'Writing', baseline: 5.5, current: 6.0 },
    { skill: 'Speaking', baseline: 6.5, current: 7.0 },
  ];

  const progressData = [
    { week: 'Baseline', listening: 6.5, reading: 6.0, writing: 5.5, speaking: 6.5, overall: 6.1 },
    { week: 'Week 1', listening: 6.5, reading: 6.0, writing: 5.5, speaking: 6.5, overall: 6.1 },
    { week: 'Week 2', listening: 6.8, reading: 6.2, writing: 5.8, speaking: 6.7, overall: 6.4 },
    { week: 'Week 3', listening: 7.0, reading: 6.5, writing: 6.0, speaking: 7.0, overall: 6.6 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Mock Test Results</h1>
          <p className="text-[#777] text-sm">Weekly Mock Test 3 | Your predicted band scores from AI evaluation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <div className="w-24 h-24 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              6.6
            </div>
            <h3 className="text-lg font-semibold mb-2">Current Overall Band</h3>
            <p className="text-[#777] text-sm mb-4">Steady progress with room for improvement</p>
            <div className="flex justify-center gap-4 text-sm">
              <div>
                <span className="text-[#777]">Baseline: </span>
                <span className="font-semibold">6.1</span>
              </div>
              <div>
                <span className="text-green-600">+0.5</span>
              </div>
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Criteria Breakdown</h3>
            <div className="space-y-4">
              {sectionScores.map((section, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{section.skill}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#777]">Baseline: {section.baseline}</span>
                    <div className="w-20 bg-[#EDE3FF] h-2 rounded-full">
                      <div 
                        className="bg-[#7D3CFF] h-full rounded-full" 
                        style={{ width: `${(section.current / 9) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-[#7D3CFF] w-8">{section.current}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Next Steps</h3>
            <div className="space-y-3">
              <button className="w-full bg-[#7D3CFF] text-white py-2 rounded-lg text-sm hover:bg-[#6B2FE6]">
                Analyze Task Vocabulary
              </button>
              <button className="w-full bg-[#F4F0FF] text-[#7D3CFF] py-2 rounded-lg text-sm hover:bg-[#E8DCFF]">
                View Detailed Feedback
              </button>
              <button className="w-full bg-[#F4F0FF] text-[#7D3CFF] py-2 rounded-lg text-sm hover:bg-[#E8DCFF]">
                Recommended Practice
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progress Over Time */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Progress Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[4, 9]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overall" stroke="#7D3CFF" strokeWidth={2} name="Overall" />
                  <Line type="monotone" dataKey="listening" stroke="#8884d8" name="Listening" />
                  <Line type="monotone" dataKey="reading" stroke="#82ca9d" name="Reading" />
                  <Line type="monotone" dataKey="writing" stroke="#ffc658" name="Writing" />
                  <Line type="monotone" dataKey="speaking" stroke="#ff7300" name="Speaking" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Baseline vs Current */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Baseline vs Current Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectionScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" />
                  <YAxis domain={[4, 9]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baseline" fill="#E2D9FF" name="Baseline" />
                  <Bar dataKey="current" fill="#7D3CFF" name="Current" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sub-skills Analysis */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Sub-Skills Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Listening - Detail Recognition</span>
                  <span className="font-semibold">7.5</span>
                </div>
                <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                  <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Reading - Inference</span>
                  <span className="font-semibold">6.0</span>
                </div>
                <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                  <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Writing - Coherence</span>
                  <span className="font-semibold">5.5</span>
                </div>
                <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                  <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '61%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Recommendations */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Priority Recommendations</h3>
            <div className="space-y-3">
              <div className="bg-[#FFF7EB] p-3 rounded-lg">
                <p className="font-semibold text-[#C2751C] text-sm">Focus on understanding implied meanings in reading passages</p>
                <p className="text-xs text-[#666]">Practice inference questions with timed exercises</p>
              </div>
              <div className="bg-[#FFF7EB] p-3 rounded-lg">
                <p className="font-semibold text-[#C2751C] text-sm">Practice using cohesive devices in writing</p>
                <p className="text-xs text-[#666]">Work on paragraph transitions and linking words</p>
              </div>
              <div className="bg-[#FFF7EB] p-3 rounded-lg">
                <p className="font-semibold text-[#C2751C] text-sm">Work on complex sentence structures in speaking</p>
                <p className="text-xs text-[#666]">Incorporate subordinate clauses and varied syntax</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-8">
          <Link to="/study-planner">
            <button className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]">
              Update Study Plan
            </button>
          </Link>
          <Link to="/mock-tests">
            <button className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF]">
              Back to Mock Tests
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}