import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import { CheckCircle, Circle, ChevronLeft, ChevronRight, Calendar, Target, Flame, Headphones, BookOpen, Edit, Mic, Book } from 'lucide-react';

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
  weekNumber: number;
  weekStartDate: string;
  weeklyFocus: string;
  dailyTasks: Record<string, DailyTask[]>;
  weeklyGoals: WeeklyGoal[];
  todaysTasks: DailyTask[];
  progress: { completed: number; total: number; percentage: number };
  streak: number;
  totalMinutesPracticed: number;
}

const SKILL_ICONS: Record<string, React.ReactNode> = {
  listening: <Headphones className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />,
  writing: <Edit className="w-4 h-4" />,
  speaking: <Mic className="w-4 h-4" />,
  vocabulary: <Book className="w-4 h-4" />,
};

const SKILL_COLORS: Record<string, string> = {
  listening: "bg-blue-100 text-blue-700",
  reading: "bg-emerald-100 text-emerald-700",
  writing: "bg-amber-100 text-amber-700",
  speaking: "bg-pink-100 text-pink-700",
  vocabulary: "bg-purple-100 text-purple-700",
};

export default function PlannerCalendar() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  useEffect(() => {
    // Set today as selected by default
    if (plan && selectedDay === null) {
      const today = new Date().getDay();
      setSelectedDay(today === 0 ? 6 : today - 1); // Convert to Mon=0
    }
  }, [plan, selectedDay]);

  const loadPlan = async () => {
    try {
      const res = await fetch(`${API_URL}/plan`, auth());
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
      }
    } catch (err) {
      console.error("Failed to load plan:", err);
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
        loadPlan();
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
    } finally {
      setCompleting(null);
    }
  };

  const getDays = () => {
    if (!plan) return [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekStart = new Date(plan.weekStartDate);
    const today = new Date();
    
    return dayNames.map((day, index) => {
      const tasks = plan.dailyTasks[String(index)] || [];
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
      
      return {
        day,
        date: date.getDate(),
        fullDate: date,
        tasks,
        completed: tasks.filter(t => t.isCompleted).length === tasks.length && tasks.length > 0,
        isToday: todayIndex === index,
        isPast: index < todayIndex,
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

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-xl mx-auto px-8 py-12 text-center">
          <p className="text-red-500">Unable to load study plan.</p>
          <button onClick={() => navigate("/baseline")} className="mt-4 bg-[#7D3CFF] text-white px-6 py-3 rounded-xl">
            Complete Baseline Test
          </button>
        </div>
      </div>
    );
  }

  const days = getDays();
  const selectedDayTasks = selectedDay !== null ? (plan.dailyTasks[String(selectedDay)] || []) : [];
  const studyHours = Math.floor(plan.totalMinutesPracticed / 60);
  const studyMins = plan.totalMinutesPracticed % 60;

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/study-planner" className="text-[#7D3CFF] hover:underline">← Back to Planner</Link>
            </div>
            <h1 className="text-2xl font-semibold text-[#333]">Study Calendar</h1>
            <p className="text-[#777] text-sm">Week {plan.weekNumber} • {plan.weeklyFocus}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full">
              <Flame size={16} />
              <span className="font-semibold">{plan.streak} day streak</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar size={20} className="text-[#7D3CFF]" />
                  Week {plan.weekNumber} Schedule
                </h2>
              </div>

              {/* Week Days Grid */}
              <div className="grid grid-cols-7 gap-3 mb-6">
                {days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      selectedDay === index
                        ? 'bg-[#7D3CFF] text-white shadow-lg scale-105'
                        : day.completed
                        ? 'bg-green-50 border-2 border-green-300 hover:border-green-400'
                        : day.isToday
                        ? 'bg-[#F4F0FF] border-2 border-[#7D3CFF]'
                        : 'bg-[#F8F9FF] border border-[#F0E8FF] hover:border-[#7D3CFF]'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${
                      selectedDay === index ? 'text-white/80' : 'text-[#777]'
                    }`}>
                      {day.day}
                    </p>
                    <p className={`text-2xl font-bold my-2 ${
                      selectedDay === index ? 'text-white' : ''
                    }`}>
                      {day.date}
                    </p>
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                      day.completed
                        ? 'bg-green-500 text-white'
                        : selectedDay === index
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {day.completed ? '✓' : day.tasks.length}
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Day Tasks */}
              <div className="border-t border-[#F0E8FF] pt-6">
                <h3 className="font-semibold text-lg mb-4">
                  {selectedDay !== null && days[selectedDay] 
                    ? `${days[selectedDay].day} - ${days[selectedDay].date}/${new Date().getMonth() + 1}` 
                    : 'Select a day'}
                  {selectedDay !== null && days[selectedDay]?.isToday && (
                    <span className="ml-2 text-xs bg-[#7D3CFF] text-white px-2 py-1 rounded-full">Today</span>
                  )}
                </h3>
                
                {selectedDayTasks.length === 0 ? (
                  <p className="text-[#777] text-center py-8">No tasks scheduled for this day.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayTasks.map((task) => (
                      <div
                        key={task.taskId}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          task.isCompleted 
                            ? 'bg-green-50 border-green-200 opacity-70' 
                            : `${SKILL_COLORS[task.skill]} border-transparent`
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
                            <Circle className="text-gray-400 hover:text-[#7D3CFF]" size={24} />
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
                          <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                            {task.duration} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Weekly Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tasks Completed</span>
                    <span className="font-semibold">{plan.progress.completed}/{plan.progress.total}</span>
                  </div>
                  <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                    <div 
                      className="bg-[#7D3CFF] h-full rounded-full transition-all"
                      style={{ width: `${plan.progress.percentage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Study Time</span>
                    <span className="font-semibold">{studyHours}h {studyMins}m</span>
                  </div>
                  <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                    <div 
                      className="bg-[#7D3CFF] h-full rounded-full"
                      style={{ width: `${Math.min((plan.totalMinutesPracticed / (15 * 60)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Skill Goals</h3>
              <div className="space-y-3">
                {plan.weeklyGoals.map((goal) => (
                  <div key={goal.skill} className="flex items-center justify-between">
                    <span className="text-sm">
                      {SKILL_ICONS[goal.skill]} {goal.skill.charAt(0).toUpperCase() + goal.skill.slice(1)}
                    </span>
                    <span className={`text-sm font-semibold ${
                      goal.completedSessions >= goal.targetSessions ? 'text-green-600' : ''
                    }`}>
                      {goal.completedSessions}/{goal.targetSessions}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Target size={20} />
                <h3 className="font-semibold">Target Progress</h3>
              </div>
              <p className="text-3xl font-bold mb-1">{plan.baselineBand} → {plan.targetBand}</p>
              <p className="text-sm opacity-80">
                {(plan.targetBand - plan.baselineBand).toFixed(1)} bands to improve
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}