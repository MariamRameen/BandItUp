import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Book, CheckCircle, Target, Flame, Download, PenTool } from "lucide-react";

const API = "http://localhost:4000/api/vocab";

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` };
}


type MasteryStatus = "unseen" | "learning" | "mastered";
type WordFilter = "all" | "mastered" | "learning" | "difficult";

interface Summary {
  totalWordsSeen: number;
  totalMastered: number;
  avgAccuracy: number;
  streak: number;
}

interface BandBreakdown {
  band: number;
  total: number;
  mastered: number;
  seen: number;
  completionPct: number;
}

interface QuizSession {
  bandLevel: number;
  quizBandScore: number;
  mcqScore: number;
  writtenScore: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}

interface WeekData {
  _id: { week: number; year: number };
  count: number;
}

interface WordHistory {
  word: string;
  band: number;
  attempts: number;
  accuracy: number;
  status: MasteryStatus;
  lastReview: string | null;
}

interface ProgressData {
  summary: Summary;
  bandBreakdown: BandBreakdown[];
  recentSessions: QuizSession[];
  weeklyData: WeekData[];
  wordHistory: WordHistory[];
}

// ── Constants ──────────────────────────────────────────
const STATUS_COLORS: Record<MasteryStatus, string> = {
  mastered: "bg-green-100 text-green-700",
  learning: "bg-purple-100 text-purple-700",
  unseen: "bg-gray-100 text-gray-500",
};

const BAND_COLORS: Record<number, string> = {
  6: "bg-blue-500",
  7: "bg-purple-500",
  8: "bg-orange-500",
  9: "bg-red-500",
};

const BAND_TEXT_COLORS: Record<number, string> = {
  6: "text-blue-500",
  7: "text-purple-500",
  8: "text-orange-500",
  9: "text-red-500",
};

// ── Component ──────────────────────────────────────────
export default function VocabProgress(): React.ReactElement {
  const navigate = useNavigate();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [wordFilter, setWordFilter] = useState<WordFilter>("all");

  useEffect(() => {
    fetch(`${API}/progress`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = (): void => {
    if (!data?.wordHistory) return;
    const headers = ["Word", "Band", "Status", "Accuracy (%)", "Attempts", "Last Review"];
    const rows = data.wordHistory.map((w) => [
      w.word, w.band, w.status, w.accuracy, w.attempts,
      w.lastReview ? new Date(w.lastReview).toLocaleDateString() : "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocab-progress-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredWords = (): WordHistory[] => {
    if (!data?.wordHistory) return [];
    switch (wordFilter) {
      case "mastered": return data.wordHistory.filter((x) => x.status === "mastered");
      case "learning": return data.wordHistory.filter((x) => x.status === "learning");
      case "difficult": return data.wordHistory.filter((x) => x.accuracy < 70 && x.attempts > 0);
      default: return data.wordHistory;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
      </div>
    );
  }

  const { summary, bandBreakdown, recentSessions, weeklyData } = data ?? {
    summary: { totalWordsSeen: 0, totalMastered: 0, avgAccuracy: 0, streak: 0 },
    bandBreakdown: [],
    recentSessions: [],
    weeklyData: [],
    wordHistory: [],
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <button onClick={() => navigate("/vocabulary")} className="text-sm text-[#7D3CFF] mb-1 block">← Back to Vocabulary</button>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Vocabulary Progress</h1>
            <p className="text-sm text-gray-500">Track your vocabulary learning journey</p>
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Learned", value: summary.totalWordsSeen, icon: <Book className="w-6 h-6" />, color: "text-[#7D3CFF]" },
            { label: "Mastered", value: summary.totalMastered, icon: <CheckCircle className="w-6 h-6" />, color: "text-green-600" },
            { label: "Avg Accuracy", value: `${summary.avgAccuracy}%`, icon: <Target className="w-6 h-6" />, color: "text-orange-500" },
            { label: "Week Streak", value: summary.streak, icon: <Flame className="w-6 h-6" />, color: "text-red-500" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-4 text-center">
              <div className="flex justify-center mb-1 text-[#7D3CFF]">{card.icon}</div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Band completion */}
          <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-5">
            <h3 className="font-bold text-[#1a1a2e] mb-4">Band-wise Completion</h3>
            <div className="space-y-4">
              {bandBreakdown.map((b) => (
                <div key={b.band}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${BAND_COLORS[b.band] ?? "bg-gray-400"}`} />
                      <span className="text-sm font-medium text-[#1a1a2e]">Band {b.band}{b.band === 6 ? " & Below" : ""}</span>
                    </div>
                    <span className="text-sm text-gray-500">{b.mastered}/{b.total} words</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full">
                    <div className={`h-2.5 rounded-full transition-all ${BAND_COLORS[b.band] ?? "bg-gray-400"}`} style={{ width: `${b.completionPct}%` }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs text-gray-400">{b.seen} seen</span>
                    <span className="text-xs font-medium text-gray-600">{b.completionPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent quizzes */}
          <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-5">
            <h3 className="font-bold text-[#1a1a2e] mb-4">Recent Quiz Performance</h3>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#F8F9FF] rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${s.quizBandScore >= 7.5 ? "bg-green-500" : s.quizBandScore >= 6.5 ? "bg-[#7D3CFF]" : "bg-orange-400"}`}>
                      {s.quizBandScore}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1a2e]">Band {s.bandLevel} Quiz</p>
                      <p className="text-xs text-gray-500">{s.correctAnswers}/{s.totalQuestions} correct · {new Date(s.completedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">MCQ</p>
                      <p className="text-sm font-semibold text-[#7D3CFF]">{s.mcqScore}/{s.totalQuestions - 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-2"><PenTool className="w-10 h-10 text-gray-300" /></div>
                <p className="text-gray-500 text-sm">No quizzes taken yet.</p>
                <button onClick={() => navigate("/vocabulary/quiz", { state: { band: 6 } })} className="mt-3 text-[#7D3CFF] text-sm hover:underline">Take your first quiz →</button>
              </div>
            )}
          </div>
        </div>

        {/* Weekly chart */}
        {weeklyData.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-5 mb-6">
            <h3 className="font-bold text-[#1a1a2e] mb-4">Vocabulary Growth (Last 6 Weeks)</h3>
            <div className="flex items-end gap-3 h-32">
              {weeklyData.slice(-6).map((w, i) => {
                const max = Math.max(...weeklyData.map((x) => x.count), 1);
                const h = Math.max(8, (w.count / max) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs font-medium text-[#7D3CFF]">{w.count}</p>
                    <div className="w-full bg-gradient-to-t from-[#7D3CFF] to-[#9B59B6] rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                    <p className="text-xs text-gray-400">W{w._id?.week}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Word history */}
        <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-[#1a1a2e]">Word History</h3>
            <div className="flex gap-2">
              {(["all", "mastered", "learning", "difficult"] as WordFilter[]).map((f) => (
                <button key={f} onClick={() => setWordFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${wordFilter === f ? "bg-[#7D3CFF] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredWords().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No words in this category yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Word", "Band", "Status", "Accuracy", "Attempts", "Last Review"].map((h) => (
                      <th key={h} className="text-left py-2 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWords().map((w, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-[#F8F9FF]">
                      <td className="py-2.5 font-semibold text-[#7D3CFF]">{w.word}</td>
                      <td className="py-2.5">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-white text-xs font-bold ${BAND_COLORS[w.band] ?? "bg-gray-400"}`}>{w.band}</span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[w.status] ?? STATUS_COLORS.unseen}`}>{w.status}</span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                            <div className={`h-1.5 rounded-full ${w.accuracy >= 80 ? "bg-green-500" : w.accuracy >= 50 ? "bg-orange-400" : "bg-red-400"}`} style={{ width: `${w.accuracy}%` }} />
                          </div>
                          <span className="text-xs text-gray-600">{w.accuracy}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-gray-600">{w.attempts}</td>
                      <td className="py-2.5 text-gray-400 text-xs">{w.lastReview ? new Date(w.lastReview).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
