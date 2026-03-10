import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import { AlertTriangle, CheckSquare, Link, FileText, BookOpen, ClipboardList, Headphones } from "lucide-react";

const API = "http://localhost:4000/api/listening";
const LS_KEY = (id: string) => `listening_session_${id}`;

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    "Content-Type": "application/json",
  };
}

interface MatchingPair { label: string; options: string[]; }
interface Question {
  questionNumber: number;
  type: "multiple_choice" | "form_completion" | "matching";
  prompt: string;
  options?: string[];
  matchingPairs?: MatchingPair[];
  correctAnswer?: any;
  userAnswer?: any;
  isCorrect?: boolean;
}
interface SessionData {
  sessionId: string;
  part: number;
  accent: string;
  difficulty: string;
  sessionType: string;
  passageTitle: string;
  topic: string;
  passageText: string;
  audioUrl: string | null;
  audioDuration: number;
  maxReplays: number;
  timeLimitSeconds: number;
  totalQuestions: number;
  questions: Question[];
}
type Answers = Record<number, any>;

// ── Two phases only (real computer-based IELTS) ──
// "reading"  → 30s to read questions before audio, inputs locked
// "active"   → audio auto-plays + answer simultaneously, inputs open
//              when audio ends → 30s review buffer starts, unanswered highlighted
type Phase = "reading" | "active";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:     "bg-green-100 text-green-700",
  medium:   "bg-yellow-100 text-yellow-700",
  hard:     "bg-orange-100 text-orange-700",
  advanced: "bg-red-100 text-red-700",
};

function formatTime(secs: number): string {
  const m = Math.floor(Math.max(secs, 0) / 60);
  const s = Math.max(secs, 0) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isAnswered(val: any): boolean {
  if (val === null || val === undefined || val === "") return false;
  if (typeof val === "object" && Object.keys(val).length === 0) return false;
  return true;
}

export default function ListeningSession(): React.ReactElement {
  const navigate   = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const location   = useLocation();

  const [session, setSession] = useState<SessionData | null>(
    (location.state as any)?.session ?? null
  );
  const [answers,        setAnswers]        = useState<Answers>({});
  const [currentQ,       setCurrentQ]       = useState(0);
  const [phase,          setPhase]          = useState<Phase>("reading");
  const [readingLeft,    setReadingLeft]    = useState(30);
  const [timeLeft,       setTimeLeft]       = useState(0);
  const [audioPlaying,   setAudioPlaying]   = useState(false);
  const [audioEnded,     setAudioEnded]     = useState(false);
  const [reviewLeft,     setReviewLeft]     = useState<number | null>(null); // 30s buffer after audio
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [loadingSession, setLoadingSession] = useState(!session);
  const [showTranscript, setShowTranscript] = useState(false);

  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const mainTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const readingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reviewTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitCalledRef = useRef(false);

  // ── Load session ──
  useEffect(() => {
    if (!session && sessionId) {
      fetch(`${API}/session/${sessionId}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => { if (d.success) setSession(d.session); })
        .catch(console.error)
        .finally(() => setLoadingSession(false));
    } else {
      setLoadingSession(false);
    }
  }, [sessionId]);

  // ── Restore localStorage ──
  useEffect(() => {
    if (!session || !sessionId) return;
    const saved = localStorage.getItem(LS_KEY(sessionId));
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.answers)  setAnswers(p.answers);
        if (p.currentQ !== undefined) setCurrentQ(p.currentQ);
      } catch {}
    }
    setTimeLeft(session.timeLimitSeconds);
  }, [session, sessionId]);

  // ── Persist answers ──
  useEffect(() => {
    if (!sessionId || !session) return;
    localStorage.setItem(LS_KEY(sessionId), JSON.stringify({ answers, currentQ, savedAt: Date.now() }));
  }, [answers, currentQ]);

  // ── Submit ──
  const handleSubmit = useCallback(async (auto = false) => {
    if (submitCalledRef.current || submitted) return;
    submitCalledRef.current = true;
    setSubmitting(true);
    [mainTimerRef, readingTimerRef, reviewTimerRef].forEach(r => {
      if (r.current) clearInterval(r.current);
    });

    const payload = {
      answers: session!.questions.map(q => ({
        questionNumber: q.questionNumber,
        userAnswer: answers[q.questionNumber] ?? null,
      })),
      timeUsed: session!.timeLimitSeconds - timeLeft,
      autoSubmitted: auto,
    };

    try {
      const r = await fetch(`${API}/submit/${sessionId}`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.success) {
        localStorage.removeItem(LS_KEY(sessionId!));
        setSubmitted(true);
        navigate(`/listening/results/${sessionId}`, { state: { results: d } });
      }
    } catch {
      localStorage.setItem(`listening_pending_${sessionId}`, JSON.stringify({ sessionId, payload }));
      setSubmitting(false);
      submitCalledRef.current = false;
    }
  }, [answers, session, sessionId, timeLeft, submitted, navigate]);

  // ── Reading phase countdown (30s) ──
  useEffect(() => {
    if (phase !== "reading" || !session || loadingSession) return;
    readingTimerRef.current = setInterval(() => {
      setReadingLeft(prev => {
        if (prev <= 1) {
          clearInterval(readingTimerRef.current!);
          setPhase("active");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (readingTimerRef.current) clearInterval(readingTimerRef.current); };
  }, [phase, session, loadingSession]);

  // ── Active phase: auto-play audio + start main timer ──
  useEffect(() => {
    if (phase !== "active" || !session) return;

    // Auto-play
    if (audioRef.current && session.audioUrl) {
      audioRef.current.play()
        .then(() => setAudioPlaying(true))
        .catch(console.error);
    }

    // Main countdown timer
    setTimeLeft(session.timeLimitSeconds);
    mainTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(mainTimerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (mainTimerRef.current) clearInterval(mainTimerRef.current); };
  }, [phase]);

  // ── Audio ended → start 30s review buffer ──
  const handleAudioEnded = useCallback(() => {
    setAudioPlaying(false);
    setAudioEnded(true);
    setReviewLeft(30);
    reviewTimerRef.current = setInterval(() => {
      setReviewLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(reviewTimerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleSubmit]);

  // ── Online sync ──
  useEffect(() => {
    const sync = async () => {
      const key = `listening_pending_${sessionId}`;
      const pending = localStorage.getItem(key);
      if (!pending) return;
      try {
        const { payload } = JSON.parse(pending);
        const r = await fetch(`${API}/submit/${sessionId}`, {
          method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (d.success) {
          localStorage.removeItem(key);
          navigate(`/listening/results/${sessionId}`, { state: { results: d } });
        }
      } catch {}
    };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [sessionId]);

  if (loadingSession) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7D3CFF]" />
    </div>
  );
  if (!session) return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
      <p className="text-gray-500">Session not found.</p>
    </div>
  );

  const q            = session.questions[currentQ];
  const isMock       = session.sessionType === "mock";
  const answeredCount = session.questions.filter(sq => isAnswered(answers[sq.questionNumber])).length;
  const unanswered   = session.questions.filter(sq => !isAnswered(answers[sq.questionNumber]));
  const isReviewing  = audioEnded && reviewLeft !== null && reviewLeft > 0;
  const timerPct     = (timeLeft / session.timeLimitSeconds) * 100;
  const timerColor   = timeLeft < 60 ? "bg-red-500" : timeLeft < 120 ? "bg-orange-400" : "bg-[#7D3CFF]";
  const inputsLocked = phase === "reading";

  const setAnswer = (qNum: number, val: any) =>
    setAnswers(prev => ({ ...prev, [qNum]: val }));

  const setMatchingAnswer = (qNum: number, label: string, val: string) =>
    setAnswers(prev => ({ ...prev, [qNum]: { ...(prev[qNum] || {}), [label]: val } }));

  // ══════════════════════════════════════════
  // PHASE: READING
  // ══════════════════════════════════════════
  if (phase === "reading") {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Reading banner */}
          <div className="bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-5 text-white mb-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold opacity-70 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <BookOpen className="w-4 h-4" /> Read the questions · Audio starts in
                </p>
                <p className="text-5xl font-bold tabular-nums">{readingLeft}s</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{session.passageTitle}</p>
                <p className="text-xs opacity-60 mt-0.5 capitalize">
                  Part {session.part} · {session.difficulty} · {session.accent} accent
                </p>
                <p className="text-xs opacity-50 mt-1">{session.totalQuestions} questions · ~{Math.round(session.audioDuration / 60)} min audio</p>
              </div>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full">
              <div className="h-2 bg-white rounded-full transition-all duration-1000"
                style={{ width: `${(readingLeft / 30) * 100}%` }} />
            </div>
            <p className="text-xs opacity-60 mt-2">
              You will answer while the audio plays — just like the real IELTS test
            </p>
          </div>

          <div className="flex justify-end mb-4">
            <button onClick={() => {
              if (readingTimerRef.current) clearInterval(readingTimerRef.current);
              setPhase("active");
            }} className="text-sm text-[#7D3CFF] hover:underline font-medium">
              I'm ready — start audio now →
            </button>
          </div>

          {/* Questions preview — read only */}
          <div className="space-y-3">
            {session.questions.map((question, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#F0E8FF] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-6 w-6 rounded-lg bg-[#7D3CFF] text-white text-xs font-bold flex items-center justify-center">
                    {question.questionNumber}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    question.type === "multiple_choice" ? "bg-purple-100 text-purple-700"
                    : question.type === "form_completion" ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                  }`}>
                    {question.type === "multiple_choice" ? "Multiple Choice"
                     : question.type === "form_completion" ? "Form Completion"
                     : "Matching"}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1a1a2e] mb-2">{question.prompt}</p>
                {question.type === "multiple_choice" && question.options && (
                  <div className="space-y-1 pl-2">
                    {question.options.map((opt, j) => (
                      <p key={j} className="text-xs text-gray-400">{opt}</p>
                    ))}
                  </div>
                )}
                {question.type === "matching" && question.matchingPairs && (
                  <div className="pl-2 space-y-1">
                    {question.matchingPairs.map((pair, j) => (
                      <p key={j} className="text-xs text-gray-400">{pair.label}: ___</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // PHASE: ACTIVE (listen + answer simultaneously)
  // ══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />

      {session.audioUrl && (
        <audio ref={audioRef} src={session.audioUrl}
          onPlay={() => setAudioPlaying(true)}
          onEnded={handleAudioEnded}
          className="hidden" />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#7D3CFF] uppercase tracking-wider flex items-center gap-1">
                {isMock ? <><ClipboardList className="w-3 h-3" /> Mock</> : <><Headphones className="w-3 h-3" /> Practice</>} · Part {session.part}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[session.difficulty]}`}>
                {session.difficulty}
              </span>
              <span className="text-xs text-gray-400 capitalize">{session.accent}</span>
            </div>
            <h1 className="text-lg font-bold text-[#1a1a2e]">{session.passageTitle}</h1>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[#1a1a2e]"}`}>
              {formatTime(timeLeft)}
            </p>
            <p className="text-xs text-gray-400">remaining</p>
          </div>
        </div>

        {/* Main timer bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-4">
          <div className={`h-1.5 rounded-full transition-all ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>

        {/* Status banners */}
        {audioPlaying && !audioEnded && (
          <div className="bg-[#7D3CFF] text-white rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Audio playing — answer as you listen</p>
              <p className="text-xs opacity-70">
                {isMock ? "No replay — mock test mode" : "1 replay available after audio ends"}
              </p>
            </div>
            <span className="text-xs opacity-60 tabular-nums">~{Math.round(session.audioDuration / 60)}m audio</span>
          </div>
        )}

        {/* 🔴 Review buffer — unanswered highlighted */}
        {isReviewing && (
          <div className="bg-orange-500 text-white rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="text-sm font-bold">Audio ended — Final review</p>
                  <p className="text-xs opacity-80">
                    {unanswered.length > 0
                      ? `${unanswered.length} unanswered question${unanswered.length > 1 ? "s" : ""} — check Q${unanswered.map(u => u.questionNumber).join(", Q")}`
                      : "All questions answered! You can submit now."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{reviewLeft}s</p>
                <p className="text-xs opacity-70">auto-submit</p>
              </div>
            </div>
            {/* Review buffer bar */}
            <div className="w-full h-1.5 bg-white/30 rounded-full">
              <div className="h-1.5 bg-white rounded-full transition-all"
                style={{ width: `${((reviewLeft ?? 0) / 30) * 100}%` }} />
            </div>
          </div>
        )}

        {!session.audioUrl && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Audio unavailable. Read the transcript below to practice answering.
            <button onClick={() => setShowTranscript(true)} className="ml-2 underline">Show transcript</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Current question ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`bg-white rounded-2xl border-2 p-5 transition-colors ${
              isReviewing && !isAnswered(answers[q.questionNumber])
                ? "border-orange-400 shadow-md shadow-orange-100"
                : "border-[#F0E8FF]"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  q.type === "multiple_choice" ? "bg-purple-100 text-purple-700"
                  : q.type === "form_completion" ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
                }`}>
                  {q.type === "multiple_choice" ? <><ClipboardList className="w-3 h-3 inline mr-1" /> Multiple Choice</>
                   : q.type === "form_completion" ? <><FileText className="w-3 h-3 inline mr-1" /> Form Completion</>
                   : <><Link className="w-3 h-3 inline mr-1" /> Matching</>}
                </span>
                <span className="text-xs text-gray-400">Q{currentQ + 1} of {session.totalQuestions}</span>
                {isReviewing && !isAnswered(answers[q.questionNumber]) && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Unanswered
                  </span>
                )}
              </div>

              <p className="text-base font-semibold text-[#1a1a2e] mb-4 leading-relaxed">{q.prompt}</p>

              {/* Multiple choice */}
              {q.type === "multiple_choice" && (
                <div className="space-y-2">
                  {q.options?.map((opt, i) => (
                    <button key={i}
                      onClick={() => !inputsLocked && setAnswer(q.questionNumber, opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        answers[q.questionNumber] === opt
                          ? "border-[#7D3CFF] bg-[#F0E8FF] text-[#7D3CFF]"
                          : "border-[#F0E8FF] text-[#1a1a2e] hover:border-[#7D3CFF] hover:bg-[#F8F9FF]"
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Form completion */}
              {q.type === "form_completion" && (
                <div>
                  <input type="text"
                    value={answers[q.questionNumber] ?? ""}
                    onChange={e => !inputsLocked && setAnswer(q.questionNumber, e.target.value)}
                    placeholder="Type your answer as you hear it..."
                    className="w-full border-2 border-[#E2D9FF] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7D3CFF]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Write exactly as you hear it</p>
                </div>
              )}

              {/* Matching */}
              {q.type === "matching" && q.matchingPairs && (
                <div className="space-y-3">
                  {q.matchingPairs.map(pair => (
                    <div key={pair.label} className="bg-[#F8F9FF] rounded-xl p-3 border border-[#E2D9FF]">
                      <p className="text-sm font-medium text-[#1a1a2e] mb-2">{pair.label}</p>
                      <div className="space-y-1.5">
                        {pair.options.map((opt, i) => (
                          <button key={i}
                            onClick={() => !inputsLocked && setMatchingAnswer(q.questionNumber, pair.label, opt)}
                            className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                              (answers[q.questionNumber] || {})[pair.label] === opt
                                ? "border-[#7D3CFF] bg-[#F0E8FF] text-[#7D3CFF] font-medium"
                                : "border-[#E2D9FF] text-gray-600 hover:border-[#7D3CFF]"
                            }`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between">
              <button disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)}
                className="px-5 py-2.5 rounded-xl border-2 border-[#F0E8FF] text-sm font-medium text-gray-600 disabled:opacity-40 hover:border-[#7D3CFF]">
                ← Prev
              </button>
              <span className="text-sm text-gray-400">{answeredCount}/{session.totalQuestions} answered</span>
              {currentQ < session.totalQuestions - 1 ? (
                <button onClick={() => setCurrentQ(p => p + 1)}
                  className="px-5 py-2.5 rounded-xl bg-[#7D3CFF] text-white text-sm font-semibold hover:bg-[#6B2FE6]">
                  Next →
                </button>
              ) : (
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#7D3CFF] text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
                  {submitting
                    ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Submitting...</>
                    : "Submit ✓"}
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Question nav + progress ── */}
          <div className="space-y-4">

            {/* Question dots */}
            <div className="bg-white rounded-2xl border border-[#F0E8FF] p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Questions</p>
              <div className="grid grid-cols-5 gap-2">
                {session.questions.map((sq, i) => {
                  const done      = isAnswered(answers[sq.questionNumber]);
                  const isCurrent = i === currentQ;
                  const needsAttention = isReviewing && !done;
                  return (
                    <button key={i} onClick={() => setCurrentQ(i)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-[#7D3CFF] text-white scale-110 shadow-md"
                          : needsAttention
                          ? "bg-orange-100 text-orange-600 border-2 border-orange-400 animate-pulse"
                          : done
                          ? "bg-[#F0E8FF] text-[#7D3CFF] border border-[#7D3CFF]"
                          : "bg-gray-100 text-gray-500 hover:bg-[#F0E8FF]"
                      }`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              {isReviewing && unanswered.length > 0 && (
                <p className="text-xs text-orange-500 mt-2 text-center font-medium flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {unanswered.length} unanswered — orange = missing
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="bg-white rounded-2xl border border-[#F0E8FF] p-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Answered</span>
                <span className="font-semibold text-[#1a1a2e]">{answeredCount}/{session.totalQuestions}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className={`h-2 rounded-full transition-all ${answeredCount === session.totalQuestions ? "bg-green-500" : "bg-[#7D3CFF]"}`}
                  style={{ width: `${(answeredCount / session.totalQuestions) * 100}%` }} />
              </div>
            </div>

            {/* Submit */}
            <button onClick={() => handleSubmit(false)} disabled={submitting}
              className="w-full bg-[#7D3CFF] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#6B2FE6] disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit All Answers"}
            </button>

            {/* Transcript — only after audio ends in practice */}
            {!isMock && audioEnded && (
              <div className="bg-white rounded-2xl border border-[#F0E8FF] p-4">
                <button onClick={() => setShowTranscript(p => !p)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-[#7D3CFF]">
                  <span>📄 Transcript</span>
                  <span className="text-gray-400 text-xs">{showTranscript ? "▲ hide" : "▼ show"}</span>
                </button>
                {showTranscript && (
                  <div className="mt-3 max-h-56 overflow-y-auto">
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{session.passageText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
