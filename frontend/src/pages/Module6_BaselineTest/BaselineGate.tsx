import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";

const API  = "http://localhost:4000/api/baseline";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` });

interface TestData { _id: string; listening: { audioUrl: string | null; [k: string]: unknown }; [k: string]: unknown; }

export default function BaselineGate(): React.ReactElement {
  const navigate = useNavigate();

  const [status,      setStatus]      = useState<"loading" | "pending" | "done">("loading");
  const [result,      setResult]      = useState<{ overallBand: number; skillLabel: string; completedAt: string } | null>(null);
  const [testReady,   setTestReady]   = useState(false);   // audio pre-fetched?
  const [testError,   setTestError]   = useState(false);   // audio failed (non-blocking)
  const prefetchedRef = useRef<TestData | null>(null);

  // ── 1. Check completion status ──
  useEffect(() => {
    fetch(`${API}/status`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => {
        if (d.completed) { setResult(d.result); setStatus("done"); }
        else             { setStatus("pending"); }
      })
      .catch(() => setStatus("pending"));
  }, []);

  // ── 2. Pre-fetch test data in background (small now — no audio in payload) ──
  useEffect(() => {
    if (status !== "pending") return;

    fetch(`${API}/test`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          prefetchedRef.current = d.test;
          // Safe to cache — audio is excluded from this response
          try { sessionStorage.setItem("baseline_test", JSON.stringify(d.test)); } catch (_) {}
          setTestReady(true);
        } else {
          setTestError(true);
          setTestReady(true);
        }
      })
      .catch(() => { setTestError(true); setTestReady(true); });
  }, [status]);

  const handleStart = () => navigate("/baseline/test");

  const sections = [
    { icon: "🎧", label: "Listening", detail: "5 questions · 4 min",  color: "bg-blue-50 border-blue-200 text-blue-700" },
    { icon: "📖", label: "Reading",   detail: "5 questions · 6 min",  color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { icon: "✍️", label: "Writing",   detail: "1 short task · 7 min", color: "bg-amber-50 border-amber-200 text-amber-700" },
    { icon: "🎤", label: "Speaking",  detail: "2 prompts · 5 min",    color: "bg-rose-50 border-rose-200 text-rose-700" },
  ];

  // ── Loading status check ──
  if (status === "loading") return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
    </div>
  );

  // ── Already completed ──
  if (status === "done" && result) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-[#F0E8FF] shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7D3CFF] to-[#F107A3] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Baseline Complete</h1>
          <p className="text-gray-500 mb-6">
            Completed on {new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
          <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-6 text-white mb-6">
            <p className="text-sm opacity-75 uppercase tracking-wider mb-1">Your Baseline Band</p>
            <p className="text-6xl font-bold mb-1">{result.overallBand}</p>
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

  // ── Pending — intro page ──
  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#F0E8FF] text-[#7D3CFF] text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <span>📊</span> One-time assessment
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-3">Let's find your starting point</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            This short IELTS-style test takes <strong>~20 minutes</strong>. It measures your level
            across all 4 skills so we can build a study plan tailored to you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {sections.map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className="font-bold text-base">{s.label}</p>
              <p className="text-xs opacity-75 mt-0.5">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-6">
          <h3 className="font-bold text-[#1a1a2e] mb-3">Before you start</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Find a quiet place — the speaking section uses your microphone.",
              "Each section has its own timer — you can submit early if finished.",
              "You can only take this test once. Results set your starting band.",
              "Honest results give you a better study plan.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#7D3CFF] font-bold mt-0.5">·</span> {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between bg-[#F0E8FF] rounded-2xl px-5 py-3 mb-6">
          <span className="text-sm font-semibold text-[#7D3CFF]">Total estimated time</span>
          <span className="text-sm font-bold text-[#1a1a2e]">~20–25 minutes</span>
        </div>

        {/* Start button — shows subtle loading indicator while audio prefetches */}
        <button
          onClick={handleStart}
          disabled={!testReady}
          className="relative w-full bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {testReady ? "Start Baseline Test →" : (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Preparing test…
            </span>
          )}
        </button>

        {testError && (
          <p className="text-center text-xs text-amber-600 mt-2">
            Audio generation failed — test will still work without it.
          </p>
        )}
        <p className="text-center text-xs text-gray-400 mt-3">
          Make sure your microphone is enabled before starting.
        </p>
      </div>
    </div>
  );
}
