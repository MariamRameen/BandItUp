import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { TrendingUp, Target, Calendar, Play, Eye, Plus, BarChart2 } from 'lucide-react';

const API_URL = "http://localhost:4000/api/mock-tests";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } });

interface MockTest {
  _id: string;
  testNumber: number;
  testType: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'abandoned';
  scheduledFor: string;
  completedAt?: string;
  overallBand?: number;
  skillLabel?: string;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  improvementFromBaseline?: number;
}

interface Stats {
  total: number;
  completed: number;
  baselineBand: number;
  latestBand: number;
  improvement: string;
}

export default function MockSelection() {
  const navigate = useNavigate();
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // Get user target from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const targetBand = user.targetScore || 7.0;

  useEffect(() => {
    loadMockTests();
  }, []);

  const loadMockTests = async () => {
    try {
      const res = await fetch(API_URL, auth());
      const data = await res.json();
      if (data.success) {
        setMockTests(data.mockTests);
        setStats(data.stats);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to load mock tests");
    } finally {
      setLoading(false);
    }
  };

  const startQuickTest = async () => {
    setStarting(true);
    try {
      const res = await fetch(`${API_URL}/quick`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({ testType: "full" }),
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/mock-tests/start?id=${data.mockTest._id}`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to start mock test");
    } finally {
      setStarting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>;
      case "in-progress":
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">In Progress</span>;
      case "scheduled":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Scheduled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />

      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">Mock Tests</h1>
            <p className="text-[#777] text-sm">
              Track your progress with practice tests
            </p>
          </div>
          <button
            onClick={startQuickTest}
            disabled={starting}
            className="flex items-center gap-2 bg-[#7D3CFF] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#6B2FE6] transition-colors disabled:opacity-50"
          >
            {starting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Plus size={20} />
                Start New Test
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
            {error.includes("baseline") && (
              <Link to="/baseline" className="ml-2 underline">Take Baseline Test</Link>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={18} className="text-[#7D3CFF]" />
              <h3 className="font-semibold text-lg">Tests Taken</h3>
            </div>
            <p className="text-3xl font-bold text-[#7D3CFF]">
              {stats?.completed || 0}
            </p>
            <p className="text-sm text-[#777]">Total: {stats?.total || 0}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-[#7D3CFF]" />
              <h3 className="font-semibold text-lg">Baseline Score</h3>
            </div>
            <p className="text-3xl font-bold text-[#7D3CFF]">
              {stats?.baselineBand || "-"}
            </p>
            <p className="text-sm text-[#777]">Starting point</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-green-500" />
              <h3 className="font-semibold text-lg">Latest Score</h3>
            </div>
            <p className="text-3xl font-bold text-[#7D3CFF]">
              {stats?.latestBand || stats?.baselineBand || "-"}
            </p>
            {stats?.improvement && parseFloat(stats.improvement) > 0 && (
              <p className="text-sm text-green-600">+{stats.improvement} improvement</p>
            )}
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-[#7D3CFF]" />
              <h3 className="font-semibold text-lg">Target Score</h3>
            </div>
            <p className="text-3xl font-bold text-[#7D3CFF]">{targetBand}</p>
            <p className="text-sm text-[#777]">
              {((targetBand - (stats?.latestBand || stats?.baselineBand || 0))).toFixed(1)} to go
            </p>
          </div>
        </div>

        {/* Mock Tests List */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Your Mock Tests</h2>

          {mockTests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No mock tests yet</p>
              <button
                onClick={startQuickTest}
                className="bg-[#7D3CFF] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6B2FE6]"
              >
                Take Your First Mock Test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockTests.map((test) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-4 border border-[#F0E8FF] rounded-xl hover:border-[#7D3CFF] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">Mock Test {test.testNumber}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-[#777]">
                      {test.completedAt ? `Completed ${formatDate(test.completedAt)}` : `Scheduled ${formatDate(test.scheduledFor)}`}
                    </p>

                    {test.status === 'completed' && test.overallBand && (
                      <div className="flex gap-6 mt-2 text-sm">
                        <div>
                          <span className="text-[#777]">L: </span>
                          <span className="font-semibold">{test.listening || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[#777]">R: </span>
                          <span className="font-semibold">{test.reading || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[#777]">W: </span>
                          <span className="font-semibold">{test.writing || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[#777]">S: </span>
                          <span className="font-semibold">{test.speaking || "-"}</span>
                        </div>
                        <div className="ml-auto">
                          <span className="text-[#777]">Overall: </span>
                          <span className="font-bold text-[#7D3CFF]">{test.overallBand}</span>
                          {test.improvementFromBaseline !== undefined && test.improvementFromBaseline > 0 && (
                            <span className="text-green-600 ml-2">+{test.improvementFromBaseline}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {test.status === 'completed' && (
                      <Link to={`/mock-tests/result?id=${test._id}`}>
                        <button className="flex items-center gap-2 bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                          <Eye size={16} />
                          Results
                        </button>
                      </Link>
                    )}
                    {test.status === 'scheduled' && (
                      <Link to={`/mock-tests/start?id=${test._id}`}>
                        <button className="flex items-center gap-2 bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                          <Play size={16} />
                          Start
                        </button>
                      </Link>
                    )}
                    {test.status === 'in-progress' && (
                      <Link to={`/mock-tests/start?id=${test._id}`}>
                        <button className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600">
                          <Play size={16} />
                          Continue
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/mock-tests/start?quick=true" className="block">
            <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">Quick Section Test</h3>
              <p className="text-white/80 text-sm">
                Practice a single section: Listening, Reading, Writing, or Speaking
              </p>
            </div>
          </Link>
          <Link to="/study-planner" className="block">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold text-lg mb-2">View Study Plan</h3>
              <p className="text-[#777] text-sm">
                Your weekly practice schedule based on mock test results
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
