import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Headphones, BookOpen, Edit, Mic, ClipboardList } from "lucide-react";

const API   = "http://localhost:4000/api/baseline";
const auth  = () => ({ Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` });

interface SectionResult { band: number; rawScore: number; maxScore: number; feedback: string; details?: Record<string, unknown>; }
interface AnswerDetail  { questionNumber: number; userAnswer: string; isCorrect: boolean; }
interface Result {
  overallBand:  number;
  skillLabel:   string;
  createdAt:    string;
  listening:    SectionResult;
  reading:      SectionResult;
  writing:      SectionResult;
  speaking:     SectionResult;
  diagnosticReport: { strengths: string[]; weaknesses: string[]; advice: string[]; studyPlanSummary: string; };
  listeningAnswers: AnswerDetail[];
  readingAnswers:   AnswerDetail[];
  writingResponse:  string;
  speakingResult:   { transcript: string; gptFeedback: string; };
}

const SECTION_ICONS: Record<string, React.ReactNode> = { 
  listening: <Headphones className="w-4 h-4 inline" />, 
  reading: <BookOpen className="w-4 h-4 inline" />, 
  writing: <Edit className="w-4 h-4 inline" />, 
  speaking: <Mic className="w-4 h-4 inline" /> 
};

function BandBar({ band, label }: { band: number; label: string }) {
  const pct = Math.round((band / 9) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-[#1a1a2e]">{label}</span>
        <span className="text-sm font-bold text-[#7D3CFF]">{band}</span>
      </div>
      <div className="w-full bg-[#F0E8FF] h-2 rounded-full">
        <div className="bg-[#7D3CFF] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BaselineResults(): React.ReactElement {
  const navigate = useNavigate();
  const [result, setResult]   = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"overview" | "sections" | "answers">("overview");

  useEffect(() => {
    fetch(`${API}/result`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setResult(d.result); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
    </div>
  );

  if (!result) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">No results found.</p>
        <button onClick={() => navigate("/baseline")} className="bg-[#7D3CFF] text-white px-6 py-2 rounded-xl">
          Take Baseline Test
        </button>
      </div>
    </div>
  );

  const sections = [
    { key: "listening", label: "Listening", data: result.listening },
    { key: "reading",   label: "Reading",   data: result.reading },
    { key: "writing",   label: "Writing",   data: result.writing },
    { key: "speaking",  label: "Speaking",  data: result.speaking },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-1">Your Baseline Results</h1>
          <p className="text-gray-400 text-sm">
            Completed {new Date(result.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Overall band */}
        <div className="bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] rounded-3xl p-8 text-white text-center mb-6 shadow-lg shadow-purple-200">
          <p className="text-sm opacity-75 uppercase tracking-widest mb-2">Overall Band Score</p>
          <p className="text-8xl font-black mb-2">{result.overallBand}</p>
          <p className="text-xl font-semibold opacity-90">{result.skillLabel}</p>
        </div>

        {/* Score bars */}
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-6 mb-6 space-y-4">
          {sections.map((s) => (
            <BandBar key={s.key} band={s.data?.band ?? 0} label={`${SECTION_ICONS[s.key]} ${s.label}`} />
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F0E8FF] rounded-xl p-1 mb-6">
          {(["overview", "sections", "answers"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all
                ${tab === t ? "bg-white text-[#7D3CFF] shadow-sm" : "text-gray-500 hover:text-[#7D3CFF]"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && result.diagnosticReport && (
          <div className="space-y-4">
            <div className="bg-[#E8FFF3] border border-[#C6FDE7] rounded-2xl p-5">
              <h3 className="font-bold text-green-700 mb-3">✓ Strengths</h3>
              <ul className="space-y-2">
                {result.diagnosticReport.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-green-500">✓</span>{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-[#FFF7EB] border border-[#FFE5C2] rounded-2xl p-5">
              <h3 className="font-bold text-amber-700 mb-3">→ Areas to Improve</h3>
              <ul className="space-y-2">
                {result.diagnosticReport.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-amber-500">→</span>{w}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-[#F0E8FF] rounded-2xl p-5">
              <h3 className="font-bold text-[#1a1a2e] mb-3 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[#7D3CFF]" /> Study Advice</h3>
              <ul className="space-y-2">
                {result.diagnosticReport.advice.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-[#7D3CFF]">·</span>{a}</li>
                ))}
              </ul>
              {result.diagnosticReport.studyPlanSummary && (
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100 leading-relaxed italic">
                  {result.diagnosticReport.studyPlanSummary}
                </p>
              )}
            </div>
            <div className="bg-[#F0F9FF] border border-[#E1F5FE] rounded-2xl p-6 text-center">
              <p className="text-lg font-bold text-[#7D3CFF] mb-2">Your study plan is ready!</p>
              <p className="text-sm text-gray-500 mb-4">We've created a personalised plan based on your results.</p>
              <button onClick={() => navigate("/study-planner")}
                className="bg-[#7D3CFF] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#6B2FE6] transition-colors">
                View My Study Plan →
              </button>
            </div>
          </div>
        )}

        {/* ── SECTIONS TAB ── */}
        {tab === "sections" && (
          <div className="space-y-4">
            {sections.map((s) => (
              <div key={s.key} className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[#1a1a2e]">{SECTION_ICONS[s.key]} {s.label}</h3>
                  <span className="text-xl font-black text-[#7D3CFF]">{s.data?.band ?? "–"}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{s.data?.feedback}</p>
                {s.key === "writing" && (s.data?.details as Record<string, unknown>) && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {["taskAchievement","coherenceCohesion","lexicalResource","grammaticalRange"].map((k) => (
                      <div key={k} className="bg-[#F7F5FF] rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 capitalize mb-1">{k.replace(/([A-Z])/g, " $1")}</p>
                        <p className="font-bold text-[#7D3CFF]">{(s.data?.details as Record<string,number>)?.[k] ?? "–"}</p>
                      </div>
                    ))}
                  </div>
                )}
                {s.key === "speaking" && result.speakingResult?.transcript && (
                  <div className="mt-3 bg-[#F7F5FF] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Transcript</p>
                    <p className="text-sm text-gray-700 italic">"{result.speakingResult.transcript}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ANSWERS TAB ── */}
        {tab === "answers" && (
          <div className="space-y-4">
            {/* Listening answers */}
            <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
              <h3 className="font-bold text-[#1a1a2e] mb-4 flex items-center gap-2"><Headphones className="w-5 h-5 text-[#7D3CFF]" /> Listening Answers</h3>
              <div className="space-y-3">
                {(result.listeningAnswers || []).map((a) => (
                  <div key={a.questionNumber} className={`flex items-center gap-3 p-3 rounded-xl ${a.isCorrect ? "bg-green-50" : "bg-red-50"}`}>
                    <span className={`font-bold text-sm ${a.isCorrect ? "text-green-600" : "text-red-500"}`}>
                      {a.isCorrect ? "✓" : "✗"} Q{a.questionNumber}
                    </span>
                    <span className="text-sm text-gray-700">{a.userAnswer || <em className="text-gray-400">No answer</em>}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading answers */}
            <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
              <h3 className="font-bold text-[#1a1a2e] mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#7D3CFF]" /> Reading Answers</h3>
              <div className="space-y-3">
                {(result.readingAnswers || []).map((a) => (
                  <div key={a.questionNumber} className={`flex items-center gap-3 p-3 rounded-xl ${a.isCorrect ? "bg-green-50" : "bg-red-50"}`}>
                    <span className={`font-bold text-sm ${a.isCorrect ? "text-green-600" : "text-red-500"}`}>
                      {a.isCorrect ? "✓" : "✗"} Q{a.questionNumber}
                    </span>
                    <span className="text-sm text-gray-700">{a.userAnswer || <em className="text-gray-400">No answer</em>}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Writing */}
            {result.writingResponse && (
              <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
                <h3 className="font-bold text-[#1a1a2e] mb-3 flex items-center gap-2"><Edit className="w-5 h-5 text-[#7D3CFF]" /> Your Writing Response</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.writingResponse}</p>
              </div>
            )}

            {/* Speaking */}
            {result.speakingResult?.transcript && (
              <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5">
                <h3 className="font-bold text-[#1a1a2e] mb-3 flex items-center gap-2"><Mic className="w-5 h-5 text-[#7D3CFF]" /> Speaking Transcript</h3>
                <p className="text-sm text-gray-700 italic leading-relaxed">"{result.speakingResult.transcript}"</p>
                {result.speakingResult.gptFeedback && (
                  <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">{result.speakingResult.gptFeedback}</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
