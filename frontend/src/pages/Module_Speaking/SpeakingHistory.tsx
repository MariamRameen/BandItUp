import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Mic } from "lucide-react";

const API = "http://localhost:4000/api/speaking";
const token = () => localStorage.getItem("token") || "";

const MODE_LABELS: Record<string, string> = {
  free: "Free Practice", ielts_part1: "IELTS Part 1", ielts_part2: "IELTS Part 2", ielts_part3: "IELTS Part 3",
};
const MODE_COLORS: Record<string, string> = {
  free: "text-[#7D3CFF] bg-[#F4F0FF]", ielts_part1: "text-blue-600 bg-blue-50", ielts_part2: "text-[#7D3CFF] bg-[#F4F0FF]", ielts_part3: "text-[#F107A3] bg-[#FFF0F7]",
};

export default function SpeakingHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/history?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setSessions(d.sessions); setPages(d.pages); setTotal(d.total); } })
      .finally(() => setLoading(false));
  }, [page]);

  const bandColor = (b: number) => b >= 7 ? "text-emerald-600" : b >= 5 ? "text-[#7D3CFF]" : "text-[#F107A3]";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF]">
      <div className="bg-white border-b border-[#F0E8FF] px-8 py-5 shadow-sm">
        <button onClick={() => navigate("/speaking")} className="text-[#7D3CFF] text-sm hover:underline mb-2 block">← Speaking</button>
        <div className="flex items-center gap-3">
          <Clock size={22} className="text-[#7D3CFF]" />
          <div>
            <h1 className="text-2xl font-bold text-[#333]">Session History</h1>
            <p className="text-[#777] text-sm">{total} sessions total</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center text-[#777] py-20">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <Mic size={48} className="text-[#C9B8FF] mx-auto mb-4" />
            <p className="text-[#777]">No sessions yet. Start practicing!</p>
            <button onClick={() => navigate("/speaking")} className="mt-4 bg-gradient-to-r from-[#7D3CFF] to-[#5A20E0] text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-md">Start Now</button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s: any) => (
              <div key={s._id} className="bg-white border border-[#F0E8FF] rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${MODE_COLORS[s.mode] || "text-[#777] bg-[#F4F0FF]"}`}>{MODE_LABELS[s.mode] || s.mode}</span>
                      <span className="text-[#999] text-xs">{new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="text-[#444] text-sm truncate mb-2">{s.prompt}</p>
                    {s.transcript && <p className="text-[#999] text-xs italic truncate">"{s.transcript}"</p>}
                    <div className="flex gap-3 mt-3 text-xs text-[#999]">
                      <span>F&C: <span className={bandColor(s.fluencyCoherence)}>{s.fluencyCoherence}</span></span>
                      <span>LR: <span className={bandColor(s.lexicalResource)}>{s.lexicalResource}</span></span>
                      <span>GR: <span className={bandColor(s.grammaticalRange)}>{s.grammaticalRange}</span></span>
                      <span>P: <span className={bandColor(s.pronunciation)}>{s.pronunciation}</span></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-4xl font-bold ${bandColor(s.band)}`}>{s.band}</p>
                    <p className="text-[#999] text-xs mt-1">{s.duration}s</p>
                  </div>
                </div>
                {s.feedback && (
                  <div className="mt-4 pt-4 border-t border-[#F0E8FF]">
                    <p className="text-[#666] text-xs leading-relaxed">{s.feedback}</p>
                  </div>
                )}
              </div>
            ))}
            {pages > 1 && (
              <div className="flex justify-center gap-3 mt-6">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl bg-white border border-[#E2D9FF] disabled:opacity-40 hover:bg-[#F4F0FF] text-sm text-[#7D3CFF] font-medium">← Prev</button>
                <span className="px-4 py-2 text-[#777] text-sm">{page} / {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-white border border-[#E2D9FF] disabled:opacity-40 hover:bg-[#F4F0FF] text-sm text-[#7D3CFF] font-medium">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
