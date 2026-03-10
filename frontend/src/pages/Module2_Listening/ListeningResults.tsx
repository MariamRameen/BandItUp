import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import { Clock, Lightbulb, Brain, ClipboardList, CheckCircle, AlertTriangle } from "lucide-react";

const API = "http://localhost:4000/api/listening";
function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` };
}

interface Question {
  questionNumber: number;
  type: string;
  prompt: string;
  correctAnswer: any;
  userAnswer: any;
  isCorrect: boolean;
}
interface Feedback {
  strengths: string[];
  weakQuestionTypes: string[];
  listeningIssues: string[];
  improvementTips: string[];
  rawText: string;
}
interface Results {
  sessionId: string;
  correctCount: number;
  totalQuestions: number;
  scaledScore: number;
  bandEstimate: number;
  scoreRatio: number;
  autoSubmitted: boolean;
  feedback: Feedback;
  questions: Question[];
  currentDifficulty: string;
  mockAvailable: boolean;
}

function bandColor(band: number): string {
  if (band >= 8)  return "from-green-500 to-emerald-400";
  if (band >= 7)  return "from-[#7D3CFF] to-[#9B59B6]";
  if (band >= 6)  return "from-blue-500 to-blue-400";
  if (band >= 5)  return "from-yellow-500 to-orange-400";
  return "from-red-500 to-orange-500";
}

export default function ListeningResults(): React.ReactElement {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();

  const rawState = (location.state as any)?.results ?? null;

  // Safely map API response to Results interface
  const mapResults = (d: any): Results | null => {
    if (!d) return null;
    return {
      sessionId:       d.sessionId   ?? d._id ?? "",
      correctCount:    d.correctCount  ?? 0,
      totalQuestions:  d.totalQuestions ?? 0,
      scaledScore:     d.scaledScore   ?? 0,
      bandEstimate:    d.bandEstimate  ?? 0,
      scoreRatio:      d.scoreRatio    ?? (d.correctCount && d.totalQuestions ? d.correctCount / d.totalQuestions : 0),
      autoSubmitted:   d.autoSubmitted ?? false,
      feedback:        d.feedback      ?? { strengths: [], weakQuestionTypes: [], listeningIssues: [], improvementTips: [], rawText: "" },
      questions:       d.questions     ?? [],
      currentDifficulty: d.currentDifficulty ?? "",
      mockAvailable:   d.mockAvailable ?? false,
    };
  };

  const [results, setResults] = useState<Results | null>(mapResults(rawState));
  const [loading, setLoading] = useState(!results);
  const [activeTab, setActiveTab] = useState<"feedback" | "review">("feedback");

  useEffect(() => {
    if (!results && sessionId) {
      fetch(`${API}/session/${sessionId}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => {
          if (d.success) setResults(mapResults(d.session));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7D3CFF]" />
    </div>
  );
  if (!results) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <p className="text-gray-500">Results not found.</p>
    </div>
  );

  const pct = Math.round(results.scoreRatio * 100);

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

        {/* Band hero */}
        <div className={`bg-gradient-to-r ${bandColor(results.bandEstimate)} rounded-3xl p-6 text-white text-center mb-6 shadow-lg`}>
          {results.autoSubmitted && (
            <p className="text-xs bg-white/20 rounded-full px-3 py-1 inline-flex items-center gap-1 mb-3"><Clock className="w-3 h-3" /> Auto-submitted on time</p>
          )}
          <p className="text-sm opacity-80 uppercase tracking-widest mb-1">Estimated Band</p>
          <p className="text-7xl font-bold mb-1">{results.bandEstimate}</p>
          <p className="text-sm opacity-70">
            {results.correctCount}/{results.totalQuestions} correct · Scaled score: {results.scaledScore}/40
          </p>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "Correct", value: `${results.correctCount}/${results.totalQuestions}` },
            { label: "Accuracy", value: `${pct}%` },
            { label: "Scaled (40)", value: String(results.scaledScore) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#F0E8FF] p-4 text-center">
              <p className="text-2xl font-bold text-[#7D3CFF]">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["feedback", "review"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-[#7D3CFF] text-white" : "bg-white border border-[#F0E8FF] text-gray-600 hover:border-[#7D3CFF]"
              }`}>
              {tab === "feedback" ? <><Brain className="w-4 h-4 inline mr-1" /> AI Feedback</> : <><ClipboardList className="w-4 h-4 inline mr-1" /> Review Answers</>}
            </button>
          ))}
        </div>

        {/* Feedback tab */}
        {activeTab === "feedback" && results.feedback && (
          <div className="space-y-4">
            {results.feedback.rawText && (
              <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
                <p className="text-sm text-gray-700 italic">"{results.feedback.rawText}"</p>
              </div>
            )}

            {results.feedback.strengths?.length > 0 && (
              <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
                <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Strengths</p>
                <ul className="space-y-1">
                  {results.feedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-green-700 flex gap-2"><span>·</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.feedback.listeningIssues?.length > 0 && (
              <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5">
                <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Areas to Work On</p>
                <div className="flex flex-wrap gap-2">
                  {results.feedback.listeningIssues.map((issue, i) => (
                    <span key={i} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                      {issue.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.feedback.improvementTips?.length > 0 && (
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
                <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Improvement Tips</p>
                <ul className="space-y-2">
                  {results.feedback.improvementTips.map((tip, i) => (
                    <li key={i} className="text-sm text-blue-700 flex gap-2"><span>→</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Review tab */}
        {activeTab === "review" && (
          <div className="space-y-3">
            {results.questions.map((q, i) => (
              <div key={i} className={`bg-white rounded-2xl border-2 p-4 ${q.isCorrect ? "border-green-200" : "border-red-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-[#1a1a2e] flex-1 pr-2">{i + 1}. {q.prompt}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {q.isCorrect ? "✓ Correct" : "✗ Wrong"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-xl p-2">
                    <p className="text-gray-400 mb-0.5">Your answer</p>
                    <p className={`font-medium ${q.isCorrect ? "text-green-700" : "text-red-600"}`}>
                      {q.userAnswer
                        ? (typeof q.userAnswer === "object" ? JSON.stringify(q.userAnswer) : String(q.userAnswer))
                        : "(no answer)"}
                    </p>
                  </div>
                  {!q.isCorrect && (
                    <div className="bg-green-50 rounded-xl p-2">
                      <p className="text-gray-400 mb-0.5">Correct answer</p>
                      <p className="font-medium text-green-700">
                        {typeof q.correctAnswer === "object" ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate("/listening")}
            className="flex-1 bg-[#7D3CFF] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#6B2FE6] transition-colors">
            Practice Again
          </button>
          <button onClick={() => navigate("/listening/progress")}
            className="flex-1 border-2 border-[#F0E8FF] text-gray-600 py-3 rounded-xl font-semibold text-sm hover:border-[#7D3CFF] hover:text-[#7D3CFF] transition-colors">
            View Progress
          </button>
        </div>

        {results.mockAvailable && (
          <div className="mt-3 bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] rounded-2xl p-4 text-white text-center">
            <p className="font-semibold mb-1 flex items-center justify-center gap-2"><ClipboardList className="w-5 h-5" /> Your weekly mock test is ready!</p>
            <button onClick={() => navigate("/listening")}
              className="text-sm bg-white/20 hover:bg-white/30 px-5 py-2 rounded-xl font-medium transition-colors">
              Go to Listening Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
