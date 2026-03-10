import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Zap, BookOpen, Trophy, Clock, TrendingUp, ChevronRight } from "lucide-react";

const API = "http://localhost:4000/api/speaking";
const token = () => localStorage.getItem("token") || "";

export default function SpeakingHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d); });
  }, []);

  const avgBand = stats?.avgBand || 0;
  const criteria = stats?.criteriaAvg || { fluencyCoherence: 0, lexicalResource: 0, grammaticalRange: 0, pronunciation: 0 };
  const weakest = Object.entries(criteria).sort((a: any, b: any) => a[1] - b[1])[0]?.[0];

  const criteriaLabels: Record<string, string> = {
    fluencyCoherence: "Fluency & Coherence",
    lexicalResource:  "Lexical Resource",
    grammaticalRange: "Grammatical Range",
    pronunciation:    "Pronunciation",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF] text-[#333]">
      {/* Header */}
      <div className="bg-white border-b border-[#F0E8FF] px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-[#7D3CFF] text-sm hover:underline">← Dashboard</button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] bg-clip-text text-transparent">Speaking Practice</h1>
            <p className="text-[#777] text-xs">Build fluency • Score higher • Speak with confidence</p>
          </div>
        </div>
        {avgBand > 0 && (
          <div className="bg-gradient-to-br from-[#7D3CFF] to-[#5A20E0] text-white rounded-2xl px-6 py-3 text-center shadow-lg">
            <p className="text-xs opacity-80 uppercase tracking-widest">Avg Band</p>
            <p className="text-4xl font-bold">{avgBand}</p>
            <p className="text-xs opacity-70">{stats?.totalSessions} sessions</p>
          </div>
        )}
      </div>

      <div className="px-8 py-8 max-w-5xl mx-auto">

        {/* Criteria scores */}
        {stats?.totalSessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(criteriaLabels).map(([key, label]) => {
              const val = (criteria as any)[key] || 0;
              const isWeak = key === weakest;
              return (
                <div key={key} className={`bg-white rounded-2xl p-5 shadow-sm border ${isWeak ? "border-[#F107A3]/40" : "border-[#F0E8FF]"}`}>
                  <p className="text-xs text-[#777] mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${isWeak ? "text-[#F107A3]" : "text-[#7D3CFF]"}`}>{val || "—"}</p>
                  {isWeak && <p className="text-[10px] text-[#F107A3] mt-1">⚠ Needs focus</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Free Practice */}
          <button
            onClick={() => navigate("/speaking/session?mode=free")}
            className="group bg-white border border-[#F0E8FF] rounded-3xl p-8 text-left hover:shadow-xl hover:border-[#7D3CFF]/30 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7D3CFF] to-[#5A20E0] flex items-center justify-center text-white shadow-lg">
                <Zap size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#333]">Free Practice</h2>
                <p className="text-[#777] text-sm">Any topic, speak freely</p>
              </div>
            </div>
            <p className="text-[#666] text-sm mb-6">AI generates a prompt based on your level. Speak for 30 seconds and get instant IELTS-style feedback.</p>
            <div className="flex items-center gap-2 text-[#7D3CFF] font-semibold text-sm group-hover:gap-3 transition-all">
              Start Speaking <ChevronRight size={16} />
            </div>
          </button>

          {/* IELTS Practice */}
          <button
            onClick={() => navigate("/speaking/ielts")}
            className="group bg-white border border-[#F0E8FF] rounded-3xl p-8 text-left hover:shadow-xl hover:border-[#F107A3]/30 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F107A3] to-[#C2006B] flex items-center justify-center text-white shadow-lg">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#333]">IELTS Practice</h2>
                <p className="text-[#777] text-sm">Parts 1, 2 & 3</p>
              </div>
            </div>
            <p className="text-[#666] text-sm mb-6">Practice individual IELTS speaking parts or complete all three. Questions adapt to your current band level.</p>
            <div className="flex items-center gap-2 text-[#F107A3] font-semibold text-sm group-hover:gap-3 transition-all">
              Choose Part <ChevronRight size={16} />
            </div>
          </button>
        </div>

        {/* Weekly Mock */}
        <button
          onClick={() => navigate("/speaking/weekly-mock")}
          className="group w-full bg-white border border-[#F0E8FF] rounded-3xl p-6 text-left hover:shadow-xl transition-all shadow-sm flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#333]">Weekly Mock Test</h3>
              <p className="text-[#777] text-sm">Full IELTS speaking mock • Personalized to your weak areas</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-[#7D3CFF] group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/speaking/history")}
            className="flex items-center gap-4 bg-white border border-[#F0E8FF] rounded-2xl p-5 hover:shadow-md transition-all text-left shadow-sm"
          >
            <Clock size={20} className="text-[#7D3CFF]" />
            <div>
              <p className="font-semibold text-[#333]">Session History</p>
              <p className="text-[#777] text-sm">{stats?.totalSessions || 0} sessions recorded</p>
            </div>
            <ChevronRight size={16} className="text-[#7D3CFF] ml-auto" />
          </button>

          <button
            onClick={() => navigate("/speaking/progress")}
            className="flex items-center gap-4 bg-white border border-[#F0E8FF] rounded-2xl p-5 hover:shadow-md transition-all text-left shadow-sm"
          >
            <TrendingUp size={20} className="text-[#7D3CFF]" />
            <div>
              <p className="font-semibold text-[#333]">Progress Tracker</p>
              <p className="text-[#777] text-sm">Band trend over time</p>
            </div>
            <ChevronRight size={16} className="text-[#7D3CFF] ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
