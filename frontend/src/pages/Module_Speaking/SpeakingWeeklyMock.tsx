import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Loader2, ChevronRight } from "lucide-react";

const API = "http://localhost:4000/api/speaking";
const token = () => localStorage.getItem("token") || "";

export default function SpeakingWeeklyMock() {
  const navigate = useNavigate();
  const [mock, setMock]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(`${API}/weekly-mock`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setMock(d); else setError("Could not generate mock."); })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF] flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={40} className="animate-spin text-[#7D3CFF] mx-auto mb-4" />
        <p className="text-[#777]">Generating your personalized mock test...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF] flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  );

  const { mock: m, avgBand, weekLabel } = mock;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF]">
      <div className="bg-white border-b border-[#F0E8FF] px-8 py-5 shadow-sm">
        <button onClick={() => navigate("/speaking")} className="text-[#7D3CFF] text-sm hover:underline mb-2 block">← Speaking</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#333]">Weekly Mock Test</h1>
            <p className="text-[#777] text-sm">Band {avgBand} • Focus: {weekLabel}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-3xl mx-auto">
        {/* Focus tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
          <p className="text-amber-700 text-sm">💡 <strong>This week's tip:</strong> {m.focusTip}</p>
        </div>

        {/* Part 1 */}
        <div className="bg-white border border-blue-100 rounded-3xl p-7 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-blue-500 uppercase tracking-widest font-medium">Part 1</span>
              <h2 className="text-xl font-bold text-[#333] mt-1">Introduction — {m.part1.topic}</h2>
            </div>
            <span className="text-[#777] text-xs">30s each</span>
          </div>
          <div className="space-y-3 mb-6">
            {m.part1.questions.map((q: string, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
                <span className="text-blue-500 font-bold text-sm shrink-0">Q{i + 1}</span>
                <p className="text-[#444] text-sm">{q}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate(`/speaking/session?mode=ielts_part1&prompt=${encodeURIComponent(m.part1.questions.join("\n\n"))}`)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            Practice Part 1 <ChevronRight size={16} />
          </button>
        </div>

        {/* Part 2 */}
        <div className="bg-white border border-[#E2D9FF] rounded-3xl p-7 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-[#7D3CFF] uppercase tracking-widest font-medium">Part 2</span>
              <h2 className="text-xl font-bold text-[#333] mt-1">Cue Card</h2>
            </div>
            <span className="text-[#777] text-xs">Up to 2 min</span>
          </div>
          <div className="bg-[#F4F0FF] border border-[#E2D9FF] rounded-2xl p-5 mb-6 whitespace-pre-line text-[#444] text-sm leading-relaxed">
            {m.part2.cueCard}
          </div>
          <button
            onClick={() => navigate(`/speaking/session?mode=ielts_part2&prompt=${encodeURIComponent(m.part2.cueCard)}`)}
            className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#5A20E0] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            Practice Part 2 <ChevronRight size={16} />
          </button>
        </div>

        {/* Part 3 */}
        <div className="bg-white border border-[#FFD6EC] rounded-3xl p-7 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-[#F107A3] uppercase tracking-widest font-medium">Part 3</span>
              <h2 className="text-xl font-bold text-[#333] mt-1">Discussion</h2>
            </div>
            <span className="text-[#777] text-xs">60s each</span>
          </div>
          <div className="space-y-3 mb-6">
            {m.part3.questions.map((q: string, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-[#FFF0F7] rounded-xl p-3">
                <span className="text-[#F107A3] font-bold text-sm shrink-0">Q{i + 1}</span>
                <p className="text-[#444] text-sm">{q}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate(`/speaking/session?mode=ielts_part3&prompt=${encodeURIComponent(m.part3.questions.join("\n\n"))}`)}
            className="w-full bg-gradient-to-r from-[#F107A3] to-[#C2006B] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            Practice Part 3 <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
