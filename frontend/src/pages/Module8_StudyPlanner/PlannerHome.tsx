
import React from 'react';
import Header from '../../components/Header';

export default function PlannerHome() {
  const weekDays = [
    { day: 'Mon', date: '1', tasks: 3, completed: 3 },
    { day: 'Tue', date: '2', tasks: 3, completed: 2 },
    { day: 'Wed', date: '3', tasks: 3, completed: 1 },
    { day: 'Thu', date: '4', tasks: 3, completed: 0 },
    { day: 'Fri', date: '5', tasks: 3, completed: 0 },
    { day: 'Sat', date: '6', tasks: 3, completed: 0 },
    { day: 'Sun', date: '7', tasks: 3, completed: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Let's reach your Band 7.5 together!</h1>
          <p className="text-[#777] text-sm">This week's plan focuses on improving Reading speed and Listening accuracy</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Current Band</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">6.8</p>
            <div className="w-full bg-[#EDE3FF] h-2 rounded-full mt-2">
              <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '91%' }}></div>
            </div>
            <p className="text-sm text-[#777] mt-1">Progress: 91%</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Target Band</h3>
            <p className="text-3xl font-bold text-[#7D3CFF]">7.5</p>
            <p className="text-sm text-[#777] mt-2">You're 0.7 bands away!</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Band Journey</h3>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="w-3 h-3 bg-[#7D3CFF] rounded-full"></div>
                <p className="text-xs mt-1">Start: 6.0</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-[#7D3CFF] rounded-full"></div>
                <p className="text-xs mt-1">Current: 6.8</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-[#7D3CFF] rounded-full"></div>
                <p className="text-xs mt-1">Goal: 7.5</p>
              </div>
            </div>
            <div className="w-full bg-[#EDE3FF] h-2 rounded-full mt-2">
              <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <h3 className="font-semibold text-lg mb-4">My Study Week</h3>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <p className="font-semibold text-[#777]">{day.day}</p>
                <p className="text-lg font-bold my-2">{day.date}</p>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-white text-sm ${
                  day.completed === day.tasks ? 'bg-green-500' :
                  day.completed > 0 ? 'bg-[#7D3CFF]' : 'bg-gray-300'
                }`}>
                  {day.completed}/{day.tasks}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#E8FFF3] p-6 rounded-2xl border border-[#C6FDE7]">
            <h3 className="font-semibold mb-3">AI Tip</h3>
            <p className="text-sm text-[#138A4D]">
              You're improving faster in Listening! Try more paraphrase drills to boost Reading.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold mb-3">Weekly Progress</h3>
            <p className="text-sm text-[#777] mb-2">You're 60% through this week's goals. Keep up the momentum!</p>
            <div className="flex gap-3">
              <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#6B2FE6]">
                Edit My Plan
              </button>
              <button className="bg-[#F4F0FF] text-[#7D3CFF] px-4 py-2 rounded-lg text-sm hover:bg-[#E8DCFF]">
                View Next Week
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}