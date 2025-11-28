import React from 'react';
import Header from '../../components/Header';

export default function PlannerCalendar() {
  const days = [
    { date: '1', day: 'Mon', tasks: ['Listening Practice', 'Vocabulary Review'], completed: true },
    { date: '2', day: 'Tue', tasks: ['Reading Practice', 'Grammar Exercises'], completed: true },
    { date: '3', day: 'Wed', tasks: ['Writing Task 2', 'Speaking Practice'], completed: false },
    { date: '4', day: 'Thu', tasks: ['Mock Test', 'Review Results'], completed: false },
    { date: '5', day: 'Fri', tasks: ['Weak Area Focus', 'Vocabulary Quiz'], completed: false },
    { date: '6', day: 'Sat', tasks: ['Full Practice Test'], completed: false },
    { date: '7', day: 'Sun', tasks: ['Rest Day', 'Light Review'], completed: false },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Study Calendar</h1>
          <p className="text-[#777] text-sm">View and manage your weekly study schedule</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">This Week's Schedule</h2>
                <div className="flex gap-2">
                  <button className="bg-[#F4F0FF] text-[#7D3CFF] px-4 py-2 rounded-lg hover:bg-[#E8DCFF]">
                    Previous Week
                  </button>
                  <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                    Next Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {days.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className={`p-3 rounded-lg ${
                      day.completed ? 'bg-green-100 border border-green-300' :
                      index === 2 ? 'bg-[#7D3CFF] text-white' :
                      'bg-[#F8F9FF] border border-[#F0E8FF]'
                    }`}>
                      <p className="font-semibold text-[#777]">{day.day}</p>
                      <p className="text-2xl font-bold my-2">{day.date}</p>
                      <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs ${
                        day.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {day.completed ? '✓' : day.tasks.length}
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {day.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="text-xs bg-[#F8F9FF] p-2 rounded">
                          {task}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Weekly Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tasks Completed</span>
                    <span>2/7 days</span>
                  </div>
                  <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                    <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '28%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Study Hours</span>
                    <span>4.5/15 hours</span>
                  </div>
                  <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                    <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Target Progress</span>
                    <span>+0.2 bands</span>
                  </div>
                  <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                    <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Today's Focus</h3>
              <div className="space-y-3">
                <div className="bg-[#E8FFF3] p-3 rounded-lg">
                  <p className="font-semibold text-[#138A4D] text-sm">Writing Practice</p>
                  <p className="text-xs text-[#666]">Task 2 - Opinion Essay (40 mins)</p>
                </div>
                <div className="bg-[#FFF7EB] p-3 rounded-lg">
                  <p className="font-semibold text-[#C2751C] text-sm">Speaking Practice</p>
                  <p className="text-xs text-[#666]">Part 2 - Cue Card (3-4 mins)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}