import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { TrendingUp } from "lucide-react";

const API = "http://localhost:4000/api/speaking";
const token = () => localStorage.getItem("token") || "";

export default function SpeakingProgress() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/stats`,            { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch(`${API}/history?limit=20`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ]).then(([s, h]) => {
      if (s.success) setStats(s);
      if (h.success) setHistory(h.sessions.reverse());
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF] flex items-center justify-center">
      <p className="text-[#777]">Loading...</p>
    </div>
  );

  const trendData = history.map((s, i) => ({ session: `#${i + 1}`, band: s.band, fluency: s.fluencyCoherence, lexical: s.lexicalResource, grammar: s.grammaticalRange, pronunciation: s.pronunciation }));

  const radarData = stats?.criteriaAvg ? [
    { criterion: "Fluency",       score: stats.criteriaAvg.fluencyCoherence },
    { criterion: "Lexical",       score: stats.criteriaAvg.lexicalResource },
    { criterion: "Grammar",       score: stats.criteriaAvg.grammaticalRange },
    { criterion: "Pronunciation", score: stats.criteriaAvg.pronunciation },
  ] : [];

  const modeStats = stats?.modeStats || {};
  const MODE_LABELS: Record<string, string> = { free: "Free", ielts_part1: "Part 1", ielts_part2: "Part 2", ielts_part3: "Part 3" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF]">
      <div className="bg-white border-b border-[#F0E8FF] px-8 py-5 shadow-sm">
        <button onClick={() => navigate("/speaking")} className="text-[#7D3CFF] text-sm hover:underline mb-2 block">← Speaking</button>
        <div className="flex items-center gap-3">
          <TrendingUp size={22} className="text-[#7D3CFF]" />
          <div>
            <h1 className="text-2xl font-bold text-[#333]">Progress Tracker</h1>
            <p className="text-[#777] text-sm">Average Band: <span className="text-[#7D3CFF] font-bold text-lg">{stats?.avgBand || 0}</span> · {stats?.totalSessions || 0} sessions</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Band trend */}
        {trendData.length > 1 && (
          <div className="bg-white border border-[#F0E8FF] rounded-3xl p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-[#333] mb-4">Band Score Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8FF" />
                  <XAxis dataKey="session" stroke="#999" tick={{ fontSize: 11 }} />
                  <YAxis domain={[1, 9]} stroke="#999" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #E2D9FF", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="band" stroke="#7D3CFF" strokeWidth={3} dot={{ fill: "#7D3CFF", r: 4 }} name="Band" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Radar */}
          {radarData.length > 0 && (
            <div className="bg-white border border-[#F0E8FF] rounded-3xl p-6 shadow-sm">
              <h2 className="font-bold text-[#333] mb-4">Criteria Breakdown</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2D9FF" />
                    <PolarAngleAxis dataKey="criterion" tick={{ fill: "#777", fontSize: 11 }} />
                    <Radar dataKey="score" stroke="#7D3CFF" fill="#7D3CFF" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Mode stats */}
          <div className="bg-white border border-[#F0E8FF] rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-[#333] mb-4">Performance by Mode</h2>
            <div className="space-y-4">
              {Object.entries(modeStats).map(([mode, s]: [string, any]) => (
                <div key={mode} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#333]">{MODE_LABELS[mode] || mode}</p>
                    <p className="text-[#999] text-xs">{s.count} session{s.count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-[#F0E8FF] rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-[#7D3CFF] to-[#F107A3]" style={{ width: `${(s.avg / 9) * 100}%` }} />
                    </div>
                    <span className="text-[#7D3CFF] font-bold text-sm w-8 text-right">{s.avg}</span>
                  </div>
                </div>
              ))}
              {Object.keys(modeStats).length === 0 && <p className="text-[#999] text-sm">No sessions yet.</p>}
            </div>
          </div>
        </div>

        {/* Criteria avg */}
        {stats?.criteriaAvg && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "fluencyCoherence", label: "Fluency & Coherence" },
              { key: "lexicalResource",  label: "Lexical Resource" },
              { key: "grammaticalRange", label: "Grammatical Range" },
              { key: "pronunciation",    label: "Pronunciation" },
            ].map(({ key, label }) => (
              <div key={key} className="bg-white border border-[#F0E8FF] rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[#777] text-xs mb-1">{label}</p>
                <p className="text-3xl font-bold text-[#7D3CFF]">{(stats.criteriaAvg as any)[key] || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
