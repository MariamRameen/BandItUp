import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Headphones, BookOpen, Edit, Mic, BarChart3, CheckCircle } from "lucide-react";

const API  = "http://localhost:4000/api/baseline";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` });

export default function BaselineGate(): React.ReactElement {
  const navigate = useNavigate();
  const [status,    setStatus]    = useState<"loading" | "pending" | "done">("loading");
  const [result,    setResult]    = useState<{ overallBand: number; skillLabel: string; completedAt: string } | null>(null);
  const [testReady, setTestReady] = useState(false);

  // Check completion status
  useEffect(() => {
    fetch(`${API}/status`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => {
        if (d.completed) { setResult(d.result); setStatus("done"); }
        else             { setStatus("pending"); }
      })
      .catch(() => setStatus("pending"));
  }, []);

  // Pre-fetch test structure in background while user reads the intro
  useEffect(() => {
    if (status !== "pending") return;
    fetch(`${API}/test`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          try { sessionStorage.setItem("baseline_test", JSON.stringify(d.test)); } catch (_) {}
        }
        setTestReady(true);
      })
      .catch(() => setTestReady(true));
  }, [status]);

  if (status === "loading") return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
    </div>
  );

  if (status === "done" && result) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-[#F0E8FF] p-8 text-center shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7D3CFF] to-[#F107A3] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Baseline Complete</h1>
          <p className="text-gray-400 text-sm mb-6">
            Completed {new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-6 text-white mb-6">
            <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Your Baseline Band</p>
            <p className="text-6xl font-black mb-1">{result.overallBand}</p>
            <p className="text-sm opacity-75">{result.skillLabel}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/baseline/results")}
              className="flex-1 bg-[#7D3CFF] text-white py-3 rounded-xl font-semibold hover:bg-[#6B2FE6] transition-colors">
              View Full Results
            </button>
            <button onClick={() => navigate("/dashboard")}
              className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Pending — show intro
  const sections = [
    { icon: <Headphones className="w-6 h-6" />, label: "Listening", detail: "5 questions · 4 min",  bg: "bg-blue-50 border-blue-200 text-blue-700" },
    { icon: <BookOpen className="w-6 h-6" />, label: "Reading",   detail: "5 questions · 6 min",  bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { icon: <Edit className="w-6 h-6" />, label: "Writing",   detail: "1 task · 20 min",      bg: "bg-amber-50 border-amber-200 text-amber-700" },
    { icon: <Mic className="w-6 h-6" />, label: "Speaking",  detail: "1 prompt · 3 min",     bg: "bg-rose-50 border-rose-200 text-rose-700" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#F0E8FF] text-[#7D3CFF] text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <BarChart3 className="w-4 h-4" /> One-time assessment
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-3">Let's find your starting point</h1>
          <p className="text-gray-500 leading-relaxed">
            A short IELTS-style test across all 4 skills. Takes about <strong>35 minutes</strong>. 
            Results set your baseline band and generate your personalised study plan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {sections.map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
              <div className="mb-2">{s.icon}</div>
              <p className="font-bold">{s.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-6">
          <h3 className="font-bold text-[#1a1a2e] mb-3">Before you start</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Find a quiet place — speaking section uses your microphone.",
              "Each section has its own timer. You can submit a section early.",
              "Speaking timer runs to completion — you cannot skip it early.",
              "You can only take this test once. Be honest for a better study plan.",
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#7D3CFF] font-bold">·</span> {r}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate("/baseline/test")}
          disabled={!testReady}
          className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {testReady ? "Start Baseline Test →" : (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Preparing test…
            </span>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">Make sure your microphone is enabled before starting.</p>
      </div>
    </div>
  );
}
