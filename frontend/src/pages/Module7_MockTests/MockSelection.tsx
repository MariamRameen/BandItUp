import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

type Scores = {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
};

type MockTest = {
  id: number;
  name: string;
  status: 'completed' | 'scheduled' | 'upcoming';
  date: string;
  scores?: Scores;
};

export default function MockSelection() {
  const mockTests: MockTest[] = [
    {
      id: 1,
      name: 'Weekly Mock Test 1',
      status: 'completed',
      date: '2024-09-22',
      scores: {
        listening: 7.0,
        reading: 6.5,
        writing: 6.5,
        speaking: 7.0,
        overall: 6.8,
      },
    },
    {
      id: 2,
      name: 'Weekly Mock Test 2',
      status: 'completed',
      date: '2024-09-29',
      scores: {
        listening: 7.5,
        reading: 6.5,
        writing: 7.0,
        speaking: 7.0,
        overall: 7.0,
      },
    },
    {
      id: 3,
      name: 'Weekly Mock Test 3',
      status: 'scheduled',
      date: '2024-10-06',
    },
    {
      id: 4,
      name: 'Weekly Mock Test 4',
      status: 'upcoming',
      date: '2024-10-13',
    },
    {
      id: 5,
      name: 'Weekly Mock Test 5',
      status: 'upcoming',
      date: '2024-10-20',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />

      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Mock Tests Generator</h1>
          <p className="text-[#777] text-sm">
            Track your progress with weekly mock tests and adaptive learning
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Overall Progress</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">2 of 5 Tests</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Baseline Score</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">6.5</p>
            <p className="text-sm text-[#777]">Taken on: 12 Sep 2024</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Current Score</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">6.8</p>
            <p className="text-sm text-[#777]">+0.3 since baseline</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Target Score</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">7.5</p>
            <p className="text-sm text-[#777]">0.7 to go</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-6">Weekly Mock Tests</h2>

          <div className="space-y-4">
            {mockTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-4 border border-[#F0E8FF] rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{test.name}</h3>
                  <p className="text-sm text-[#777]">Scheduled for {test.date}</p>

                  {test.status === 'completed' && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-[#777]">Listening: </span>
                        <span className="font-semibold">{test.scores?.listening}</span>
                      </div>
                      <div>
                        <span className="text-[#777]">Reading: </span>
                        <span className="font-semibold">{test.scores?.reading}</span>
                      </div>
                      <div>
                        <span className="text-[#777]">Writing: </span>
                        <span className="font-semibold">{test.scores?.writing}</span>
                      </div>
                      <div>
                        <span className="text-[#777]">Speaking: </span>
                        <span className="font-semibold">{test.scores?.speaking}</span>
                      </div>
                      <div className="ml-auto">
                        <span className="text-[#777]">Overall: </span>
                        <span className="font-semibold text-[#7D3CFF]">{test.scores?.overall}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {test.status === 'completed' && (
                    <Link to={`/mock-tests/result/${test.id}`}>
                      <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                        View Results
                      </button>
                    </Link>
                  )}
                  {test.status === 'scheduled' && (
                    <Link to="/mock-tests/start">
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        Start Test
                      </button>
                    </Link>
                  )}
                  {test.status === 'upcoming' && (
                    <button className="bg-[#F4F0FF] text-[#7D3CFF] px-4 py-2 rounded-lg" disabled>
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F0F9FF] rounded-2xl p-6 border border-[#E1F5FE]">
          <h3 className="font-semibold text-[#7D3CFF] mb-3">Adaptive Learning</h3>
          <p className="text-[#666] text-sm">
            After each test, your personalized study plan is automatically updated to focus on your weak areas. 
            Future tests will adapt to target skills that need improvement.
          </p>
        </div>
      </div>
    </div>
  );
}
