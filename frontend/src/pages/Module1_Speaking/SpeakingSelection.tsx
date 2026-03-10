
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, BookOpen, TrendingUp, Clock, Play, ArrowRight } from 'lucide-react';
import Header from '../../components/Header';
import { SkeletonStatCard, SkeletonContentCard } from '../../components/SkeletonCard';

interface SpeakingStats {
  lastBandScore: number;
  sessionsCompleted: number;
  averageFluency: number;
}

export default function SpeakingSelection() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SpeakingStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/speaking/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching speaking stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Speaking Practice</h1>
          <p className="text-[#777] dark:text-gray-400 text-sm">
            Choose your practice mode and improve your speaking skills
          </p>
        </div>

        {/* Stats Cards */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0E8FF] dark:bg-[#7D3CFF]/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#7D3CFF]" />
                </div>
                <h3 className="font-medium text-[#777] dark:text-gray-400">Last Band Score</h3>
              </div>
              <p className="text-3xl font-bold text-[#7D3CFF]">{stats?.lastBandScore?.toFixed(1) || '—'}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0E8FF] dark:bg-[#7D3CFF]/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#7D3CFF]" />
                </div>
                <h3 className="font-medium text-[#777] dark:text-gray-400">Sessions Completed</h3>
              </div>
              <p className="text-3xl font-bold text-[#7D3CFF]">{stats?.sessionsCompleted || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0E8FF] dark:bg-[#7D3CFF]/20 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-[#7D3CFF]" />
                </div>
                <h3 className="font-medium text-[#777] dark:text-gray-400">Average Fluency</h3>
              </div>
              <p className="text-3xl font-bold text-[#7D3CFF]">{stats?.averageFluency || 0}%</p>
            </div>
          </div>
        )}

        {/* Practice Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7D3CFF] to-[#6B2FE6] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#333] dark:text-white">IELTS Structured Practice</h3>
                <p className="text-xs text-[#777] dark:text-gray-400">Official test format</p>
              </div>
            </div>
            <p className="text-[#777] dark:text-gray-400 text-sm mb-5">
              Practice with official IELTS speaking test format including Part 1, 2, and 3 with AI evaluation
            </p>
            <Link to="/speaking/practice">
              <button className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Start Practice
              </button>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7D3CFF] to-[#6B2FE6] flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#333] dark:text-white">Free Speaking Mode</h3>
                <p className="text-xs text-[#777] dark:text-gray-400">Open practice</p>
              </div>
            </div>
            <p className="text-[#777] dark:text-gray-400 text-sm mb-5">
              Practice speaking on various topics with AI feedback and pronunciation analysis
            </p>
            <Link to="/speaking/free-practice">
              <button className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Start Practice
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}