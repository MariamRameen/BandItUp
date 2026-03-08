import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";

const API = "http://localhost:4000/api/listening";
function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` };
}

interface RecentSession {
  _id: string; part: number; difficulty: string; sessionType: string;
  bandEstimate: number; scaledScore: number; correctCount: number;
  totalQuestions: number; passageTitle: string; topic: string;
  autoSubmitted: boolean; createdAt: string;
}
interface WeeklyData { week: string; avgBand: number | null; sessions: number; }
interface PartState { part: number; currentDifficulty: string; totalSessions: number; avgScore: number; avgBand: number; }
interface Weakness { type: string; label: string; hitCount: number; }

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-orange-100 text-orange-700",
  advanced: "bg-red-100 text-red-700",
};

export default function ListeningProgress(): React.ReactElement {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overallBand, setOverallBand] = useState(0);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMockTests, setTotalMockTests] = useState(0);
  const [skillLabel, setSkillLabel] = useState("Beginner");
  const [partStates, setPartStates] = useState<PartState[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [mockAvailable, setMockAvailable] = useState(false);

  useEffect(() => {
    fetch(`${API}/progress`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setOverallBand(d.overallBand);
          setOverallAccuracy(d.overallAccuracy);
          setTotalSessions(d.totalSessions);
          setTotalMockTests(d.totalMockTests);
          setSkillLabel(d.skillLabel);
          setPartStates(d.partStates || []);
          setWeaknesses(d.weaknesses || []);
          setRecentSessions(d.recentSessions || []);
          setWeeklyData(d.weeklyData || []);
          setMockAvailable(d.mockAvailable);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxBand = Math.max(...weeklyData.map(w => w.avgBand ?? 0), 1);

  if (loading) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7D3CFF]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Listening Progress</h1>
            <p className="text-sm text-gray-500 mt-1">Your adaptive learning journey</p>
          </div>
          <button onClick={() => navigate("/listening")}
            className="bg-[#7D3CFF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6B2FE6] transition-colors">
            ← Back to Practice
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Overall Band", value: overallBand > 0 ? overallBand.toFixed(1) : "—", color: "text-[#7D3CFF]" },
            { label: "Accuracy", value: `${overallAccuracy}%`, color: "text-blue-600" },
            { label: "Sessions", value: String(totalSessions), color: "text-green-600" },
            { label: "Mock Tests", value: String(totalMockTests), color: "text-orange-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#F0E8FF] p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Skill label banner */}
        <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-4 text-white text-center mb-6">
          <p className="text-xs opacity-70 uppercase tracking-widest mb-1">Current Level</p>
          <p className="text-2xl font-bold">{skillLabel}</p>
          {totalSessions >= 5 && <p className="text-xs opacity-60 mt-1">Based on last 5 sessions per part</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Weekly trend */}
          <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
            <p className="text-sm font-semibold text-[#1a1a2e] mb-4">📈 Weekly Band Trend</p>
            {weeklyData.every(w => w.avgBand === null) ? (
              <p className="text-sm text-gray-400 text-center py-8">Complete more sessions to see your trend</p>
            ) : (
              <div className="flex items-end gap-3 h-32">
                {weeklyData.map((w, i) => {
                  const h = w.avgBand ? Math.max((w.avgBand / 9) * 100, 8) : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-[#7D3CFF]">{w.avgBand ?? "—"}</span>
                      <div className="w-full rounded-t-lg bg-[#F0E8FF] flex items-end" style={{ height: "80px" }}>
                        <div className="w-full rounded-t-lg bg-[#7D3CFF] transition-all" style={{ height: `${h}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{w.week}</span>
                      <span className="text-xs text-gray-300">{w.sessions}s</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
            <p className="text-sm font-semibold text-[#1a1a2e] mb-4">⚠️ Weakness Profile</p>
            {weaknesses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No weaknesses tracked yet</p>
            ) : (
              <div className="space-y-3">
                {weaknesses.slice(0, 5).map((w) => {
                  const barPct = Math.min((w.hitCount / 10) * 100, 100);
                  return (
                    <div key={w.type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-[#1a1a2e]">{w.label}</span>
                        <span className="text-gray-400">{w.hitCount} occurrences</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${barPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Per-part breakdown */}
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-6">
          <p className="text-sm font-semibold text-[#1a1a2e] mb-4">📊 Per-Part Performance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partStates.map(ps => (
              <div key={ps.part} className="bg-[#F8F9FF] rounded-xl p-4 border border-[#F0E8FF]">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-sm text-[#1a1a2e]">Part {ps.part}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[ps.currentDifficulty]}`}>
                    {ps.currentDifficulty}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                  <div><p className="font-bold text-[#7D3CFF]">{ps.avgBand > 0 ? ps.avgBand.toFixed(1) : "—"}</p><p className="text-gray-400">Avg Band</p></div>
                  <div><p className="font-bold text-[#1a1a2e]">{Math.round(ps.avgScore * 100)}%</p><p className="text-gray-400">Avg Score</p></div>
                  <div><p className="font-bold text-[#1a1a2e]">{ps.totalSessions}</p><p className="text-gray-400">Sessions</p></div>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full">
                  <div className="h-1.5 bg-[#7D3CFF] rounded-full" style={{ width: `${Math.min(ps.avgScore * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
          <p className="text-sm font-semibold text-[#1a1a2e] mb-4">🕐 Recent Sessions</p>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No sessions yet. Start practicing!</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div key={s._id} onClick={() => navigate(`/listening/results/${s._id}`)}
                  className="flex items-center justify-between px-4 py-3 bg-[#F8F9FF] rounded-xl border border-[#F0E8FF] hover:border-[#7D3CFF] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white bg-[#7D3CFF] rounded-lg px-2 py-1">P{s.part}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a2e] line-clamp-1">{s.passageTitle || s.topic}</p>
                      <p className="text-xs text-gray-400">
                        {s.sessionType === "mock" ? "Mock · " : ""}{s.difficulty} · {new Date(s.createdAt).toLocaleDateString()}
                        {s.autoSubmitted ? " · ⏱ auto-submitted" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#7D3CFF]">Band {s.bandEstimate}</p>
                    <p className="text-xs text-gray-400">{s.correctCount}/{s.totalQuestions} correct</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {mockAvailable && (
          <div className="mt-5 bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] rounded-2xl p-5 text-white text-center">
            <p className="font-bold text-lg mb-1">📋 Weekly Mock Test Available!</p>
            <p className="text-sm opacity-80 mb-3">8 questions · all 4 parts · tailored to your weaknesses</p>
            <button onClick={() => navigate("/listening")}
              className="bg-white text-[#7D3CFF] font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors">
              Go Take It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
