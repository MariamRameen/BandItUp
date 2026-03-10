
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import { CheckCircle, Circle, Clock, Target, Flame, TrendingUp, Calendar, ChevronRight, Headphones, BookOpen, Edit, Mic, Book, Trophy, BarChart3 } from 'lucide-react';

const API_URL = "http://localhost:4000/api/study-planner";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } });

interface DailyTask {
  taskId: string;
  skill: string;
  taskType: string;
  title: string;
  description?: string;
  duration: number;
  difficulty: number;
  isCompleted: boolean;
  completedAt?: string;
}

interface WeeklyGoal {
  skill: string;
  targetSessions: number;
  completedSessions: number;
  focusAreas: string[];
}

interface StudyPlanData {
  _id: string;
  targetBand: number;
  baselineBand: number;
  currentBand: number;
  weekNumber: number;
  weekStartDate: string;
  weeklyFocus: string;
  aiRecommendations: string[];
  dailyTasks: Record<string, DailyTask[]>;
  weeklyGoals: WeeklyGoal[];
  todaysTasks: DailyTask[];
  progress: { completed: number; total: number; percentage: number };
  streak: number;
  longestStreak: number;
  totalMinutesPracticed: number;
}

const SKILL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  listening: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  reading: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  writing: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  speaking: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  vocabulary: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

const SKILL_ICONS: Record<string, React.ReactNode> = {
  listening: <Headphones className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />,
  writing: <Edit className="w-4 h-4" />,
  speaking: <Mic className="w-4 h-4" />,
  vocabulary: <Book className="w-4 h-4" />,
};

const SKILL_ROUTES: Record<string, string> = {
  listening: "/listening",
  reading: "/reading",
  writing: "/writing",
  speaking: "/speaking",
  vocabulary: "/vocabulary",
};

export default function PlannerHome() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const res = await fetch(`${API_URL}/plan`, auth());
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
      } else {
        setError(data.message || "Failed to load study plan");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    if (!plan || completing) return;
    setCompleting(taskId);
    
    try {
      const res = await fetch(`${API_URL}/task/complete`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (data.success) {
        // Reload plan to get updated data
        loadPlan();
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
    } finally {
      setCompleting(null);
    }
  };

  const startTask = (task: DailyTask) => {
    const route = SKILL_ROUTES[task.skill] || "/dashboard";
    navigate(route);
  };

  // Calculate week days from plan data
  const getWeekDays = () => {
    if (!plan) return [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekStart = new Date(plan.weekStartDate);
    
    return dayNames.map((day, index) => {
      const tasks = plan.dailyTasks[String(index)] || [];
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      
      return {
        day,
        date: date.getDate().toString(),
        tasks: tasks.length,
        completed: tasks.filter(t => t.isCompleted).length,
        isToday: new Date().getDay() === (index === 6 ? 0 : index + 1),
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-xl mx-auto px-8 py-12 text-center">
          <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF]">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => navigate("/baseline")}
              className="bg-[#7D3CFF] text-white px-6 py-3 rounded-xl font-semibold"
            >
              Complete Baseline Test First
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const weekDays = getWeekDays();
  const progressToTarget = plan.targetBand > 0 
    ? Math.round(((plan.currentBand - 4) / (plan.targetBand - 4)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">
            Let's reach your Band {plan.targetBand} together!
          </h1>
          <p className="text-[#777] text-sm">{plan.weeklyFocus}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-[#7D3CFF]" />
              <h3 className="font-semibold text-lg">Baseline Band</h3>
            </div>
            <p className="text-3xl font-bold text-[#7D3CFF]">{plan.baselineBand}</p>
            <p className="text-sm text-[#777] mt-1">Your starting point</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-[#7D3CFF]" />
              <h3 className="font-semibold text-lg">Target Band</h3>
            </div>
            <p className="text-3xl font-bold text-[#7D3CFF]">{plan.targetBand}</p>
            <p className="text-sm text-[#777] mt-1">
              {(plan.targetBand - plan.baselineBand).toFixed(1)} bands to go!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={18} className="text-orange-500" />
              <h3 className="font-semibold text-lg">Streak</h3>
            </div>
            <p className="text-3xl font-bold text-orange-500">{plan.streak} days</p>
            <p className="text-sm text-[#777] mt-1">Best: {plan.longestStreak} days</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-[#7D3CFF]" />
              <h3 className="font-semibold text-lg">Time Practiced</h3>
            </div>
            <p className="text-3xl font-bold text-[#7D3CFF]">
              {Math.floor(plan.totalMinutesPracticed / 60)}h {plan.totalMinutesPracticed % 60}m
            </p>
            <p className="text-sm text-[#777] mt-1">Total study time</p>
          </div>
        </div>

        {/* Week Overview */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Week {plan.weekNumber} Progress</h3>
            <Link to="/study-planner/calendar" className="text-[#7D3CFF] text-sm hover:underline flex items-center gap-1">
              View Calendar <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => (
              <div key={index} className={`text-center p-3 rounded-xl ${day.isToday ? 'bg-[#7D3CFF] text-white' : ''}`}>
                <p className={`font-semibold text-sm ${day.isToday ? 'text-white/80' : 'text-[#777]'}`}>{day.day}</p>
                <p className={`text-lg font-bold my-2 ${day.isToday ? 'text-white' : ''}`}>{day.date}</p>
                <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${
                  day.completed === day.tasks && day.tasks > 0 ? 'bg-green-500 text-white' :
                  day.completed > 0 ? (day.isToday ? 'bg-white/20 text-white' : 'bg-[#7D3CFF] text-white') : 
                  day.isToday ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {day.completed}/{day.tasks}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#777]">Weekly Progress</span>
              <span className="font-semibold">{plan.progress.percentage}%</span>
            </div>
            <div className="w-full bg-[#EDE3FF] h-3 rounded-full">
              <div 
                className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] h-full rounded-full transition-all duration-500"
                style={{ width: `${plan.progress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Today's Tasks</h3>
            {plan.todaysTasks.length === 0 ? (
              <p className="text-[#777] text-center py-8">
                No tasks scheduled for today. Enjoy your rest day!
              </p>
            ) : (
              <div className="space-y-3">
                {plan.todaysTasks.map((task) => {
                  const colors = SKILL_COLORS[task.skill] || SKILL_COLORS.vocabulary;
                  return (
                    <div
                      key={task.taskId}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${colors.bg} ${colors.border} ${
                        task.isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => !task.isCompleted && completeTask(task.taskId)}
                        disabled={task.isCompleted || completing === task.taskId}
                        className="flex-shrink-0"
                      >
                        {task.isCompleted ? (
                          <CheckCircle className="text-green-500" size={24} />
                        ) : completing === task.taskId ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7D3CFF]" />
                        ) : (
                          <Circle className={colors.text} size={24} />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{SKILL_ICONS[task.skill]}</span>
                          <p className={`font-semibold ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </p>
                        </div>
                        <p className="text-sm text-[#777]">{task.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#777]">{task.duration} min</p>
                        {!task.isCompleted && (
                          <button
                            onClick={() => startTask(task)}
                            className="mt-1 text-xs bg-[#7D3CFF] text-white px-3 py-1 rounded-lg hover:bg-[#6B2FE6]"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Tips */}
          <div className="space-y-4">
            <div className="bg-[#E8FFF3] p-6 rounded-2xl border border-[#C6FDE7]">
              <h3 className="font-semibold mb-3 text-[#138A4D]">AI Recommendations</h3>
              <ul className="space-y-2">
                {plan.aiRecommendations.map((tip, index) => (
                  <li key={index} className="text-sm text-[#138A4D] flex gap-2">
                    <span>•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Weekly Goals</h3>
              <div className="space-y-3">
                {plan.weeklyGoals.slice(0, 4).map((goal) => (
                  <div key={goal.skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{SKILL_ICONS[goal.skill]} {goal.skill.charAt(0).toUpperCase() + goal.skill.slice(1)}</span>
                      <span className="font-semibold">{goal.completedSessions}/{goal.targetSessions}</span>
                    </div>
                    <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                      <div 
                        className="bg-[#7D3CFF] h-full rounded-full"
                        style={{ width: `${(goal.completedSessions / goal.targetSessions) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap Preview */}
            <Link 
              to="/study-planner/roadmap"
              className="block bg-gradient-to-br from-[#7D3CFF] to-[#9B59B6] p-6 rounded-2xl text-white hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Your Roadmap</h3>
                <ChevronRight size={20} />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{plan.baselineBand}</p>
                  <p className="text-xs opacity-75">Start</p>
                </div>
                <div className="flex-1 h-1 bg-white/30 rounded-full relative">
                  <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" style={{ left: '50%' }} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{plan.targetBand}</p>
                  <p className="text-xs opacity-75">Target</p>
                </div>
              </div>
              <p className="text-xs mt-3 opacity-75">View your milestone roadmap →</p>
            </Link>

            {/* Achievements Preview */}
            <Link 
              to="/study-planner/achievements"
              className="block bg-white p-6 rounded-2xl border border-[#F0E8FF] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Achievements
                </h3>
                <ChevronRight size={20} className="text-[#7D3CFF]" />
              </div>
              <p className="text-sm text-[#777]">
                Complete tasks, maintain streaks, and earn XP to level up!
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs bg-[#F4F0FF] text-[#7D3CFF] px-2 py-1 rounded-full">View All →</span>
              </div>
            </Link>

            {/* Progress Report Link */}
            <Link 
              to="/study-planner/progress"
              className="block bg-white p-6 rounded-2xl border border-[#F0E8FF] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#7D3CFF]" /> Progress Reports
                </h3>
                <ChevronRight size={20} className="text-[#7D3CFF]" />
              </div>
              <p className="text-sm text-[#777]">
                View your weekly progress and skill breakdown
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}