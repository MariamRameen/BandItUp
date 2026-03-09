import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";

const API  = "http://localhost:4000/api/listening";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` });

interface Session {
  _id:           string;
  sessionType:   "practice" | "mock";
  part:          number;
  accent:        string;
  difficulty:    string;
  topic:         string;
  passageTitle:  string;
  correctCount:  number;
  totalQuestions:number;
  bandEstimate:  number;
  scaledScore:   number;
  timeUsedSeconds: number;
  completed:     boolean;
  createdAt:     string;
  feedback?: {
    strengths:       string[];
    improvementTips: string[];
  };
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:     "bg-green-100 text-green-700",
  medium:   "bg-amber-100 text-amber-700",
  hard:     "bg-orange-100 text-orange-700",
  advanced: "bg-red-100 text-red-700",
};

const PART_COLOR: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-purple-500",
  3: "bg-pink-500",
  4: "bg-indigo-500",
};

function bandColor(band: number) {
  if (band >= 7) return "text-green-600";
  if (band >= 5) return "text-amber-600";
  return "text-red-500";
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  const r   = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#F0E8FF" strokeWidth="5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="#7D3CFF" strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 26 26)" />
      <text x="26" y="31" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1a1a2e">
        {correct}/{total}
      </text>
    </svg>
  );
}

export default function ListeningHistory(): React.ReactElement {
  const navigate = useNavigate();
  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all" | "practice" | "mock">("all");
  const [partFilter,setPartFilter]= useState<number | "all">("all");
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [page,      setPage]      = useState(1);
  const PER_PAGE = 8;

  useEffect(() => {
    fetch(`${API}/history`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setSessions(d.sessions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter((s) => {
    if (filter !== "all"     && s.sessionType !== filter) return false;
    if (partFilter !== "all" && s.part !== partFilter)    return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Stats
  const avgBand      = sessions.length ? (sessions.reduce((a, s) => a + s.bandEstimate, 0) / sessions.length).toFixed(1) : "–";
  const bestBand     = sessions.length ? Math.max(...sessions.map((s) => s.bandEstimate)) : 0;
  const totalSessions= sessions.length;
  const avgAccuracy  = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.correctCount / (s.totalQuestions || 1)), 0) / sessions.length * 100)
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Listening History</h1>
            <p className="text-sm text-gray-400 mt-0.5">All your past listening sessions</p>
          </div>
          <button
            onClick={() => navigate("/listening")}
            className="bg-[#7D3CFF] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6B2FE6] transition-colors">
            + New Session
          </button>
        </div>

        {/* Stats row */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Sessions",     value: totalSessions, icon: "📚", sub: "completed" },
              { label: "Avg Band",     value: avgBand,       icon: "📊", sub: "estimate" },
              { label: "Best Band",    value: bestBand || "–", icon: "🏆", sub: "achieved" },
              { label: "Avg Accuracy", value: `${avgAccuracy}%`, icon: "🎯", sub: "correct" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-[#F0E8FF] p-4 text-center">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-2xl font-black text-[#7D3CFF]">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {/* Type filter */}
          <div className="flex gap-1 bg-white border border-[#F0E8FF] rounded-xl p-1">
            {(["all", "practice", "mock"] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                  ${filter === f ? "bg-[#7D3CFF] text-white" : "text-gray-500 hover:text-[#7D3CFF]"}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Part filter */}
          <div className="flex gap-1 bg-white border border-[#F0E8FF] rounded-xl p-1">
            {(["all", 1, 2, 3, 4] as const).map((p) => (
              <button key={p} onClick={() => { setPartFilter(p); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${partFilter === p ? "bg-[#7D3CFF] text-white" : "text-gray-500 hover:text-[#7D3CFF]"}`}>
                {p === "all" ? "All Parts" : `Part ${p}`}
              </button>
            ))}
          </div>
        </div>

        {/* Session list */}
        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#F0E8FF] p-12 text-center">
            <p className="text-4xl mb-4">🎧</p>
            <p className="font-semibold text-[#1a1a2e] mb-2">No sessions yet</p>
            <p className="text-sm text-gray-400 mb-5">Complete a listening session to see your history here.</p>
            <button onClick={() => navigate("/listening")}
              className="bg-[#7D3CFF] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6B2FE6] transition-colors">
              Start Listening
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((s) => {
              const isOpen = expanded === s._id;
              const accuracy = Math.round((s.correctCount / (s.totalQuestions || 1)) * 100);
              return (
                <div key={s._id} className="bg-white rounded-2xl border border-[#F0E8FF] overflow-hidden">
                  {/* Main row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : s._id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[#FAFAFF] transition-colors">

                    {/* Part badge */}
                    <div className={`w-10 h-10 rounded-xl ${PART_COLOR[s.part]} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                      P{s.part}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-[#1a1a2e] text-sm truncate">
                          {s.passageTitle || s.topic || `Part ${s.part} Session`}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[s.difficulty] || "bg-gray-100 text-gray-500"}`}>
                          {s.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.sessionType === "mock" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                          {s.sessionType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{s.accent} · {fmt(s.timeUsedSeconds)}
                      </p>
                    </div>

                    {/* Score ring */}
                    <div className="flex-shrink-0">
                      <ScoreRing correct={s.correctCount} total={s.totalQuestions} />
                    </div>

                    {/* Band */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className={`text-xl font-black ${bandColor(s.bandEstimate)}`}>{s.bandEstimate}</p>
                      <p className="text-xs text-gray-400">band</p>
                    </div>

                    {/* Chevron */}
                    <div className={`text-gray-300 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}>▼</div>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-[#F0E8FF] px-5 py-4 bg-[#FAFAFF]">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                        {[
                          { label: "Accuracy",    value: `${accuracy}%` },
                          { label: "Scaled Score",value: `${s.scaledScore}/40` },
                          { label: "Band",        value: s.bandEstimate },
                          { label: "Time Used",   value: fmt(s.timeUsedSeconds) },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white rounded-xl p-3 text-center border border-[#F0E8FF]">
                            <p className="text-sm font-bold text-[#7D3CFF]">{stat.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {s.feedback && (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {s.feedback.strengths?.length > 0 && (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                              <p className="text-xs font-semibold text-green-700 mb-2">✓ Strengths</p>
                              <ul className="space-y-1">
                                {s.feedback.strengths.slice(0, 2).map((st, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                                    <span className="text-green-500">·</span>{st}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {s.feedback.improvementTips?.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <p className="text-xs font-semibold text-amber-700 mb-2">→ Tips</p>
                              <ul className="space-y-1">
                                {s.feedback.improvementTips.slice(0, 2).map((tip, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                                    <span className="text-amber-500">·</span>{tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => navigate(`/listening/results/${s._id}`)}
                        className="mt-3 text-xs text-[#7D3CFF] font-semibold hover:underline">
                        View Full Results →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-[#F0E8FF] text-sm font-medium text-gray-500 hover:bg-white disabled:opacity-40 transition-colors">
              ← Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-[#F0E8FF] text-sm font-medium text-gray-500 hover:bg-white disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
