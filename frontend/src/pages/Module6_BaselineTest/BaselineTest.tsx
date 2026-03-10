import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Headphones, BookOpen, Edit, Mic, Clock, AlertTriangle, BarChart3, Target, CheckCircle } from "lucide-react";

const BASE_URL = "http://localhost:4000";
const API      = `${BASE_URL}/api/baseline`;
const token    = () => localStorage.getItem("token") ?? "";

type Phase = "loading" | "intro" | "listening" | "reading" | "writing" | "speaking" | "submitting" | "error";

interface Question { questionNumber: number; type: string; prompt: string; options: string[]; }
interface TestData {
  _id: string;
  listening: { title: string; timeLimit: number; questions: Question[]; };
  reading:   { title: string; timeLimit: number; passage: string; questions: Question[]; };
  writing:   { title: string; timeLimit: number; prompt: string; minWords: number; maxWords: number; };
  speaking:  { title: string; timeLimit: number; question: string; responseTime: number; };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

// Countdown timer hook
function useTimer(onDone: () => void) {
  const [secs, setSecs] = useState(0);
  const [on,   setOn]   = useState(false);
  const cb  = useRef(onDone);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  cb.current = onDone;

  const start = useCallback((n: number) => { setSecs(n); setOn(true); }, []);
  const stop  = useCallback(() => { setOn(false); if (ref.current) clearInterval(ref.current); }, []);

  useEffect(() => {
    if (!on) return;
    ref.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { clearInterval(ref.current!); setOn(false); cb.current(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [on]);

  return { secs, start, stop };
}


const STEPS = [
  { key: "listening", label: "Listening", icon: <Headphones className="w-4 h-4" /> },
  { key: "reading",   label: "Reading",   icon: <BookOpen className="w-4 h-4" /> },
  { key: "writing",   label: "Writing",   icon: <Edit className="w-4 h-4" /> },
  { key: "speaking",  label: "Speaking",  icon: <Mic className="w-4 h-4" /> },
] as const;

function ProgressBar({ phase }: { phase: Phase }) {
  const idx = STEPS.findIndex((s) => s.key === phase);
  return (
    <div className="bg-white border-b border-[#F0E8FF] px-4 py-3 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex items-center">
        {STEPS.map((s, i) => {
          const done = idx > i, active = idx === i;
          return (
            <React.Fragment key={s.key}>
              <div className="flex items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? "bg-green-500 text-white" : active ? "bg-[#7D3CFF] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {done ? "✓" : s.icon}
                </div>
                <span className={`text-xs font-medium hidden sm:block
                  ${active ? "text-[#7D3CFF]" : done ? "text-green-600" : "text-gray-400"}`}>
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
<div className={`px-3 py-1.5 rounded-xl font-mono font-bold text-sm flex items-center gap-1
        ${warn ? "bg-red-100 text-red-600" : "bg-[#F0E8FF] text-[#7D3CFF]"}">`}>
        <Clock className="w-4 h-4" /> {fmt(secs)}
      </div>
      <div className="w-24 h-1 bg-gray-200 rounded-full">
        <div className={`h-1 rounded-full transition-all ${warn ? "bg-red-400" : "bg-[#7D3CFF]"}`}
          style={{ width: `${total > 0 ? Math.min((secs / total) * 100, 100) : 0}%` }} />
      </div>
    </div>
  );
}

// ── Question list — defined OUTSIDE main component to prevent remount ──
function QList({ questions, answers, setAnswers }: {
  questions: Question[];
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  return (
    <div className="space-y-4 mb-6">
      {questions.map((q) => (
        <div key={q.questionNumber} className="bg-white rounded-2xl border border-[#F0E8FF] p-4">
          <p className="text-xs font-semibold text-[#7D3CFF] uppercase mb-1">Question {q.questionNumber}</p>
          <p className="text-sm font-medium text-[#1a1a2e] mb-3">{q.prompt}</p>
          {q.options.length > 0 ? (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button key={opt}
                  onClick={() => setAnswers((p) => ({ ...p, [q.questionNumber]: opt }))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                    ${answers[q.questionNumber] === opt
                      ? "border-[#7D3CFF] bg-[#F0E8FF] text-[#7D3CFF]"
                      : "border-gray-100 bg-gray-50 text-gray-700 hover:border-[#7D3CFF]"}`}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input type="text"
              value={answers[q.questionNumber] || ""}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.questionNumber]: e.target.value }))}
              placeholder="Type your answer…"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7D3CFF]" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────
export default function BaselineTest(): React.ReactElement {
  const navigate = useNavigate();
  const [phase,  setPhase]  = useState<Phase>("loading");
  const [test,   setTest]   = useState<TestData | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const [lisAns,   setLisAns]   = useState<Record<number, string>>({});
  const [readAns,  setReadAns]  = useState<Record<number, string>>({});
  const [writeText, setWriteText] = useState("");
  const [speakBlob, setSpeakBlob] = useState<Blob | null>(null);

  // Speaking recording state
  const [recPhase,  setRecPhase]  = useState<"idle" | "recording" | "done">("idle");
  const [recSecs,   setRecSecs]   = useState(0);
  const [micErr,    setMicErr]    = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const streamRef   = useRef<MediaStream | null>(null);
  const recIntRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRef   = useRef(Date.now());
  const lisTotal   = useRef(0);
  const readTotal  = useRef(0);
  const writeTotal = useRef(0);

  // Section timers — each auto-advances on expire
  const lisTimer   = useTimer(() => advanceTo("reading"));
  const readTimer  = useTimer(() => advanceTo("writing"));
  const writeTimer = useTimer(() => advanceTo("speaking"));

  // Load test
  useEffect(() => {
    const cached = sessionStorage.getItem("baseline_test");
    if (cached) {
      try { setTest(JSON.parse(cached)); setPhase("intro"); return; } catch (_) {}
    }
    fetch(`${API}/test`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setTest(d.test); setPhase("intro"); }
        else { setErrMsg(d.message || "Failed to load test."); setPhase("error"); }
      })
      .catch(() => { setErrMsg("Network error loading test."); setPhase("error"); });
  }, []);

  function advanceTo(p: Phase) {
    setPhase(p);
    if (p === "listening") { lisTotal.current = test!.listening.timeLimit; lisTimer.start(test!.listening.timeLimit); }
    if (p === "reading")   { readTotal.current = test!.reading.timeLimit;  readTimer.start(test!.reading.timeLimit); }
    if (p === "writing")   { writeTotal.current = test!.writing.timeLimit; writeTimer.start(test!.writing.timeLimit); }
    if (p === "speaking")  startSpeaking();
  }

  async function startSpeaking() {
    if (!test) return;
    setRecPhase("idle");
    setMicErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg" });
      recorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(250);
      setRecPhase("recording");
      setRecSecs(test.speaking.responseTime);
      recIntRef.current = setInterval(() => {
        setRecSecs((s) => {
          if (s <= 1) { clearInterval(recIntRef.current!); stopSpeaking(); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch {
      setMicErr("Microphone access denied. Please allow microphone access and refresh the page.");
    }
  }

  async function stopSpeaking() {
    clearInterval(recIntRef.current!);
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await new Promise((r) => setTimeout(r, 500));
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    setSpeakBlob(blob);
    setRecPhase("done");
  }

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit() {
    if (!test) return;
    setPhase("submitting");
    const fd = new FormData();
    fd.append("testId",           test._id);
    fd.append("timeUsed",         String(Math.round((Date.now() - startRef.current) / 1000)));
    fd.append("listeningAnswers", JSON.stringify(lisAns));
    fd.append("readingAnswers",   JSON.stringify(readAns));
    fd.append("writingResponse",  writeText);
    if (speakBlob) fd.append("speaking_audio", speakBlob, "speaking.webm");

    try {
      const res  = await fetch(`${API}/submit`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token()}` },
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

  const wordCount = writeText.trim() ? writeText.trim().split(/\s+/).length : 0;

  // ── Phase renders ────────────────────────────────────

  if (phase === "loading") return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF] mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading test…</p>
      </div>
    </div>
  );

  if (phase === "error") return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-red-100 dark:border-red-900">
        <div className="flex justify-center mb-4"><AlertTriangle className="w-10 h-10 text-amber-500" /></div>
        <p className="font-bold text-[#1a1a2e] mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500 mb-5">{errMsg}</p>
        <button onClick={() => navigate("/baseline")} className="bg-[#7D3CFF] text-white px-6 py-2 rounded-xl font-semibold">
          Go Back
        </button>
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
            <BarChart3 className="w-6 h-6 text-[#7D3CFF]" />
          </div>
        </div>
        <p className="text-xl font-bold text-[#1a1a2e] mb-2">Evaluating your results</p>
        <p className="text-sm text-gray-400">This usually takes 20–30 seconds…</p>
      </div>
    </div>
  );

  if (phase === "intro") return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="flex justify-center mb-4"><Target className="w-12 h-12 text-[#7D3CFF]" /></div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-3">Ready to begin</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          4 sections in order — Listening, Reading, Writing, Speaking.<br />
          Each has its own timer. You can submit early on all sections except Speaking.
        </p>
        <button
          onClick={() => { startRef.current = Date.now(); advanceTo("listening"); }}
          className="bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] text-white px-10 py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-200">
          Start Test →
        </button>
      </div>
    </div>
  );

  if (phase === "listening" && test) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <ProgressBar phase={phase} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1a1a2e] flex items-center gap-2"><Headphones className="w-5 h-5 text-[#7D3CFF]" /> Listening</h2>
          <TimerPill secs={lisTimer.secs} total={lisTotal.current} />
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{test.listening.title}</p>
          {/* Audio served from backend — range requests supported, no base64 */}
          <audio
            src={`${BASE_URL}/api/baseline/audio`}
            controls
            className="w-full"
            preload="auto"
          />
          <p className="text-xs text-gray-400 mt-2">Listen carefully, then answer the questions below.</p>
        </div>
        <QList questions={test.listening.questions} answers={lisAns} setAnswers={setLisAns} />
        <button onClick={() => { lisTimer.stop(); advanceTo("reading"); }}
          className="w-full bg-[#7D3CFF] text-white py-3.5 rounded-2xl font-bold hover:bg-[#6B2FE6] transition-colors">
          Next: Reading →
        </button>
      </div>
    </div>
  );

  if (phase === "reading" && test) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <ProgressBar phase={phase} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1a1a2e] flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#7D3CFF]" /> Reading</h2>
          <TimerPill secs={readTimer.secs} total={readTotal.current} />
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{test.reading.title}</p>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto pr-1">
            {test.reading.passage}
          </div>
        </div>
        <QList questions={test.reading.questions} answers={readAns} setAnswers={setReadAns} />
        <button onClick={() => { readTimer.stop(); advanceTo("writing"); }}
          className="w-full bg-[#7D3CFF] text-white py-3.5 rounded-2xl font-bold hover:bg-[#6B2FE6] transition-colors">
          Next: Writing →
        </button>
      </div>
    </div>
  );

  if (phase === "writing" && test) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <ProgressBar phase={phase} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1a1a2e] flex items-center gap-2"><Edit className="w-5 h-5 text-[#7D3CFF]" /> Writing</h2>
          <TimerPill secs={writeTimer.secs} total={writeTotal.current} />
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Task</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{test.writing.prompt}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#1a1a2e]">Your response</p>
            <span className={`text-sm font-bold
              ${wordCount > test.writing.maxWords ? "text-red-500"
              : wordCount >= test.writing.minWords ? "text-green-600"
              : "text-gray-400"}`}>
              {wordCount} / {test.writing.maxWords} words
            </span>
          </div>
          <textarea
            value={writeText}
            onChange={(e) => setWriteText(e.target.value)}
            placeholder="Write your response here…"
            rows={9}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7D3CFF] resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Target: {test.writing.minWords}–{test.writing.maxWords} words</p>
        </div>
        <button
          onClick={() => { writeTimer.stop(); advanceTo("speaking"); }}
          disabled={wordCount < 20}
          className="w-full bg-[#7D3CFF] text-white py-3.5 rounded-2xl font-bold hover:bg-[#6B2FE6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next: Speaking →
        </button>
        {wordCount < 20 && <p className="text-center text-xs text-gray-400 mt-2">Write at least 20 words to continue.</p>}
      </div>
    </div>
  );

  if (phase === "speaking" && test) return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <ProgressBar phase={phase} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-5 flex items-center gap-2"><Mic className="w-5 h-5 text-[#7D3CFF]" /> Speaking</h2>

        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-6 mb-5">
          <p className="text-xs font-semibold text-[#7D3CFF] uppercase tracking-wider mb-2">Your prompt</p>
          <p className="text-base font-medium text-[#1a1a2e] leading-relaxed">{test.speaking.question}</p>
        </div>

        {micErr && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-700 text-center">
            {micErr}
            <button onClick={() => { setMicErr(""); startSpeaking(); }}
              className="block mx-auto mt-2 text-xs underline">Try again</button>
          </div>
        )}

        {recPhase === "idle" && !micErr && (
          <div className="bg-[#F0E8FF] rounded-2xl p-8 text-center">
            <div className="animate-pulse w-4 h-4 bg-[#7D3CFF] rounded-full mx-auto mb-3" />
            <p className="text-[#7D3CFF] font-semibold">Starting recording…</p>
          </div>
        )}

        {recPhase === "recording" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-bold tracking-widest text-sm">RECORDING</span>
            </div>
            <p className="text-6xl font-black text-red-600 mb-2">{fmt(recSecs)}</p>
            <p className="text-xs text-red-400">Recording will stop automatically</p>
          </div>
        )}

        {recPhase === "done" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-3"><CheckCircle className="w-10 h-10 text-green-500" /></div>
            <p className="text-green-700 font-bold text-lg mb-1">Speaking recorded</p>
            <p className="text-sm text-gray-500 mb-6">Your response has been captured.</p>
            <button onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-200">
              Submit & See Results →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return <></>;
}
