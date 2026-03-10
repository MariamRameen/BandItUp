import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MessageCircle, TrendingUp, Target, Award, Clock, ChevronRight, Home, FileText, Headphones, BookOpen, Edit, Mic, Book, Calendar, LogOut, User, HelpCircle } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import { getUnreadNotifications } from '../../services/reportService';

const API_URL = "http://localhost:4000/api/dashboard";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } });

interface DashboardData {
  currentScores: { overall: number; listening: number; reading: number; writing: number; speaking: number };
  baselineScores: { overall: number; listening: number; reading: number; writing: number; speaking: number };
  improvement: { overall: number; listening: number; reading: number; writing: number; speaking: number };
  targetScore: number;
  progressPercentage: number;
  trajectoryData: { week: string; score: number }[];
  performanceData: { skill: string; baseline: number; current: number }[];
  strengths: string[];
  weaknesses: string[];
  weeklyFocus: string[];
  studyStats: { streak: number; tasksCompletedThisWeek: number; totalMockTests: number };
  lastMockTest?: { _id: string; testNumber: number; completedAt: string; overallBand: number };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadReports, setUnreadReports] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    loadDashboard();
    getUnreadNotifications().then(data => {
      if (data.success) setUnreadReports(data.unread);
    });
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch(API_URL, auth());
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.dashboard);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Fallback data for display
  const trajectoryData = dashboardData?.trajectoryData || [];
  const performanceData = dashboardData?.performanceData || [];

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <Home size={20} /> },
    { path: "/mock-tests", label: "Mock Tests", icon: <FileText size={20} /> },
    { path: "/listening", label: "Listening", icon: <Headphones size={20} /> },
    { path: "/reading", label: "Reading", icon: <BookOpen size={20} /> },
    { path: "/writing", label: "Writing", icon: <Edit size={20} /> },
    { path: "/speaking", label: "Speaking", icon: <Mic size={20} /> },
    { path: "/vocabulary", label: "Vocabulary", icon: <Book size={20} /> },
    { path: "/study-planner", label: "Study Planner", icon: <Calendar size={20} /> },
    { path: "/baseline/results", label: "Baseline Result", icon: <Award size={20} /> },
  ];

  const user = JSON.parse(localStorage.getItem('user') || '{"displayName":"User"}');
  const userInitial = user.displayName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF] text-[#333] flex">

      {/* Sidebar */}
      <div className={`
        bg-white shadow-xl border-r border-[#F0E8FF] transition-all duration-300
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        flex flex-col
      `}>

        <div className="p-6 border-b border-[#F0E8FF]">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7D3CFF] to-[#5A20E0] shadow-lg flex items-center justify-center text-white font-bold text-lg">
                  B
                </div>
                <div>
                  <h2 className="font-bold text-lg">IELTS Prep</h2>
                  <p className="text-xs text-[#777]">Dashboard</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7D3CFF] to-[#5A20E0] shadow-lg flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-[#F4F0FF] text-[#666]"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronRight size={20} className="rotate-180" />}
            </button>
          </div>
        </div>

        <div className={`p-4 ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
          <div className={`
            rounded-xl bg-gradient-to-r from-[#F4F0FF] to-white border border-[#E2D9FF]
            ${sidebarCollapsed ? 'p-2 justify-center' : 'p-3'}
            flex items-center gap-3
          `}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7D3CFF] to-[#6B2FE6] text-white flex items-center justify-center font-semibold shadow-md flex-shrink-0">
              {userInitial}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-[#777] truncate">Student</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                w-full flex items-center rounded-xl text-left hover:bg-[#F4F0FF] hover:text-[#7D3CFF] transition-colors
                ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-3'}
              `}
              title={sidebarCollapsed ? item.label : ''}
            >
              <div className="text-[#7D3CFF] flex-shrink-0">{item.icon}</div>
              {!sidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-[#F0E8FF] space-y-1">
          <button
            onClick={() => handleNavigate('/profile')}
            className={`w-full flex items-center rounded-xl text-left hover:bg-[#F4F0FF] hover:text-[#7D3CFF] transition-colors ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-3'}`}
            title={sidebarCollapsed ? "Profile" : ""}
          >
            <User size={20} className="text-[#7D3CFF]" />
            {!sidebarCollapsed && <span className="font-medium">Profile</span>}
          </button>

          <button
            onClick={() => handleNavigate('/help')}
            className={`w-full flex items-center rounded-xl text-left hover:bg-[#F4F0FF] hover:text-[#7D3CFF] transition-colors ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-3'}`}
            title={sidebarCollapsed ? "Help" : ""}
          >
            <HelpCircle size={20} className="text-[#7D3CFF]" />
            {!sidebarCollapsed && <span className="font-medium">Help & Support</span>}
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className={`w-full flex items-center rounded-xl text-left hover:bg-red-50 hover:text-red-600 transition-colors mt-2 ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-3'}`}
            title={sidebarCollapsed ? "Logout" : ""}
          >
            <LogOut size={20} className="text-red-500" />
            {!sidebarCollapsed && <span className="font-medium text-red-600">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg py-4 px-6 sm:px-8 flex justify-between items-center border-b border-[#E2D9FF]">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {sidebarCollapsed && (
              <div className="md:hidden">
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#7D3CFF] to-[#5A20E0] bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
           
            <button
                onClick={() => { setUnreadReports(0); handleNavigate('/chat'); }}
                className="relative flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-lg shadow-md text-sm hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                <MessageCircle size={18} />
                Live Chat
                {unreadReports > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadReports}
                  </span>
                )}
              </button>

            <Link to="/mock-tests/start">
              <button className="bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white px-4 py-2 rounded-lg shadow-lg text-sm hover:from-[#6B2FE6] hover:to-[#5A20E0] transition-all">
                Take Mock Test
              </button>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="px-8 py-8">
            <div className="bg-gradient-to-r from-white to-[#F8F9FF] rounded-2xl p-6 shadow-sm border border-[#F0E8FF]">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#7D3CFF] to-[#5A20E0] bg-clip-text text-transparent">
                    Welcome back, {user.displayName || 'User'}!
                  </h2>
                  <p className="text-[#777] text-sm mt-2">Here's your personalized IELTS preparation dashboard</p>
                </div>
                {dashboardData && dashboardData.improvement.overall > 0 && (
                  <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                    <TrendingUp size={16} />
                    <span>+{dashboardData.improvement.overall} band improvement!</span>
                  </div>
                )}
                {error && (
                  <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full">
                    <span>{error.includes("baseline") ? "Complete baseline test to get started" : error}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="px-8 grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {dashboardData?.currentScores ? [
              { label: "Overall Band", score: (dashboardData.currentScores.overall ?? 0).toString(), prev: (dashboardData.baselineScores?.overall ?? 0).toString(), improvement: dashboardData.improvement?.overall ?? 0, icon: <Award className="text-[#7D3CFF]" /> },
              { label: "Listening", score: (dashboardData.currentScores.listening ?? 0).toString(), prev: (dashboardData.baselineScores?.listening ?? 0).toString(), improvement: dashboardData.improvement?.listening ?? 0, icon: <TrendingUp className="text-emerald-500" /> },
              { label: "Reading", score: (dashboardData.currentScores.reading ?? 0).toString(), prev: (dashboardData.baselineScores?.reading ?? 0).toString(), improvement: dashboardData.improvement?.reading ?? 0, icon: <TrendingUp className="text-blue-500" /> },
              { label: "Writing", score: (dashboardData.currentScores.writing ?? 0).toString(), prev: (dashboardData.baselineScores?.writing ?? 0).toString(), improvement: dashboardData.improvement?.writing ?? 0, icon: <Clock className="text-amber-500" /> },
              { label: "Speaking", score: (dashboardData.currentScores.speaking ?? 0).toString(), prev: (dashboardData.baselineScores?.speaking ?? 0).toString(), improvement: dashboardData.improvement?.speaking ?? 0, icon: <Target className="text-purple-500" /> },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg px-6 py-5 border border-[#F0E8FF] hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[#777]">{item.label}</p>
                  {item.icon}
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-[#7D3CFF] to-[#5A20E0] bg-clip-text text-transparent">
                  {item.score}
                </p>
                <p className="text-xs text-[#999] mt-1">
                  From {item.prev} 
                  {item.improvement !== undefined && item.improvement > 0 && (
                    <span className="text-emerald-600 ml-1">+{item.improvement} ↑</span>
                  )}
                  {item.improvement !== undefined && item.improvement < 0 && (
                    <span className="text-red-500 ml-1">{item.improvement} ↓</span>
                  )}
                </p>
              </div>
            )) : (
              // Skeleton loading
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg px-6 py-5 border border-[#F0E8FF] animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              ))
            )}
          </section>

          <section className="px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
                <h3 className="font-bold text-xl mb-2">Goal Progress Tracker</h3>
                <p className="text-sm text-[#777] mb-6">Track your journey to your target score of {dashboardData?.targetScore || 7.0}</p>
                <div className="grid grid-cols-3 gap-6 text-center mb-8">
                  <div className="bg-gradient-to-br from-[#F8F9FF] to-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-3xl font-bold text-[#7D3CFF]">{dashboardData?.currentScores.overall || "-"}</p>
                    <p className="text-xs text-[#777] mt-2">Current Score</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F8F9FF] to-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-2xl font-semibold text-emerald-600">
                      {dashboardData?.currentScores?.overall != null ? ((dashboardData.targetScore - dashboardData.currentScores.overall).toFixed(1)) : "-"} pts
                    </p>
                    <p className="text-xs text-[#777] mt-2">Gap to Target</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F8F9FF] to-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-3xl font-bold text-[#5A20E0]">{dashboardData?.targetScore || "-"}</p>
                    <p className="text-xs text-[#777] mt-2">Target Score</p>
                  </div>
                </div>
                <div className="mb-8">
                  <div className="w-full bg-gradient-to-r from-[#EDE3FF] to-[#E2D9FF] h-4 rounded-full mb-3">
                    <div className="bg-gradient-to-r from-[#7D3CFF] to-[#5A20E0] h-full rounded-full transition-all duration-500" style={{ width: `${dashboardData?.progressPercentage || 0}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#777]">0%</span>
                    <span className="font-semibold text-[#7D3CFF]">{dashboardData?.progressPercentage || 0}% Progress</span>
                    <span className="text-[#777]">100%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#F0F9FF] to-[#E1F5FE] p-6 rounded-2xl border border-[#E1F5FE]">
                  <h4 className="font-semibold text-[#7D3CFF] mb-2">Goal Actions</h4>
                  <p className="text-sm text-[#666]">
                    {dashboardData?.weeklyFocus?.[0] || "Complete practice sessions and focus on your weak areas this week"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl">Weekly Mock Test</h3>
                    <ChevronRight className="text-[#7D3CFF]" />
                  </div>
                  
                  {/* Last Mock Test Summary */}
                  {dashboardData?.lastMockTest && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-[#F4F0FF] to-[#F8F9FF] rounded-xl border border-[#E2D9FF]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#666]">Last Test: #{dashboardData.lastMockTest.testNumber}</span>
                        <span className="text-xs text-[#999]">
                          {new Date(dashboardData.lastMockTest.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7D3CFF] to-[#5A20E0] text-white flex items-center justify-center font-bold text-lg">
                          {dashboardData.lastMockTest.overallBand}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Overall Band Score</p>
                          <p className="text-xs text-[#777]">
                            {dashboardData.studyStats?.totalMockTests ?? 0} total tests completed
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleNavigate(`/mock-tests/result?id=${dashboardData.lastMockTest?._id || ''}`)}
                        className="w-full mt-3 text-sm text-[#7D3CFF] font-medium hover:underline"
                      >
                        View Full Results →
                      </button>
                    </div>
                  )}
                  
                  {!dashboardData?.lastMockTest && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                      <p className="text-sm text-amber-700 text-center">
                        No mock tests completed yet. Take your first mock test to track your progress!
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button onClick={() => handleNavigate('/listening/practice')} className="py-4 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] text-sm font-medium transition-all">👂 Listening</button>
                    <button onClick={() => handleNavigate('/reading/practice')} className="py-4 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] text-sm font-medium transition-all">📚 Reading</button>
                    <button onClick={() => handleNavigate('/writing/practice')} className="py-4 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] text-sm font-medium transition-all">✍️ Writing</button>
                    <button onClick={() => handleNavigate('/speaking/practice')} className="py-4 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] text-sm font-medium transition-all">🗣️ Speaking</button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl">Weekly Focus Areas</h3>
                    <ChevronRight className="text-[#7D3CFF]" />
                  </div>
                  <div className="space-y-4">
                    <button onClick={() => handleNavigate('/vocabulary')} className="w-full text-left py-3 px-4 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] text-sm transition-all">📖 Vocabulary Builder</button>
                    <button onClick={() => handleNavigate('/plannerHome')} className="w-full text-left py-3 px-4 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] text-sm transition-all">📅 Study Planner</button>
                    <button onClick={() => handleNavigate('/writing/practice')} className="w-full text-left py-3 px-4 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] text-sm transition-all">✨ Writing Practice</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
                <h3 className="font-bold text-xl mb-6">Quick Actions</h3>
                <Link to="/mock-tests/start">
                  <button className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white py-4 rounded-xl mb-4 hover:from-[#6B2FE6] hover:to-[#5A20E0] font-semibold shadow-lg transition-all">
                    🚀 Weekly Mock Test
                  </button>
                </Link>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <button onClick={() => handleNavigate('/listening')} className="py-3 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] transition-all">👂 Listening</button>
                  <button onClick={() => handleNavigate('/reading')} className="py-3 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] transition-all">📚 Reading</button>
                  <button onClick={() => handleNavigate('/writing')} className="py-3 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] transition-all">✍️ Writing</button>
                  <button onClick={() => handleNavigate('/speaking')} className="py-3 rounded-xl bg-gradient-to-b from-[#F4F0FF] to-white border border-[#E2D9FF] hover:from-[#E8DCFF] hover:to-[#F4F0FF] transition-all">🗣️ Speaking</button>
                </div>
                <button 
                  onClick={() => handleNavigate('/baseline/results')} 
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-md transition-all text-sm"
                >
                  📊 View Baseline Results
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-3xl border border-emerald-100 shadow-lg">
                <h3 className="font-bold text-xl mb-6 text-emerald-800">Top Strengths</h3>
                <div className="space-y-4 text-sm">
                  {(dashboardData?.strengths?.length ? dashboardData.strengths.slice(0, 3) : [
                    "Complete baseline test to see strengths"
                  ]).map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><span className="text-emerald-600">✓</span></div>
                      <div>
                        <p className="font-medium text-emerald-800">{s}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-100 shadow-lg">
                <h3 className="font-bold text-xl mb-6 text-amber-800">Areas to Improve</h3>
                <div className="space-y-4 text-sm">
                  {(dashboardData?.weaknesses?.length ? dashboardData.weaknesses.slice(0, 3) : [
                    "Complete baseline test to see areas to improve"
                  ]).map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><span className="text-amber-600">→</span></div>
                      <div>
                        <p className="font-medium text-amber-800">{s}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="px-8 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
              <h3 className="font-bold text-xl mb-2">Overall Band Trajectory</h3>
              <p className="text-sm text-[#777] mb-6">Your progress over the last 6 weeks</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" stroke="#666" />
                    <YAxis domain={[6, 8]} stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2D9FF', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="url(#gradient)" strokeWidth={3} activeDot={{ r: 8, fill: '#7D3CFF' }} dot={{ r: 4, fill: '#7D3CFF' }} />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7D3CFF" />
                        <stop offset="100%" stopColor="#5A20E0" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
              <h3 className="font-bold text-xl mb-2">Section Performance</h3>
              <p className="text-sm text-[#777] mb-6">Baseline vs current scores</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="skill" stroke="#666" />
                    <YAxis domain={[0, 9]} stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2D9FF', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="baseline" fill="#E2D9FF" name="Baseline" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" fill="url(#barGradient)" name="Current" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7D3CFF" />
                        <stop offset="100%" stopColor="#5A20E0" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="px-8 mt-12 mb-12">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]">
              <h3 className="font-bold text-xl mb-2">🎯 Recommended Practice</h3>
              <p className="text-sm text-[#777] mb-8">Personalized modules based on your performance</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "Reading Inference Practice", desc: "Focus on understanding implied meanings in passages", button: "Start Now", path: "/reading/practice", color: "from-blue-500 to-indigo-600" },
                  { title: "Writing Coherence Drills", desc: "Master cohesive devices and logical flow", button: "Practice", path: "/writing/practice", color: "from-purple-500 to-pink-600" },
                  { title: "Vocabulary Practice", desc: "Develop skills for advanced words", button: "Learn", path: "/vocabulary/quiz", color: "from-emerald-500 to-teal-600" },
                ].map((module, i) => (
                  <div key={i} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-[#E2D9FF] shadow-lg hover:shadow-xl transition-all">
                    <h4 className={`font-bold text-lg mb-3 bg-gradient-to-r ${module.color} bg-clip-text text-transparent`}>{module.title}</h4>
                    <p className="text-sm text-[#666] mb-6">{module.desc}</p>
                    <button onClick={() => handleNavigate(module.path)} className={`w-full bg-gradient-to-r ${module.color} text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all`}>
                      {module.button}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <button
            onClick={() => { setUnreadReports(0); handleNavigate('/chat'); }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all z-50 flex items-center gap-2"
          >
            <MessageCircle size={24} />
            <span className="font-semibold hidden sm:inline">Live Chat</span>
          </button>

        </div>
      </div>
    </div>
  );
}
