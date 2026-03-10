import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Megaphone, GraduationCap, BookOpen, Headphones, BarChart3, ClipboardList, AlertTriangle } from "lucide-react";
import Header from "../../components/Header";
import { SkeletonStatCard } from "../../components/SkeletonCard";

const API = "http://localhost:4000/api/listening";
function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`, "Content-Type": "application/json" };
}

interface PartState {
  part: number;
  currentDifficulty: string;
  totalSessions: number;
  avgScore: number;
  avgBand: number;
}
interface Weakness { type: string; label: string; hitCount: number; }
interface Progress {
  overallBand: number;
  overallAccuracy: number;
  totalSessions: number;
  totalMockTests: number;
  skillLabel: string;
  partStates: PartState[];
  weaknesses: Weakness[];
  mockAvailable: boolean;
  nextMockDue: string | null;
}

const PART_INFO = [
  { part: 1, label: "Part 1", desc: "Everyday conversation", Icon: MessageCircle, example: "Phone enquiry, booking, registration" },
  { part: 2, label: "Part 2", desc: "Everyday monologue",    Icon: Megaphone, example: "Tour guide, local facility speech" },
  { part: 3, label: "Part 3", desc: "Academic discussion",   Icon: GraduationCap, example: "University tutorial, seminar" },
  { part: 4, label: "Part 4", desc: "Academic lecture",      Icon: BookOpen, example: "University lecture, formal talk" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:     "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  medium:   "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  hard:     "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  advanced: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export default function ListeningHome(): React.ReactElement {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [accent, setAccent] = useState<"american" | "australian">("american");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/progress`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setProgress(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getPartState = (part: number): PartState =>
    progress?.partStates?.find(p => p.part === part) ?? { part, currentDifficulty: "easy", totalSessions: 0, avgScore: 0, avgBand: 0 };

  const handleStartPractice = async () => {
    if (!selectedPart) return;
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch(`${API}/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ part: selectedPart, accent, sessionType: "practice" }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      navigate(`/listening/session/${d.sessionId}`, { state: { session: d } });
    } catch (err: any) {
      setError(err.message || "Failed to generate session. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleStartMock = async () => {
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch(`${API}/mock/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ accent }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      navigate(`/listening/mock/${d.parts[0].sessionId}`, { state: { mockData: d } });
    } catch (err: any) {
      setError(err.message || "Failed to generate mock test. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">Listening Practice</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adaptive IELTS listening — select a part and accent to begin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Part selector + accent ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Part cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PART_INFO.map(({ part, label, desc, Icon, example }) => {
                const ps = getPartState(part);
                const isSelected = selectedPart === part;
                return (
                  <button key={part} onClick={() => setSelectedPart(isSelected ? null : part)}
                    className={`text-left rounded-2xl border-2 p-4 transition-all ${
                      isSelected ? "border-[#7D3CFF] bg-[#F0E8FF] dark:bg-[#7D3CFF]/20 shadow-md scale-[1.02]"
                                 : "border-[#F0E8FF] dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#7D3CFF] hover:shadow-sm"
                    }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#F0E8FF] dark:bg-[#7D3CFF]/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#7D3CFF]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1a1a2e] dark:text-white text-sm">{label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[ps.currentDifficulty]}`}>
                        {ps.currentDifficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-3">{example}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{ps.totalSessions} sessions</span>
                      {ps.avgBand > 0 && <span className="font-semibold text-[#7D3CFF]">Avg Band {ps.avgBand}</span>}
                    </div>
                    {ps.totalSessions > 0 && (
                      <div className="mt-2 w-full h-1 bg-gray-100 rounded-full">
                        <div className="h-1 bg-[#7D3CFF] rounded-full" style={{ width: `${Math.min(ps.avgScore * 100, 100)}%` }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Accent + Start */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#F0E8FF] dark:border-gray-700 p-5">
              <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3">Select Accent</p>
              <div className="flex gap-3 mb-5">
                {(["american", "australian"] as const).map((a) => (
                  <button key={a} onClick={() => setAccent(a)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                      accent === a ? "border-[#7D3CFF] bg-[#7D3CFF] text-white" : "border-[#F0E8FF] dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#7D3CFF]"
                    }`}>
                    {a === "american" ? "US American" : "AU Australian"}
                  </button>
                ))}
              </div>

              {error && <p className="text-sm text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>}

              <button onClick={handleStartPractice} disabled={!selectedPart || generating}
                className="w-full bg-[#7D3CFF] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#6B2FE6] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {generating ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Generating audio...</>
                ) : (
                  <><Headphones className="w-4 h-4" /> Start Practice {selectedPart ? `— Part ${selectedPart}` : ""}</>
                )}
              </button>

              {!selectedPart && <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Select a part above to continue</p>}
            </div>

            {/* Mock test CTA */}
            {progress?.mockAvailable && (
              <div className="bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardList className="w-5 h-5" />
                      <p className="font-bold text-lg">Weekly Mock Test Ready</p>
                    </div>
                    <p className="text-sm opacity-80">8 questions across all 4 parts · tailored to your weak areas</p>
                  </div>
                  <button onClick={handleStartMock} disabled={generating}
                    className="bg-white text-[#7D3CFF] font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 disabled:opacity-50 whitespace-nowrap ml-4">
                    Start Mock
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Progress overview ── */}
          <div className="space-y-4">

            {loading ? (
              <div className="space-y-4">
                <SkeletonStatCard />
                <SkeletonStatCard />
              </div>
            ) : (
              <>
                {/* Overall stats */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#F0E8FF] dark:border-gray-700 p-5">
                  <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-4">Progress Overview</p>
                  <div className="text-center mb-4">
                    <p className="text-5xl font-bold text-[#7D3CFF]">{progress?.overallBand?.toFixed(1) || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average Band</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Accuracy", value: `${progress?.overallAccuracy ?? 0}%` },
                      { label: "Sessions", value: String(progress?.totalSessions ?? 0) },
                      { label: "Mock Tests", value: String(progress?.totalMockTests ?? 0) },
                      { label: "Level", value: progress?.skillLabel || "Beginner" },
                    ].map(s => (
                      <div key={s.label} className="bg-[#F8F9FF] dark:bg-gray-700 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-[#1a1a2e] dark:text-white">{s.value}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weakness tags */}
                {(progress?.weaknesses?.length ?? 0) > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#F0E8FF] dark:border-gray-700 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Focus Areas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {progress!.weaknesses.slice(0, 5).map(w => (
                        <span key={w.type} className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-3 py-1 rounded-full">
                          {w.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next mock */}
                {progress?.nextMockDue && !progress.mockAvailable && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#F0E8FF] dark:border-gray-700 p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next mock test</p>
                    <p className="text-sm font-semibold text-[#7D3CFF]">
                      {new Date(progress.nextMockDue).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}

                {/* Quick links */}
                <div className="flex gap-2">
                  <button onClick={() => navigate("/listening/progress")}
                    className="flex-1 border-2 border-[#F0E8FF] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:border-[#7D3CFF] hover:text-[#7D3CFF] transition-colors flex items-center justify-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Full Progress
                  </button>
                  <button onClick={() => navigate("/listening/history")}
                    className="flex-1 border-2 border-[#F0E8FF] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:border-[#7D3CFF] hover:text-[#7D3CFF] transition-colors flex items-center justify-center gap-2">
                    <ClipboardList className="w-4 h-4" /> History
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
