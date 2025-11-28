import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../../services/api';
import ThemeToggle from '../../components/ThemeToggle';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const trajectoryData = [
    { week: 'Week 1', score: 6.5 },
    { week: 'Week 2', score: 6.7 },
    { week: 'Week 3', score: 6.8 },
    { week: 'Week 4', score: 7.0 },
    { week: 'Week 5', score: 7.1 },
    { week: 'Week 6', score: 7.2 }
  ];

  const performanceData = [
    { skill: 'Listening', baseline: 6.5, current: 7.5 },
    { skill: 'Reading', baseline: 6.0, current: 7.0 },
    { skill: 'Writing', baseline: 6.5, current: 7.0 },
    { skill: 'Speaking', baseline: 7.0, current: 7.5 }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF] text-[#333]">
      
      <header className="w-full bg-white shadow-sm py-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-10 h-10 rounded-lg bg-[#7D3CFF] flex items-center justify-center text-white font-bold text-lg">
            B
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-[#666]">
            <Link to="/dashboard" className="hover:text-[#7D3CFF]">Dashboard</Link>
            <Link to="/mock-tests" className="hover:text-[#7D3CFF]">Mock Tests</Link>
            <Link to="/listening" className="hover:text-[#7D3CFF]">Listening</Link>
            <Link to="/reading" className="hover:text-[#7D3CFF]">Reading</Link>
            <Link to="/writing" className="hover:text-[#7D3CFF]">Writing</Link>
            <Link to="/speaking" className="hover:text-[#7D3CFF]">Speaking</Link>
            <Link to="/vocabulary" className="hover:text-[#7D3CFF]">Vocabulary</Link>
           <Link to="/study-planner" className="hover:text-[#7D3CFF]">Study Planner</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/mock-tests/start">
            <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg shadow-md text-sm hover:bg-[#6B2FE6]">
              Take Mock Test
            </button>
          </Link>
          <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="text-[#666] hover:text-[#7D3CFF] text-sm font-medium"
        >
          Logout
        </button>
          <Link to="/profile">
            <div className="w-10 h-10 rounded-full bg-[#7D3CFF] text-white flex items-center justify-center font-semibold">
            {JSON.parse(localStorage.getItem('user') || '{"displayName":"User"}').displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          </Link>
        </div>
      </header>

      <section className="px-8 py-6">
        <h2 className="text-2xl font-semibold">Welcome back, {JSON.parse(localStorage.getItem('user') || '{"displayName":"User"}').displayName || 'User'}!</h2>
        <p className="text-[#777] text-sm">Here's your IELTS preparation program</p>
      </section>

      <section className="px-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "Overall Band", score: "7.2", prev: "6.5" },
          { label: "Listening", score: "7.5", prev: "6.5" },
          { label: "Reading", score: "7.0", prev: "6.0" },
          { label: "Writing", score: "7.0", prev: "6.5" },
          { label: "Speaking", score: "7.5", prev: "7.0" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm px-4 py-5 border border-[#F0E8FF]">
            <p className="text-sm font-medium text-[#777]">{item.label}</p>
            <p className="text-3xl font-bold text-[#7D3CFF]">{item.score}</p>
            <p className="text-xs text-[#999]">From {item.prev}</p>
          </div>
        ))}
      </section>

      <section className="px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#F0E8FF]">
            <h3 className="font-semibold text-lg mb-2">Goal Progress</h3>
            <p className="text-sm text-[#777] mb-4">Track your journey to your target score</p>

            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-[#F8F9FF] p-4 rounded-lg">
                <p className="text-2xl font-bold text-[#7D3CFF]">7.2</p>
                <p className="text-xs text-[#777]">Current Score</p>
              </div>
              <div className="bg-[#F8F9FF] p-4 rounded-lg">
                <p className="text-xl font-semibold text-[#7D3CFF]">0.8 pts</p>
                <p className="text-xs text-[#777]">Gap to Target</p>
              </div>
              <div className="bg-[#F8F9FF] p-4 rounded-lg">
                <p className="text-2xl font-bold text-[#7D3CFF]">8</p>
                <p className="text-xs text-[#777]">Target Score</p>
              </div>
            </div>

            <div className="w-full bg-[#EDE3FF] h-3 rounded-full mb-4">
              <div className="bg-[#7D3CFF] h-full rounded-full" style={{ width: "60%" }}></div>
            </div>

            <p className="text-sm text-[#777] text-center mb-4">Progress to Goal</p>

            <div className="bg-[#F0F9FF] p-4 rounded-lg border border-[#E1F5FE]">
              <h4 className="font-semibold text-[#7D3CFF] mb-2">Goal Actions</h4>
              <p className="text-sm text-[#666]">Continue your preparation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#F0E8FF]">
              <h3 className="font-semibold mb-4">Weekly Mock Test</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                  onClick={() => handleNavigate('/listening/practice')}
                  className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF] text-sm font-medium"
                >
                  Listening
                </button>
                <button 
                  onClick={() => handleNavigate('/reading/practice')}
                  className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF] text-sm font-medium"
                >
                  Reading
                </button>
                <button 
                  onClick={() => handleNavigate('/writing/practice')}
                  className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF] text-sm font-medium"
                >
                  Writing
                </button>
                <button 
                  onClick={() => handleNavigate('/speaking/practice')}
                  className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF] text-sm font-medium"
                >
                  Speaking
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#F0E8FF]">
              <h3 className="font-semibold mb-4">Weekly Add for:</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleNavigate('/vocabulary')}
                  className="w-full text-left py-2 px-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF] text-sm"
                >
                  Vocabulary Builder
                </button>
                <button 
                  onClick={() => handleNavigate('/plannerHome')}
                  className="w-full text-left py-2 px-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF] text-sm"
                >
                  Study Panner
                </button>
                <button 
                  onClick={() => handleNavigate('/writing/practice')}
                  className="w-full text-left py-2 px-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF] text-sm"
                >
                  Writing Practice
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#F0E8FF]">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <Link to="/mock-tests/start">
              <button className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg mb-4 hover:bg-[#6B2FE6] font-medium">
                Weekly Mock Test
              </button>
            </Link>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <button 
                onClick={() => handleNavigate('/listening')}
                className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF]"
              >
                Listening
              </button>
              <button 
                onClick={() => handleNavigate('/reading')}
                className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF]"
              >
                Reading
              </button>
              <button 
                onClick={() => handleNavigate('/writing')}
                className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF]"
              >
                Writing
              </button>
              <button 
                onClick={() => handleNavigate('/speaking')}
                className="py-3 rounded-lg bg-[#F4F0FF] border border-[#E2D9FF] hover:bg-[#E8DCFF]"
              >
                Speaking
              </button>
            </div>
          </div>

          <div className="bg-[#E8FFF3] p-6 rounded-2xl border border-[#C6FDE7]">
            <h3 className="font-semibold mb-3">Top Strengths</h3>
            <div className="space-y-2 text-sm">
              <p>✓ Listening – Main Idea</p>
              <p>✓ Speaking – Fluency</p>
              <p>✓ Writing – Vocabulary Range</p>
            </div>
          </div>

          <div className="bg-[#FFF7EB] p-6 rounded-2xl border border-[#FFE5C2]">
            <h3 className="font-semibold mb-3">Areas to Improve</h3>
            <div className="space-y-2 text-sm">
              <p>→ Reading – Inference</p>
              <p>→ Writing – Coherence</p>
              <p>→ Grammar – Complex Sentences</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
          <h3 className="font-semibold mb-4">Overall Band Trajectory</h3>
          <p className="text-sm text-[#777] mb-4">Your progress over the last 6 weeks</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[6, 8]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#7D3CFF" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
          <h3 className="font-semibold mb-4">Section Performance</h3>
          <p className="text-sm text-[#777] mb-4">Baseline vs current scores</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" />
                <YAxis domain={[0, 9]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#E2D9FF" name="Baseline" />
                <Bar dataKey="current" fill="#7D3CFF" name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="px-8 mt-8">
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
          <h3 className="font-semibold mb-4">Recommended Practice</h3>
          <p className="text-sm text-[#777] mb-6">Personalized modules based on your performance</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                title: "Reading Inference Practice", 
                desc: "Focus on understanding implied meanings in passages",
                button: "Start Now",
                path: "/reading/practice"
              },
              { 
                title: "Writing Coherence Drills", 
                desc: "Master cohesive devices and logical flow",
                button: "Practice",
                path: "/writing/practice"
              },
              { 
                title: "Complex Sentence Structures", 
                desc: "Develop skills for advanced sentence patterns",
                button: "Learn",
                path: "/grammar"
              }
            ].map((module, i) => (
              <div key={i} className="bg-[#F8F9FF] p-4 rounded-lg border border-[#E2D9FF]">
                <h4 className="font-semibold text-[#7D3CFF] mb-2">{module.title}</h4>
                <p className="text-sm text-[#666] mb-3">{module.desc}</p>
                <button 
                  onClick={() => handleNavigate(module.path)}
                  className="w-full bg-[#7D3CFF] text-white py-2 rounded-lg text-sm hover:bg-[#6B2FE6]"
                >
                  {module.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}