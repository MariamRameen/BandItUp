import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header";

const API = "http://localhost:4000/api/vocab";

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  };
}

// ── Types ──────────────────────────────────────────────
interface Word {
  _id: string;
  word: string;
  bandLevel: number;
  topics: string[];
  meaning: string;
  exampleSentence: string;
  collocations: string[];
  cefrLevel: string;
  seenCount: number;
  masteryStatus: "unseen" | "learning" | "mastered";
  accuracy: number;
}

interface LocationState {
  band?: number;
  topics?: string[];
  focusWord?: string;
}

// ── Component ──────────────────────────────────────────
export default function VocabFlashcards(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const band = state?.band ?? 6;
  const topics = state?.topics ?? [];

  const [words, setWords] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [seenThisSession, setSeenThisSession] = useState<Set<string>>(new Set());
  const [showCollocations, setShowCollocations] = useState<boolean>(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ band: String(band), limit: "100" });
      if (topics.length > 0) params.set("topics", topics.join(","));
      const r = await fetch(`${API}/words?${params}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        const order: Record<string, number> = { unseen: 0, learning: 1, mastered: 2 };
        const sorted = [...(d.words as Word[])].sort(
          (a, b) => (order[a.masteryStatus] ?? 0) - (order[b.masteryStatus] ?? 0)
        );
        setWords(sorted);
        setCurrentIdx(0);
        setFlipped(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [band, topics.join(",")]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const currentWord: Word | undefined = words[currentIdx];

  const handleFlip = async (): Promise<void> => {
    setFlipped((f) => !f);
    setShowCollocations(false);

    if (!flipped && currentWord && !seenThisSession.has(currentWord._id)) {
      setSeenThisSession((prev) => new Set([...prev, currentWord._id]));
      try {
        await fetch(`${API}/seen`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ wordId: currentWord._id }),
        });
        setWords((prev) =>
          prev.map((w) =>
            w._id === currentWord._id
              ? { ...w, seenCount: w.seenCount + 1, masteryStatus: w.masteryStatus === "unseen" ? "learning" : w.masteryStatus }
              : w
          )
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const goNext = (): void => {
    setFlipped(false);
    setShowCollocations(false);
    setTimeout(() => setCurrentIdx((i) => Math.min(i + 1, words.length - 1)), 150);
  };

  const goPrev = (): void => {
    setFlipped(false);
    setShowCollocations(false);
    setTimeout(() => setCurrentIdx((i) => Math.max(i - 1, 0)), 150);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-600 mb-4">No words found for this band/filter.</p>
            <button onClick={() => navigate("/vocabulary")} className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg">Back to Vocabulary</button>
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.round(((currentIdx + 1) / words.length) * 100);
  const masteredCount = words.filter((w) => w.masteryStatus === "mastered").length;

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/vocabulary")} className="flex items-center gap-1 text-sm text-[#7D3CFF] hover:text-[#6B2FE6]">← Back</button>
          <div className="text-center">
            <p className="font-semibold text-[#1a1a2e]">Band {band} Flashcards</p>
            <p className="text-xs text-gray-500">{currentIdx + 1} / {words.length} · {masteredCount} mastered</p>
          </div>
          <button onClick={() => navigate("/vocabulary/quiz", { state: { band, topics } })} className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg text-sm font-medium">Take Quiz</button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
          <div className="h-2 bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          {[
            { value: seenThisSession.size, label: "Seen today", color: "text-[#7D3CFF]" },
            { value: masteredCount, label: "Mastered", color: "text-green-600" },
            { value: words.length - masteredCount, label: "Remaining", color: "text-gray-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl px-4 py-2 text-center border border-[#F0E8FF]">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Flashcard */}
        <div className="cursor-pointer select-none" onClick={handleFlip} style={{ perspective: "1200px" }}>
          <div
            style={{
              transition: "transform 0.5s",
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              position: "relative",
              minHeight: "320px",
            }}
          >
            {/* Front */}
            <div
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              className="absolute inset-0 bg-gradient-to-br from-[#7D3CFF] to-[#9B59B6] rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-white"
            >
              {currentWord?.masteryStatus === "mastered" && (
                <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs">✓ Mastered</div>
              )}
              <p className="text-xs uppercase tracking-widest opacity-70 mb-4">Band {currentWord?.bandLevel} · {currentWord?.cefrLevel}</p>
              <h2 className="text-4xl font-bold text-center mb-4">{currentWord?.word}</h2>
              {currentWord?.topics?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {currentWord.topics.map((t) => (
                    <span key={t} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              <p className="mt-8 text-white/60 text-sm animate-pulse">Tap to reveal definition →</p>
            </div>

            {/* Back */}
            <div
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              className="absolute inset-0 bg-white rounded-3xl shadow-xl p-8 border border-[#F0E8FF]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#7D3CFF]">{currentWord?.word}</h2>
                  <p className="text-xs text-gray-400">{currentWord?.cefrLevel} · Band {currentWord?.bandLevel}</p>
                </div>
                {currentWord?.masteryStatus === "mastered" && (
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">✓ Mastered</span>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Meaning</p>
                  <p className="text-gray-800 font-medium">{currentWord?.meaning}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Example</p>
                  <p className="text-gray-600 italic text-sm">{currentWord?.exampleSentence}</p>
                </div>
                <div>
                  <button onClick={() => setShowCollocations((p) => !p)} className="text-xs font-semibold text-[#7D3CFF] uppercase tracking-wider mb-1 hover:underline">
                    Collocations {showCollocations ? "▲" : "▼"}
                  </button>
                  {showCollocations && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentWord?.collocations?.map((c) => (
                        <span key={c} className="bg-[#F0E8FF] text-[#7D3CFF] text-xs px-3 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button disabled={currentIdx === 0} onClick={goPrev} className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">← Previous</button>
          <button onClick={handleFlip} className="px-6 py-3 bg-[#F0E8FF] text-[#7D3CFF] rounded-xl text-sm font-medium hover:bg-[#E8DCFF] transition-colors">{flipped ? "🔄 Flip Back" : "🃏 Flip Card"}</button>
          <button disabled={currentIdx === words.length - 1} onClick={goNext} className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
        </div>

        {/* Done banner */}
        {currentIdx === words.length - 1 && (
          <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white text-center">
            <p className="text-xl font-bold mb-1">🎉 All cards reviewed!</p>
            <p className="text-sm opacity-90 mb-4">You've seen {seenThisSession.size} new words this session.</p>
            <button onClick={() => navigate("/vocabulary/quiz", { state: { band, topics } })} className="bg-white text-green-700 px-6 py-2 rounded-xl font-semibold text-sm">Take Quiz Now →</button>
          </div>
        )}
      </div>
    </div>
  );
}
