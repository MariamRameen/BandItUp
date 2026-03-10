import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { Trophy, Star, Lock, ChevronRight, Medal, Zap, TrendingUp, Users, CheckCircle, Flame, Swords, Clock, FileText, Book, Headphones, BookOpen, Edit, Mic } from 'lucide-react';

const API_URL = "http://localhost:4000/api/achievements";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } });

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  icon: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementStats {
  totalXP: number;
  level: number;
  nextLevelXP: number;
  currentLevelXP: number;
}

interface AchievementProgress {
  tasksCompleted: number;
  listeningCompleted: number;
  readingCompleted: number;
  writingCompleted: number;
  speakingCompleted: number;
  vocabLearned: number;
  mockTestsCompleted: number;
  totalMinutes: number;
  currentStreak: number;
  bestStreak: number;
  bandImprovement: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  totalXP: number;
  isCurrentUser: boolean;
}

export default function PlannerAchievements() {
  const [achievements, setAchievements] = useState<{
    unlocked: Achievement[];
    locked: Achievement[];
    total: number;
    unlockedCount: number;
  } | null>(null);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard'>('achievements');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [achRes, lbRes] = await Promise.all([
        fetch(API_URL, auth()),
        fetch(`${API_URL}/leaderboard`, auth()),
      ]);
      
      const achData = await achRes.json();
      const lbData = await lbRes.json();
      
      if (achData.success) {
        setAchievements(achData.achievements);
        setStats(achData.stats);
        setProgress(achData.progress);
      }
      
      if (lbData.success) {
        setLeaderboard(lbData.leaderboard);
        setUserRank(lbData.userRank);
      }
    } catch (err) {
      console.error("Failed to load achievements:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getLevelProgress = () => {
    if (!stats) return 0;
    const xpInCurrentLevel = stats.totalXP - stats.currentLevelXP;
    const xpNeededForLevel = stats.nextLevelXP - stats.currentLevelXP;
    return xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 100;
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/study-planner" className="text-[#7D3CFF] hover:underline text-sm">← Back to Planner</Link>
            <h1 className="text-2xl font-semibold text-[#333] mt-1">Achievements</h1>
          </div>
        </div>

        {/* Stats Banner */}
        {stats && (
          <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-6 text-white mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold">{stats.level}</span>
                </div>
                <div>
                  <p className="text-white/75 text-sm">Your Level</p>
                  <p className="text-2xl font-bold">{stats.totalXP} XP</p>
                  <div className="mt-2 w-48">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Level {stats.level}</span>
                      <span>Level {stats.level + 1}</span>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full">
                      <div 
                        className="bg-white h-full rounded-full transition-all"
                        style={{ width: `${getLevelProgress()}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/75 mt-1">
                      {stats.nextLevelXP - stats.totalXP} XP to next level
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <Trophy className="mx-auto mb-1" size={24} />
                  <p className="text-2xl font-bold">{achievements?.unlockedCount || 0}</p>
                  <p className="text-xs text-white/75">Unlocked</p>
                </div>
                <div className="text-center">
                  <Lock className="mx-auto mb-1" size={24} />
                  <p className="text-2xl font-bold">{(achievements?.total || 0) - (achievements?.unlockedCount || 0)}</p>
                  <p className="text-xs text-white/75">Remaining</p>
                </div>
                {userRank && (
                  <div className="text-center">
                    <Medal className="mx-auto mb-1" size={24} />
                    <p className="text-2xl font-bold">#{userRank}</p>
                    <p className="text-xs text-white/75">Rank</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'achievements'
                ? 'bg-[#7D3CFF] text-white'
                : 'bg-white text-[#666] hover:bg-[#F4F0FF]'
            }`}
          >
            <Trophy size={16} className="inline-block mr-2" />
            Achievements
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-[#7D3CFF] text-white'
                : 'bg-white text-[#666] hover:bg-[#F4F0FF]'
            }`}
          >
            <Users size={16} className="inline-block mr-2" />
            Leaderboard
          </button>
        </div>

        {activeTab === 'achievements' && achievements && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Achievements Grid */}
            <div className="lg:col-span-2 space-y-6">
              {/* Unlocked Achievements */}
              {achievements.unlocked.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Star className="text-yellow-500" size={20} />
                    Unlocked ({achievements.unlocked.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.unlocked.map((ach) => (
                      <div
                        key={ach.id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#F4F0FF] to-white rounded-xl border border-[#E8DCFF]"
                      >
                        <div className="w-12 h-12 bg-[#7D3CFF] rounded-full flex items-center justify-center text-2xl">
                          {ach.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{ach.name}</p>
                          <p className="text-xs text-[#777]">{ach.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-[#7D3CFF] text-white px-2 py-0.5 rounded-full">
                              +{ach.xp} XP
                            </span>
                            {ach.unlockedAt && (
                              <span className="text-xs text-[#999]">
                                {formatDate(ach.unlockedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Achievements */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Lock className="text-gray-400" size={20} />
                  Locked ({achievements.locked.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.locked.map((ach) => (
                    <div
                      key={ach.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 opacity-75"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl grayscale">
                        {ach.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-500">{ach.name}</p>
                        <p className="text-xs text-gray-400">{ach.description}</p>
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                          +{ach.xp} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Sidebar */}
            {progress && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                  <h3 className="font-semibold mb-4">Your Progress</h3>
                  <div className="space-y-4">
                    <ProgressItem label="Tasks Completed" value={progress.tasksCompleted} icon={<CheckCircle className="w-4 h-4 text-green-500" />} />
                    <ProgressItem label="Current Streak" value={`${progress.currentStreak} days`} icon={<Flame className="w-4 h-4 text-orange-500" />} />
                    <ProgressItem label="Best Streak" value={`${progress.bestStreak} days`} icon={<Swords className="w-4 h-4 text-red-500" />} />
                    <ProgressItem label="Study Time" value={`${Math.floor(progress.totalMinutes / 60)}h ${progress.totalMinutes % 60}m`} icon={<Clock className="w-4 h-4 text-blue-500" />} />
                    <ProgressItem label="Mock Tests" value={progress.mockTestsCompleted} icon={<FileText className="w-4 h-4 text-purple-500" />} />
                    <ProgressItem label="Vocab Learned" value={progress.vocabLearned} icon={<Book className="w-4 h-4 text-indigo-500" />} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                  <h3 className="font-semibold mb-4">Skills Completed</h3>
                  <div className="space-y-3">
                    <SkillProgress label="Listening" value={progress.listeningCompleted} max={20} icon={<Headphones className="w-4 h-4 text-blue-500" />} />
                    <SkillProgress label="Reading" value={progress.readingCompleted} max={20} icon={<BookOpen className="w-4 h-4 text-emerald-500" />} />
                    <SkillProgress label="Writing" value={progress.writingCompleted} max={20} icon={<Edit className="w-4 h-4 text-amber-500" />} />
                    <SkillProgress label="Speaking" value={progress.speakingCompleted} max={20} icon={<Mic className="w-4 h-4 text-pink-500" />} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="text-[#7D3CFF]" size={20} />
              Top Learners
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-[#777] text-center py-8">No leaderboard data yet.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      entry.isCurrentUser
                        ? 'bg-[#F4F0FF] border border-[#7D3CFF]'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      entry.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.name}
                        {entry.isCurrentUser && <span className="text-[#7D3CFF] ml-2">(You)</span>}
                      </p>
                      <p className="text-xs text-[#777]">Level {entry.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#7D3CFF]">{entry.totalXP} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressItem({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#666] flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function SkillProgress({ label, value, max, icon }: { label: string; value: number; max: number; icon: React.ReactNode }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-semibold">{value}/{max}</span>
      </div>
      <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
        <div 
          className="bg-[#7D3CFF] h-full rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
