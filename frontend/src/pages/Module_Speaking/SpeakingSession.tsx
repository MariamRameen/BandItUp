import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mic, MicOff, RotateCcw, ChevronRight, Loader2 } from "lucide-react";

const API = "http://localhost:4000/api/speaking";
const token = () => localStorage.getItem("token") || "";

const MODE_LABELS: Record<string, string> = {
  free:        "Free Practice",
  ielts_part1: "IELTS Part 1",
  ielts_part2: "IELTS Part 2",
  ielts_part3: "IELTS Part 3",
};

const MODE_DURATION: Record<string, number> = {
  free:        30,
  ielts_part1: 30,
  ielts_part2: 120,
  ielts_part3: 60,
};

export default function SpeakingSession() {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const mode           = params.get("mode") || "free";
  const externalPrompt = params.get("prompt") || "";

  const [phase, setPhase]       = useState<"loading"|"ready"|"prep"|"recording"|"processing"|"done">("loading");
  const [prompt, setPrompt]     = useState("");
  const [userBand, setUserBand] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODE_DURATION[mode] || 30);
  const [prepLeft, setPrepLeft] = useState(60);
  const [elapsed, setElapsed]   = useState(0);
  const [result, setResult]     = useState<any>(null);
  const [error, setError]       = useState("");

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<NodeJS.Timeout | null>(null);
  const prepTimerRef= useRef<NodeJS.Timeout | null>(null);
  const maxDuration = MODE_DURATION[mode] || 30;

  useEffect(() => {
    if (externalPrompt) { setPrompt(decodeURIComponent(externalPrompt)); setPhase("ready"); return; }
    fetch(`${API}/prompt?mode=${mode}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setPrompt(d.prompt); setUserBand(d.userBand); } else setError("Could not load prompt."); })
      .catch(() => setError("Network error."))
      .finally(() => setPhase("ready"));
  }, [mode, externalPrompt]);

  const startPrep = () => {
    setPhase("prep");
    setPrepLeft(60);
    prepTimerRef.current = setInterval(() => {
      setPrepLeft(p => {
        if (p <= 1) { if (prepTimerRef.current) clearInterval(prepTimerRef.current); startRecording(); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(200);
      mediaRef.current = mr;
      setPhase("recording");
      setTimeLeft(maxDuration);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(p => {
          const next = p + 1;
          setTimeLeft(maxDuration - next);
          if (next >= maxDuration) stopRecording();
          return next;
        });
      }, 1000);
    } catch { setError("Microphone access denied. Please allow microphone and try again."); setPhase("ready"); }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const mr = mediaRef.current;
    if (!mr || mr.state === "inactive") return;
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    mr.onstop = () => submitAudio();
    setPhase("processing");
  };

  const submitAudio = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const form = new FormData();
    form.append("audio", blob, "audio.webm");
    form.append("mode", mode);
    form.append("prompt", prompt);
    form.append("duration", String(elapsed));
    try {
      const r = await fetch(`${API}/evaluate`, { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: form });
      const d = await r.json();
      if (d.success) { setResult(d.session); setPhase("done"); }
      else setError(d.message || "Evaluation failed.");
    } catch { setError("Network error during evaluation."); setPhase("ready"); }
  };

  const retry = () => { setResult(null); setPhase("ready"); setElapsed(0); setTimeLeft(maxDuration); };
  const progressPct = (elapsed / maxDuration) * 100;
  const bandColor = (b: number) => b >= 7 ? "text-emerald-600" : b >= 5 ? "text-[#7D3CFF]" : "text-[#F107A3]";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF]">
      {/* Top bar */}
      <div className="bg-white border-b border-[#F0E8FF] px-6 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate("/speaking")} className="text-[#7D3CFF] text-sm hover:underline">← Back</button>
        <span className="text-sm font-semibold text-[#333]">{MODE_LABELS[mode]}</span>
        {userBand > 0 && <span className="text-sm text-[#7D3CFF] font-medium">Band {userBand}</span>}
        {userBand === 0 && <span />}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full">

        {/* Loading */}
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-[#7D3CFF]" />
            <p className="text-[#777]">Generating your prompt...</p>
          </div>
        )}

        {/* Prep phase — Part 2 only */}
        {phase === "prep" && (
          <div className="w-full">
            <div className="bg-white border border-[#F0E8FF] rounded-3xl p-8 mb-8 shadow-sm">
              <p className="text-xs text-[#777] uppercase tracking-widest mb-3">Part 2 Cue Card — Prepare Your Answer</p>
              <p className="text-lg leading-relaxed text-[#333] whitespace-pre-line">{prompt}</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <p className="text-[#777] text-sm uppercase tracking-widest">Preparation Time</p>
              <p className="text-8xl font-mono font-bold text-amber-500">{prepLeft}s</p>
              <div className="w-64 bg-[#F0E8FF] rounded-full h-3">
                <div className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${(prepLeft / 60) * 100}%` }} />
              </div>
              <p className="text-[#777] text-sm">Recording starts automatically when prep ends</p>
              <button onClick={startRecording} className="mt-2 text-sm text-[#7D3CFF] underline">Skip prep, start now</button>
            </div>
          </div>
        )}

        {/* Ready & Recording */}
        {(phase === "ready" || phase === "recording") && (
          <>
            <div className="w-full bg-white border border-[#F0E8FF] rounded-3xl p-8 mb-8 shadow-sm">
              <p className="text-xs text-[#777] uppercase tracking-widest mb-3">{MODE_LABELS[mode]} Prompt</p>
              <p className="text-xl leading-relaxed text-[#333] whitespace-pre-line">{prompt}</p>
            </div>

            {phase === "ready" && (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={mode === "ielts_part2" ? startPrep : startRecording}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7D3CFF] to-[#F107A3] flex items-center justify-center shadow-2xl hover:scale-105 transition-transform text-white"
                >
                  <Mic size={48} />
                </button>
                <p className="text-[#777] text-sm">Tap the mic to start • {maxDuration}s</p>
              </div>
            )}

            {phase === "recording" && (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#F107A3]/20 animate-ping" />
                  <button
                    onClick={stopRecording}
                    className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#F107A3] to-[#C2006B] flex items-center justify-center shadow-2xl hover:scale-105 transition-transform text-white"
                  >
                    <MicOff size={48} />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-mono font-bold text-[#333]">{timeLeft}s</p>
                  <p className="text-[#777] text-sm mt-1">Tap to stop early</p>
                </div>
                <div className="w-full bg-[#F0E8FF] rounded-full h-3">
                  <div className="h-3 rounded-full bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] transition-all duration-1000" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Processing */}
        {phase === "processing" && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F0E8FF] to-white border border-[#E2D9FF] flex items-center justify-center shadow-lg">
              <Loader2 size={40} className="animate-spin text-[#7D3CFF]" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-[#333]">Evaluating your response...</p>
              <p className="text-[#777] text-sm mt-2">Transcribing → Scoring on IELTS rubrics</p>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === "done" && result && (
          <div className="w-full space-y-5">
            <div className="text-center bg-white border border-[#F0E8FF] rounded-3xl p-8 shadow-sm">
              <p className="text-[#777] text-sm uppercase tracking-widest mb-2">Your Band Score</p>
              <p className={`text-8xl font-bold ${bandColor(result.band)}`}>{result.band}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "fluencyCoherence", label: "Fluency & Coherence" },
                { key: "lexicalResource",  label: "Lexical Resource" },
                { key: "grammaticalRange", label: "Grammatical Range" },
                { key: "pronunciation",    label: "Pronunciation" },
              ].map(({ key, label }) => (
                <div key={key} className="bg-white border border-[#F0E8FF] rounded-2xl p-4 shadow-sm">
                  <p className="text-[#777] text-xs mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${bandColor(result[key])}`}>{result[key]}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#F0E8FF] rounded-2xl p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#7D3CFF] mb-2">Examiner Feedback</p>
              <p className="text-[#444] text-sm leading-relaxed">{result.feedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                <p className="text-emerald-700 text-sm font-semibold mb-3">✓ Strengths</p>
                {result.strengths?.map((s: string, i: number) => (
                  <p key={i} className="text-emerald-600 text-sm mb-1">• {s}</p>
                ))}
              </div>
              <div className="bg-[#FFF0F7] border border-[#FFD6EC] rounded-2xl p-5">
                <p className="text-[#F107A3] text-sm font-semibold mb-3">→ To Improve</p>
                {result.improvements?.map((s: string, i: number) => (
                  <p key={i} className="text-[#C2006B] text-sm mb-1">• {s}</p>
                ))}
              </div>
            </div>

            {result.transcript && (
              <div className="bg-white border border-[#F0E8FF] rounded-2xl p-5 shadow-sm">
                <p className="text-[#777] text-xs uppercase tracking-widest mb-2">Your Transcript</p>
                <p className="text-[#444] text-sm italic leading-relaxed">"{result.transcript}"</p>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={retry} className="flex-1 flex items-center justify-center gap-2 border border-[#E2D9FF] bg-white py-4 rounded-2xl hover:bg-[#F4F0FF] transition-all text-[#7D3CFF] font-medium shadow-sm">
                <RotateCcw size={16} /> Try Again
              </button>
              <button onClick={() => navigate("/speaking")} className="flex-1 bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white py-4 rounded-2xl font-semibold hover:from-[#6B2FE6] hover:to-[#5A20E0] transition-all flex items-center justify-center gap-2 shadow-lg">
                Done <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center">{error}</div>
        )}
      </div>
    </div>
  );
}
