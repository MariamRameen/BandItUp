import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { TrendingUp, Clock, CheckCircle, Flame, Trophy, Calendar, ChevronRight, BarChart3 } from 'lucide-react';

const API_URL = "http://localhost:4000/api/study-planner";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } });

interface WeeklyReport {
  period: { start: string; end: string };
  generatedAt: string;
  summary: {
    tasksCompleted: number;
    minutesPracticed: number;
    sessionsCompleted: number;
    streakMaintained: boolean;
    currentStreak: number;
  };
  bandProgress: {
    baseline: number;
    current: number;
    target: number;
    change: number;
  };
  skillBreakdown: Array<{
    skill: string;
    sessions: number;
    status: string;
  }>;
  achievements: Array<{
    achievementId: string;
    unlockedAt: string;
  }>;
  stats: {
    totalXP: number;
    level: number;
  };
  nextWeekFocus: string;
  motivationalMessage: string;
}

interface DailySummary {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  minutesPracticed: number;
  streak: number;
}

const SKILL_ICONS: Record<string, string> = {
  listening: '🎧',
  reading: '📖',
  writing: '✍️',
  speaking: '🎤',
  vocabulary: '📚',
};

export default function ProgressHistory() {
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [weeklyRes, dailyRes] = await Promise.all([
        fetch(`${API_URL}/report/weekly`, auth()),
        fetch(`${API_URL}/report/daily`, auth()),
      ]);
      
      const weeklyData = await weeklyRes.json();
      const dailyData = await dailyRes.json();
      
      if (weeklyData.success) {
        setWeeklyReport(weeklyData.report);
      }
      if (dailyData.success) {
        setDailySummary(dailyData.summary);
      }
    } catch (err) {
      console.error("Failed to load progress data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
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
        {/* Header */}
        <div className="mb-6">
          <Link to="/study-planner" className="text-[#7D3CFF] hover:underline text-sm">← Back to Planner</Link>
          <h1 className="text-2xl font-semibold text-[#333] mt-1">Progress Reports</h1>
          <p className="text-[#777] text-sm">Track your IELTS preparation journey</p>
        </div>

        {/* Today's Summary */}
        {dailySummary && (
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Calendar className="text-[#7D3CFF]" size={20} />
              Today's Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#F8F6FF] rounded-xl">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
                <p className="text-2xl font-bold">{dailySummary.tasksCompleted}/{dailySummary.totalTasks}</p>
                <p className="text-xs text-[#777]">Tasks Completed</p>
              </div>
              <div className="text-center p-4 bg-[#F8F6FF] rounded-xl">
                <Clock className="mx-auto mb-2 text-blue-500" size={24} />
                <p className="text-2xl font-bold">{formatTime(dailySummary.minutesPracticed)}</p>
                <p className="text-xs text-[#777]">Time Practiced</p>
              </div>
              <div className="text-center p-4 bg-[#F8F6FF] rounded-xl">
                <BarChart3 className="mx-auto mb-2 text-purple-500" size={24} />
                <p className="text-2xl font-bold">{dailySummary.completionRate}%</p>
                <p className="text-xs text-[#777]">Completion Rate</p>
              </div>
              <div className="text-center p-4 bg-[#F8F6FF] rounded-xl">
                <Flame className="mx-auto mb-2 text-orange-500" size={24} />
                <p className="text-2xl font-bold">{dailySummary.streak}</p>
                <p className="text-xs text-[#777]">Day Streak</p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Report */}
        {weeklyReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Report */}
            <div className="lg:col-span-2 space-y-6">
              {/* Week Overview */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Weekly Report</h3>
                  <span className="text-sm text-[#777]">
                    {formatDate(weeklyReport.period.start)} - {formatDate(weeklyReport.period.end)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#7D3CFF]">{weeklyReport.summary.tasksCompleted}</p>
                    <p className="text-xs text-[#777]">Tasks Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#7D3CFF]">{formatTime(weeklyReport.summary.minutesPracticed)}</p>
                    <p className="text-xs text-[#777]">Study Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#7D3CFF]">{weeklyReport.summary.sessionsCompleted}</p>
                    <p className="text-xs text-[#777]">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-500">{weeklyReport.summary.currentStreak}</p>
                    <p className="text-xs text-[#777]">Day Streak</p>
                  </div>
                </div>

                {/* Motivational Message */}
                <div className="bg-gradient-to-r from-[#F4F0FF] to-white p-4 rounded-xl border border-[#E8DCFF]">
                  <p className="text-[#666] flex items-center gap-2">
                    <span className="text-xl">💪</span>
                    {weeklyReport.motivationalMessage}
                  </p>
                </div>
              </div>

              {/* Skill Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Skill Breakdown</h3>
                <div className="space-y-4">
                  {weeklyReport.skillBreakdown.map((skill) => (
                    <div key={skill.skill} className="flex items-center gap-4">
                      <span className="text-2xl">{SKILL_ICONS[skill.skill]}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium capitalize">{skill.skill}</span>
                          <span className={`text-sm px-2 py-0.5 rounded-full ${
                            skill.status === 'Excellent' ? 'bg-green-100 text-green-700' :
                            skill.status === 'Good' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {skill.status}
                          </span>
                        </div>
                        <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                          <div 
                            className="bg-[#7D3CFF] h-full rounded-full transition-all"
                            style={{ width: `${Math.min((skill.sessions / 5) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#777] mt-1">{skill.sessions} sessions this week</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Week Focus */}
              <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Next Week's Focus</h3>
                <p className="opacity-90">{weeklyReport.nextWeekFocus}</p>
                <Link 
                  to="/study-planner"
                  className="inline-flex items-center gap-1 mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Study Plan <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Band Progress */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-[#7D3CFF]" size={18} />
                  Band Progress
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-sm text-[#777]">Baseline</p>
                    <p className="text-2xl font-bold">{weeklyReport.bandProgress.baseline}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                      <div 
                        className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] h-full rounded-full"
                        style={{ 
                          width: `${Math.min(
                            ((weeklyReport.bandProgress.current - weeklyReport.bandProgress.baseline) / 
                            (weeklyReport.bandProgress.target - weeklyReport.bandProgress.baseline)) * 100, 
                            100
                          )}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#777]">Target</p>
                    <p className="text-2xl font-bold">{weeklyReport.bandProgress.target}</p>
                  </div>
                </div>
                {weeklyReport.bandProgress.change > 0 && (
                  <p className="text-center text-green-600 text-sm">
                    +{weeklyReport.bandProgress.change} band improvement
                  </p>
                )}
              </div>

              {/* XP & Level */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={18} />
                  Level & XP
                </h3>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-[#7D3CFF] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{weeklyReport.stats.level}</span>
                  </div>
                  <p className="text-lg font-bold">{weeklyReport.stats.totalXP} XP</p>
                </div>
                {weeklyReport.achievements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#F0E8FF]">
                    <p className="text-sm text-[#777] mb-2">Achievements this week:</p>
                    <p className="text-lg font-semibold text-[#7D3CFF]">
                      {weeklyReport.achievements.length} unlocked!
                    </p>
                  </div>
                )}
                <Link 
                  to="/study-planner/achievements"
                  className="block mt-4 text-center text-sm text-[#7D3CFF] hover:underline"
                >
                  View All Achievements →
                </Link>
              </div>
            </div>
          </div>
        )}

        {!weeklyReport && !dailySummary && (
          <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-[#7D3CFF] opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No Progress Data Yet</h3>
            <p className="text-[#777] mb-4">
              Start completing tasks in your study plan to see progress reports here.
            </p>
            <Link
              to="/study-planner"
              className="inline-block bg-[#7D3CFF] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6B2FE6]"
            >
              Go to Study Planner
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
