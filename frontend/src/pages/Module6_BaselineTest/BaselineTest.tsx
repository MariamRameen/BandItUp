import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";

const API = "http://localhost:4000/api/baseline";
const token = () => localStorage.getItem("token") ?? "";

type Phase = "loading" | "intro" | "listening" | "reading" | "writing" | "speaking" | "submitting" | "error";
type Section = "listening" | "reading" | "writing" | "speaking";

interface Question       { questionNumber: number; type: string; prompt: string; options: string[]; }
interface SpeakingPrompt { promptNumber: number; type: string; title: string; question: string; prepTime: number; responseTime: number; guidance: string; }
interface TestData {
  _id: string;
  listening: { title: string; timeLimit: number; questions: Question[]; };
  reading:   { title: string; timeLimit: number; passage: string; questions: Question[]; };
  writing:   { title: string; timeLimit: number; prompt: string; minWords: number; maxWords: number; };
  speaking:  { title: string; timeLimit: number; prompts: SpeakingPrompt[]; };
}
interface SpeakingBlob { promptNumber: number; promptType: string; question: string; blob: Blob; }

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── Countdown hook ────────────────────────────────────────
function useCountdown(onExpire: () => void) {
  const [secs,   setSecs]   = useState(0);
  const [active, setActive] = useState(false);
  const cbRef               = useRef(onExpire);
  const intRef              = useRef<ReturnType<typeof setInterval> | null>(null);
  cbRef.current = onExpire;

  const start = useCallback((initial: number) => {
    setSecs(initial);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    if (intRef.current) clearInterval(intRef.current);
  }, []);

  useEffect(() => {
    if (!active) return;
    intRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { clearInterval(intRef.current!); setActive(false); cbRef.current(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intRef.current!);
  }, [active]);

  return { secs, start, stop };
}

// ── Progress bar ──────────────────────────────────────────
const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "listening", label: "Listening", icon: "🎧" },
  { key: "reading",   label: "Reading",   icon: "📖" },
  { key: "writing",   label: "Writing",   icon: "✍️" },
  { key: "speaking",  label: "Speaking",  icon: "🎤" },
];
const SECTION_ORDER: Section[] = ["listening", "reading", "writing", "speaking"];

function ProgressBar({ phase }: { phase: Phase }) {
  const idx = SECTION_ORDER.indexOf(phase as Section);
  return (
    <div className="bg-white border-b border-[#F0E8FF] px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center">
        {SECTIONS.map((s, i) => {
          const done = idx > i, active = idx === i;
          return (
            <React.Fragment key={s.key}>
              <div className="flex items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? "bg-green-500 text-white" : active ? "bg-[#7D3CFF] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {done ? "✓" : s.icon}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? "text-[#7D3CFF]" : done ? "text-green-600" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-2 rounded ${done ? "bg-green-400" : "bg-gray-200"}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function TimerPill({ secs, total }: { secs: number; total: number }) {
  const warn = secs < 60;
  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`px-4 py-1.5 rounded-xl font-mono font-bold text-sm ${warn ? "bg-red-100 text-red-600" : "bg-[#F0E8FF] text-[#7D3CFF]"}`}>
        ⏱ {formatTime(secs)}
      </div>
      <div className="w-28 h-1 bg-gray-200 rounded-full">
        <div className={`h-1 rounded-full transition-all ${warn ? "bg-red-400" : "bg-[#7D3CFF]"}`}
          style={{ width: `${total > 0 ? (secs / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function BaselineTest(): React.ReactElement {
  const navigate = useNavigate();

  const [phase,  setPhase]  = useState<Phase>("loading");
  const [test,   setTest]   = useState<TestData | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const [listeningAnswers, setListeningAnswers] = useState<Record<number, string>>({});
  const [readingAnswers,   setReadingAnswers]   = useState<Record<number, string>>({});
  const [writingResponse,  setWritingResponse]  = useState("");
  const [speakingBlobs,    setSpeakingBlobs]    = useState<SpeakingBlob[]>([]);

  // Speaking state
  const [promptIdx,     setPromptIdx]     = useState(0);
  const [speakPhase,    setSpeakPhase]    = useState<"prep" | "recording" | "saved">("prep");
  const [prepSecs,      setPrepSecs]      = useState(0);
  const [recSecs,       setRecSecs]       = useState(0);
  const [micError,      setMicError]      = useState("");

  const recorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const streamRef    = useRef<MediaStream | null>(null);
  const prepIntRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const recIntRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef     = useRef(Date.now());
  const listenTotal  = useRef(0);
  const readTotal    = useRef(0);
  const writeTotal   = useRef(0);

  // Timers
  const goReading  = useCallback(() => { setPhase("reading");  readTotal.current  = test?.reading.timeLimit   ?? 360; readTimer.start(test?.reading.timeLimit   ?? 360); }, [test]);
  const goWriting  = useCallback(() => { setPhase("writing");  writeTotal.current = test?.writing.timeLimit   ?? 420; writeTimer.start(test?.writing.timeLimit   ?? 420); }, [test]);
  const goSpeaking = useCallback(() => { setPhase("speaking"); beginPrompt(0); }, [test]);

  const listenTimer = useCountdown(goReading);
  const readTimer   = useCountdown(goWriting);
  const writeTimer  = useCountdown(goSpeaking);

  // ── Load test from sessionStorage (pre-fetched by gate page) ──
  useEffect(() => {
    const cached = sessionStorage.getItem("baseline_test");
    if (cached) {
      try { setTest(JSON.parse(cached)); setPhase("intro"); return; } catch (_) {}
    }
    // Fallback fetch
    fetch(`${API}/test`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setTest(d.test); setPhase("intro"); } else { setErrMsg(d.message); setPhase("error"); } })
      .catch(() => { setErrMsg("Network error."); setPhase("error"); });
  }, []);

  function goNext(section: Phase) {
    setPhase(section);
    if (section === "listening") { listenTotal.current = test!.listening.timeLimit; listenTimer.start(test!.listening.timeLimit); }
    if (section === "reading")   { readTotal.current   = test!.reading.timeLimit;   readTimer.start(test!.reading.timeLimit); }
    if (section === "writing")   { writeTotal.current  = test!.writing.timeLimit;   writeTimer.start(test!.writing.timeLimit); }
    if (section === "speaking")  beginPrompt(0);
  }

  // ── Speaking: prep → record → save blob → next prompt ──
  function beginPrompt(idx: number) {
    const p = test!.speaking.prompts[idx];
    setPromptIdx(idx);
    setSpeakPhase("prep");
    setMicError("");
    chunksRef.current = [];

    if (p.prepTime > 0) {
      setPrepSecs(p.prepTime);
      prepIntRef.current = setInterval(() => {
        setPrepSecs((s) => { if (s <= 1) { clearInterval(prepIntRef.current!); startRec(p, idx); return 0; } return s - 1; });
      }, 1000);
    } else {
      startRec(p, idx);
    }
  }

  async function startRec(p: SpeakingPrompt, idx: number) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(250);
      setSpeakPhase("recording");
      setRecSecs(p.responseTime);
      recIntRef.current = setInterval(() => {
        setRecSecs((s) => { if (s <= 1) { clearInterval(recIntRef.current!); finishRec(p, idx); return 0; } return s - 1; });
      }, 1000);
    } catch {
      setMicError("Microphone access denied. Please allow microphone and refresh.");
    }
  }

  async function finishRec(p: SpeakingPrompt, idx: number) {
    clearInterval(recIntRef.current!);
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await new Promise((r) => setTimeout(r, 400)); // flush chunks

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    setSpeakingBlobs((prev) => [...prev, { promptNumber: p.promptNumber, promptType: p.type, question: p.question, blob }]);
    setSpeakPhase("saved");

    const next = idx + 1;
    if (next < test!.speaking.prompts.length) setTimeout(() => beginPrompt(next), 1200);
  }

  function stopEarly() {
    clearInterval(recIntRef.current!);
    finishRec(test!.speaking.prompts[promptIdx], promptIdx);
  }

  // ── Submit as FormData — no base64 JSON, no PayloadTooLarge ──
  async function handleSubmit() {
    if (!test) return;
    setPhase("submitting");

    const fd = new FormData();
    fd.append("testId",           test._id);
    fd.append("timeUsed",         String(Math.round((Date.now() - startRef.current) / 1000)));
    fd.append("listeningAnswers", JSON.stringify(listeningAnswers));
    fd.append("readingAnswers",   JSON.stringify(readingAnswers));
    fd.append("writingResponse",  writingResponse);

    // Speaking meta (prompt info without the blob)
    const meta = speakingBlobs.map(({ promptNumber, promptType, question }) => ({ promptNumber, promptType, question }));
    fd.append("speakingMeta", JSON.stringify(meta));

    // Attach each audio blob as a real file
    speakingBlobs.forEach(({ promptNumber, blob }) => {
      fd.append(`speaking_${promptNumber}`, blob, `speaking_${promptNumber}.webm`);
    });

    try {
      const res  = await fetch(`${API}/submit`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token()}` }, // NO Content-Type — browser sets multipart boundary
        body:    fd,
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.removeItem("baseline_test");
        navigate("/baseline/results");
      } else {
        setErrMsg(data.message || "Submission failed.");
        setPhase("error");
      }
    } catch {
      setErrMsg("Network error during submission.");
      setPhase("error");
    }
  }

  const wordCount    = writingResponse.trim() ? writingResponse.trim().split(/\s+/).length : 0;
  const allSpeakDone = test ? speakingBlobs.length >= test.speaking.prompts.length : false;

  // ── Renders ───────────────────────────────────────────────

  if (phase === "loading") return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF] mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading test…</p>
      </div>
    </div>
  );

  if (phase === "error") return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center border border-red-100">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="font-semibold text-[#1a1a2e] mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500 mb-4">{errMsg}</p>
        <button onClick={() => navigate("/baseline")} className="bg-[#7D3CFF] text-white px-6 py-2 rounded-xl">Go Back</button>
      </div>
    </div>
  );

  if (phase === "submitting") return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-[#F0E8FF]" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#7D3CFF] border-r-[#F107A3] animate-spin" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#7D3CFF]/10 to-[#F107A3]/10 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
        </div>
        <p className="text-xl font-bold text-[#1a1a2e] mb-2">Evaluating your results</p>
        <p className="text-sm text-gray-400">This usually takes 20–30 seconds</p>
      </div>
    </div>
  );

  if (phase === "intro") return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-5xl mb-4">🎯</p>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-3">Test ready. Let's begin.</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          4 sections in order. Each has its own timer. You can finish a section early — but you can't go back.
        </p>
        <button
          onClick={() => { startRef.current = Date.now(); goNext("listening"); }}
          className="bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] text-white px-10 py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-200">
          Start Section 1: Listening →
        </button>
      </div>
    </div>
  );

  // ── LISTENING ──────────────────────────────────────────
  if (phase === "listening" && test) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <ProgressBar phase={phase} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1a1a2e]">🎧 Listening</h2>
          <TimerPill secs={listenTimer.secs} total={listenTotal.current} />
        </div>

        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{test.listening.title}</p>
          {/* Audio streams directly from backend — no base64, no size issues */}
          <audio
            src={`${API.replace("/api/baseline", "")}/api/baseline/audio`}
            controls
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-2">Listen carefully and answer the questions below.</p>
        </div>

        <div className="space-y-4 mb-6">
          {test.listening.questions.map((q) => (
            <div key={q.questionNumber} className="bg-white rounded-2xl border border-[#F0E8FF] p-4">
              <p className="text-xs font-semibold text-[#7D3CFF] uppercase mb-1">Question {q.questionNumber}</p>
              <p className="text-sm font-medium text-[#1a1a2e] mb-3">{q.prompt}</p>
              {q.options.length > 0 ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button key={opt}
                      onClick={() => setListeningAnswers((p) => ({ ...p, [q.questionNumber]: opt }))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${listeningAnswers[q.questionNumber] === opt
                          ? "border-[#7D3CFF] bg-[#F0E8FF] text-[#7D3CFF]"
                          : "border-gray-100 bg-gray-50 text-gray-700 hover:border-[#7D3CFF]"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input type="text" value={listeningAnswers[q.questionNumber] || ""}
                  onChange={(e) => setListeningAnswers((p) => ({ ...p, [q.questionNumber]: e.target.value }))}
                  placeholder="Type your answer…"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7D3CFF]" />
              )}
            </div>
          ))}
        </div>

        <button onClick={() => { listenTimer.stop(); goNext("reading"); }}
          className="w-full bg-[#7D3CFF] text-white py-3.5 rounded-2xl font-bold hover:bg-[#6B2FE6] transition-colors">
          Next: Reading →
        </button>
      </div>
    </div>
  );

  // ── READING ────────────────────────────────────────────
  if (phase === "reading" && test) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <ProgressBar phase={phase} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1a1a2e]">📖 Reading</h2>
          <TimerPill secs={readTimer.secs} total={readTotal.current} />
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{test.reading.title}</p>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
            {test.reading.passage}
          </div>
        </div>
        <div className="space-y-4 mb-6">
          {test.reading.questions.map((q) => (
            <div key={q.questionNumber} className="bg-white rounded-2xl border border-[#F0E8FF] p-4">
              <p className="text-xs font-semibold text-[#7D3CFF] uppercase mb-1">Question {q.questionNumber}</p>
              <p className="text-sm font-medium text-[#1a1a2e] mb-3">{q.prompt}</p>
              {q.options.length > 0 ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button key={opt}
                      onClick={() => setReadingAnswers((p) => ({ ...p, [q.questionNumber]: opt }))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${readingAnswers[q.questionNumber] === opt
                          ? "border-[#7D3CFF] bg-[#F0E8FF] text-[#7D3CFF]"
                          : "border-gray-100 bg-gray-50 text-gray-700 hover:border-[#7D3CFF]"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input type="text" value={readingAnswers[q.questionNumber] || ""}
                  onChange={(e) => setReadingAnswers((p) => ({ ...p, [q.questionNumber]: e.target.value }))}
                  placeholder="Type your answer…"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7D3CFF]" />
              )}
            </div>
          ))}
        </div>
        <button onClick={() => { readTimer.stop(); goNext("writing"); }}
          className="w-full bg-[#7D3CFF] text-white py-3.5 rounded-2xl font-bold hover:bg-[#6B2FE6] transition-colors">
          Next: Writing →
        </button>
      </div>
    </div>
  );

  // ── WRITING ────────────────────────────────────────────
  if (phase === "writing" && test) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <ProgressBar phase={phase} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1a1a2e]">✍️ Writing</h2>
          <TimerPill secs={writeTimer.secs} total={writeTotal.current} />
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Task</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{test.writing.prompt}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#1a1a2e]">Your response</p>
            <span className={`text-sm font-bold ${wordCount > test.writing.maxWords ? "text-red-500" : wordCount >= test.writing.minWords ? "text-green-600" : "text-gray-400"}`}>
              {wordCount} / {test.writing.maxWords} words
            </span>
          </div>
          <textarea value={writingResponse} onChange={(e) => setWritingResponse(e.target.value)}
            placeholder="Write your paragraph here…" rows={8}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7D3CFF] resize-none" />
          <p className="text-xs text-gray-400 mt-1">Target: {test.writing.minWords}–{test.writing.maxWords} words</p>
        </div>
        <button onClick={() => { writeTimer.stop(); goNext("speaking"); }} disabled={wordCount < 10}
          className="w-full bg-[#7D3CFF] text-white py-3.5 rounded-2xl font-bold hover:bg-[#6B2FE6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next: Speaking →
        </button>
        {wordCount < 10 && <p className="text-center text-xs text-gray-400 mt-2">Write at least 10 words to continue.</p>}
      </div>
    </div>
  );

  // ── SPEAKING ───────────────────────────────────────────
  if (phase === "speaking" && test) {
    const prompt = test.speaking.prompts[promptIdx];
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <ProgressBar phase={phase} />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-5">🎤 Speaking</h2>

          {/* Prompt dots */}
          <div className="flex gap-2 mb-5">
            {test.speaking.prompts.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all
                ${i < speakingBlobs.length ? "bg-green-400" : i === promptIdx ? "bg-[#7D3CFF]" : "bg-gray-200"}`} />
            ))}
          </div>

          {allSpeakDone ? (
            <div className="bg-white rounded-2xl border border-[#F0E8FF] p-8 text-center">
              <p className="text-4xl mb-3">✅</p>
              <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">All prompts recorded</h3>
              <p className="text-sm text-gray-500 mb-6">Submit now to receive your results.</p>
              <button onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-200">
                Submit & See Results →
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-[#F0E8FF] p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold bg-[#F0E8FF] text-[#7D3CFF] px-3 py-1 rounded-full uppercase">
                    {prompt.type === "part1" ? "Part 1" : "Part 2 — Long Turn"}
                  </span>
                  <span className="text-xs text-gray-400">{prompt.title}</span>
                </div>
                <p className="text-base font-medium text-[#1a1a2e] leading-relaxed mb-3">{prompt.question}</p>
                <p className="text-xs text-gray-400 italic">{prompt.guidance}</p>
              </div>

              {speakPhase === "prep" && prompt.prepTime > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Preparation Time</p>
                  <p className="text-5xl font-black text-amber-600 mb-1">{prepSecs}s</p>
                  <p className="text-sm text-amber-700">Make notes if needed</p>
                </div>
              )}

              {speakPhase === "recording" && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-600 font-bold text-sm tracking-widest">RECORDING</span>
                  </div>
                  <p className="text-5xl font-black text-red-600 mb-5">{formatTime(recSecs)}</p>
                  <button onClick={stopEarly}
                    className="bg-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors">
                    ⏹ Done Speaking
                  </button>
                </div>
              )}

              {speakPhase === "saved" && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                  <p className="text-green-700 font-semibold mb-1">✅ Response saved</p>
                  <p className="text-xs text-gray-400">
                    {promptIdx + 1 < test.speaking.prompts.length ? "Moving to next prompt…" : "Ready to submit."}
                  </p>
                </div>
              )}

              {micError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-3 text-center text-sm text-red-700">
                  {micError}
                </div>
              )}
            </>
          )}

          {!allSpeakDone && speakPhase !== "recording" && (
            <button onClick={handleSubmit}
              className="w-full mt-4 text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
              Skip speaking & submit anyway
            </button>
          )}
        </div>
      </div>
    );
  }

  return <></>;
}
