import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { BookOpen, PenTool, BarChart3, Layers, Book } from "lucide-react";

const API = "http://localhost:4000/api/vocab";
const ALPHABET = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` };
}

interface BandSummary { band: number; total: number; mastered: number; }
interface Word {
  _id: string; word: string; bandLevel: number; topics: string[];
  meaning: string; exampleSentence: string; collocations: string[];
  cefrLevel: string; seenCount: number;
  masteryStatus: "unseen" | "learning" | "mastered"; accuracy: number;
}

export default function VocabBands(): React.ReactElement {
  const navigate = useNavigate();

  const [bands, setBands] = useState<BandSummary[]>([]);
  const [selectedBand, setSelectedBand] = useState<number | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string>("All");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [letterOpen, setLetterOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingWords, setLoadingWords] = useState(false);
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null);
  const [wodExpanded, setWodExpanded] = useState(false);
  const [wodCooldown, setWodCooldown] = useState(false);
  const [wodHoursLeft, setWodHoursLeft] = useState(0);
  const [wodDismissed, setWodDismissed] = useState(false);

  const markWodViewed = async (word: Word) => {
    try {
      await fetch(`${API}/word-of-day/viewed`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word._id, word: word.word }),
      });
    } catch (err) { console.error(err); }
  };

  const handleWodExpand = async () => {
    const nowExpanded = !wodExpanded;
    setWodExpanded(nowExpanded);
    // Mark as viewed the moment user expands it
    if (nowExpanded && wordOfDay && !wodCooldown) {
      await markWodViewed(wordOfDay);
    }
  };

  const handleWodDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWodDismissed(true);
  };

  useEffect(() => {
    fetch(`${API}/bands`, { headers: authHeaders() })
      .then((r) => r.json()).then((d) => { if (d.success) setBands(d.bands); }).catch(console.error);
    fetch(`${API}/word-of-day`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.word) {
          setWordOfDay(d.word);
          setWodCooldown(d.cooldown ?? false);
          setWodHoursLeft(d.hoursRemaining ?? 0);
        }
        // If cooldown with no word (already viewed today) — don't show banner
      }).catch(console.error);
  }, []);

  const fetchWords = useCallback(async () => {
    if (!selectedBand) return;
    setLoadingWords(true);
    try {
      const params = new URLSearchParams({ band: String(selectedBand), page: String(page), limit: "18" });
      if (selectedTopic !== "All") params.set("topics", selectedTopic);
      if (selectedLetter !== "All") params.set("letter", selectedLetter);
      const r = await fetch(`${API}/words?${params}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) { setWords(d.words); setTotal(d.total); setTotalPages(d.totalPages); setAvailableTopics(d.topics ?? []); }
    } catch (err) { console.error(err); }
    finally { setLoadingWords(false); }
  }, [selectedBand, selectedTopic, selectedLetter, page]);

  useEffect(() => { fetchWords(); }, [fetchWords]);
  useEffect(() => { setPage(1); }, [selectedBand, selectedTopic, selectedLetter]);

  const handleBandClick = (band: number) => {
    setSelectedBand(selectedBand === band ? null : band);
    setWords([]); setSelectedLetter("All"); setSelectedTopic("All");
  };

  const getBandData = (band: number): BandSummary =>
    bands.find((b) => b.band === band) ?? { band, total: 0, mastered: 0 };

  const bandLabel = (band: number) => band === 6 ? "Band 6 & Below" : `Band ${band}`;

  const masteryBadge = (status: string): React.ReactElement => {
    if (status === "mastered") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Mastered</span>;
    if (status === "learning") return <span className="text-xs bg-purple-100 text-[#7D3CFF] px-2 py-0.5 rounded-full font-medium">Learning</span>;
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">New</span>;
  };

  const closeDropdowns = () => { setLetterOpen(false); setTopicOpen(false); };

  return (
    <div className="min-h-screen bg-[#F7F5FF]" onClick={closeDropdowns}>
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Vocabulary Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Select a band level to start learning</p>
        </div>

        {/* Word of the Day — hidden if dismissed or already viewed today (no word returned) */}
        {wordOfDay && !wodDismissed && (
          <div className="mb-6 bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] rounded-2xl p-4 text-white select-none">
            <div className="flex items-center justify-between cursor-pointer" onClick={(e) => { e.stopPropagation(); handleWodExpand(); }}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <div>
                  <p className="text-xs font-semibold opacity-70 uppercase tracking-widest mb-0.5">Word of the Day</p>
                  <p className="text-xl font-bold">{wordOfDay.word}</p>
                  {!wodExpanded && <p className="text-sm opacity-80">{wordOfDay.meaning}</p>}
                </div>
              </div>
              <span className="text-sm opacity-60">{wodExpanded ? "▲" : "▼ expand"}</span>
            </div>

            {wodExpanded && (
              <>
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div><p className="opacity-60 text-xs uppercase mb-1">Meaning</p><p>{wordOfDay.meaning}</p></div>
                  <div><p className="opacity-60 text-xs uppercase mb-1">Example</p><p className="italic">{wordOfDay.exampleSentence}</p></div>
                  <div><p className="opacity-60 text-xs uppercase mb-1">Collocations</p><p>{wordOfDay.collocations?.slice(0, 2).join(", ")}</p></div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleWodDismiss}
                    className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    ✓ Got it — see you tomorrow
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Band Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[6, 7, 8, 9].map((band) => {
            const data = getBandData(band);
            const pct = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0;
            const isActive = selectedBand === band;
            return (
              <button key={band} onClick={(e) => { e.stopPropagation(); handleBandClick(band); }}
                className={`rounded-2xl p-4 text-left transition-all border-2 ${isActive
                  ? "bg-[#7D3CFF] text-white border-[#7D3CFF] shadow-lg scale-[1.02]"
                  : "bg-white text-[#1a1a2e] border-[#F0E8FF] hover:border-[#7D3CFF] hover:shadow-md"}`}>
                <div className="flex justify-between items-start mb-3">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isActive ? "text-white/70" : "text-gray-400"}`}>
                    {band === 6 ? "≤ Band 6" : `Band ${band}`}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-white/20 text-white" : "bg-[#F0E8FF] text-[#7D3CFF]"}`}>
                    {data.mastered}/{data.total}
                  </span>
                </div>
                <p className={`text-base font-bold mb-3 ${isActive ? "text-white" : "text-[#1a1a2e]"}`}>{bandLabel(band)}</p>
                <div className={`w-full h-1.5 rounded-full ${isActive ? "bg-white/30" : "bg-gray-100"}`}>
                  <div className={`h-1.5 rounded-full ${isActive ? "bg-white" : "bg-[#7D3CFF]"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-xs mt-1.5 ${isActive ? "text-white/60" : "text-gray-400"}`}>{pct}% mastered</p>
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => selectedBand && navigate("/vocabulary/flashcards", { state: { band: selectedBand } })}
            disabled={!selectedBand}
            className="flex-1 bg-[#7D3CFF] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6B2FE6] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Layers className="w-4 h-4 inline mr-1" /> Flashcards
          </button>
          <button onClick={() => selectedBand && navigate("/vocabulary/quiz", { state: { band: selectedBand } })}
            disabled={!selectedBand}
            className="flex-1 border-2 border-[#7D3CFF] text-[#7D3CFF] py-2.5 rounded-xl font-semibold text-sm hover:bg-[#F0E8FF] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <PenTool className="w-4 h-4 inline mr-1" /> Take Quiz
          </button>
          <button onClick={() => navigate("/vocabulary/progress")}
            className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-white transition-all">
            <BarChart3 className="w-4 h-4 inline mr-1" /> Progress
          </button>
        </div>

        {/* Filter row — greyed out until band selected */}
        <div className={`flex flex-wrap items-center gap-3 mb-5 transition-all duration-300 ${!selectedBand ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Band label pill */}
          <div className="flex items-center gap-2 bg-white border border-[#F0E8FF] rounded-xl px-4 py-2 text-sm">
            <span className="font-semibold text-[#7D3CFF]">{selectedBand ? bandLabel(selectedBand) : "No band selected"}</span>
            {selectedBand && <span className="text-gray-400">· {total} words</span>}
          </div>

          <div className="flex gap-3 ml-auto">
            {/* Topic dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setTopicOpen((p) => !p); setLetterOpen(false); }}
                className={`flex items-center gap-2 bg-white border rounded-xl px-4 py-2 text-sm font-medium transition-colors min-w-[150px] justify-between ${topicOpen ? "border-[#7D3CFF] text-[#7D3CFF]" : "border-[#F0E8FF] text-[#1a1a2e] hover:border-[#7D3CFF]"}`}>
                <span className="flex items-center gap-1"><Book className="w-4 h-4" /> {selectedTopic === "All" ? "All Topics" : selectedTopic}</span>
                <span className="text-gray-400 text-xs ml-2">{topicOpen ? "▲" : "▼"}</span>
              </button>
              {topicOpen && availableTopics.length > 0 && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#F0E8FF] rounded-xl shadow-xl z-30 min-w-[170px] py-1 max-h-60 overflow-y-auto">
                  {["All", ...availableTopics].map((topic) => (
                    <button key={topic} onClick={() => { setSelectedTopic(topic); setTopicOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedTopic === topic ? "bg-[#F0E8FF] text-[#7D3CFF] font-semibold" : "text-[#1a1a2e] hover:bg-[#F8F9FF]"}`}>
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Letter dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setLetterOpen((p) => !p); setTopicOpen(false); }}
                className={`flex items-center gap-2 bg-white border rounded-xl px-4 py-2 text-sm font-medium transition-colors min-w-[150px] justify-between ${letterOpen ? "border-[#7D3CFF] text-[#7D3CFF]" : "border-[#F0E8FF] text-[#1a1a2e] hover:border-[#7D3CFF]"}`}>
                <span>🔤 {selectedLetter === "All" ? "All Letters" : `Letter ${selectedLetter}`}</span>
                <span className="text-gray-400 text-xs ml-2">{letterOpen ? "▲" : "▼"}</span>
              </button>
              {letterOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#F0E8FF] rounded-xl shadow-xl z-30 p-3 w-64">
                  <div className="grid grid-cols-7 gap-1">
                    {ALPHABET.map((l) => (
                      <button key={l} onClick={() => { setSelectedLetter(l); setLetterOpen(false); }}
                        className={`h-8 rounded-lg text-xs font-semibold transition-colors ${selectedLetter === l ? "bg-[#7D3CFF] text-white" : "bg-gray-100 text-gray-600 hover:bg-[#F0E8FF] hover:text-[#7D3CFF]"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Words section */}
        {!selectedBand ? (
          <div className="bg-white rounded-2xl border border-[#F0E8FF] p-16 text-center">
            <p className="text-5xl mb-4">👆</p>
            <p className="text-lg font-semibold text-[#1a1a2e] mb-1">Select a Band Level Above</p>
            <p className="text-sm text-gray-500">Click any band card to browse its vocabulary words</p>
          </div>
        ) : loadingWords ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7D3CFF]" />
          </div>
        ) : words.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#F0E8FF] p-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 mb-3">No words found for this filter.</p>
            <button onClick={() => { setSelectedLetter("All"); setSelectedTopic("All"); }}
              className="text-sm text-[#7D3CFF] hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {words.map((word) => (
                <div key={word._id}
                  onClick={() => navigate("/vocabulary/flashcards", { state: { band: selectedBand, focusWord: word._id } })}
                  className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-4 hover:shadow-md hover:border-[#7D3CFF] transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-base text-[#7D3CFF] group-hover:underline">{word.word}</h3>
                    {masteryBadge(word.masteryStatus)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{word.meaning}</p>
                  <p className="text-xs text-gray-400 italic line-clamp-1 mb-3">{word.exampleSentence}</p>
                  {word.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {word.topics.slice(0, 2).map((t) => (
                        <span key={t} className="text-xs bg-[#F0E8FF] text-[#7D3CFF] px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                  {word.seenCount > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full">
                        <div className="h-1 bg-[#7D3CFF] rounded-full" style={{ width: `${word.accuracy}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{word.accuracy}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="px-5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 hover:border-[#7D3CFF] transition-colors">
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 hover:border-[#7D3CFF] transition-colors">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
