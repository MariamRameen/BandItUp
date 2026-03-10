import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function SpeakingIELTS() {
  const navigate = useNavigate();

  const parts = [
    {
      mode: "ielts_part1",
      title: "Part 1 — Introduction",
      desc: "Answer short personal questions about familiar topics: home, family, hobbies, work or study.",
      duration: "30s per question",
      icon: "💬",
      accent: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      btn: "from-blue-600 to-indigo-600",
    },
    {
      mode: "ielts_part2",
      title: "Part 2 — Cue Card",
      desc: "Speak for up to 2 minutes on a given topic. You'll have 1 minute to prepare your answer.",
      duration: "1 min prep + 2 min speaking",
      icon: "🗣️",
      accent: "text-[#7D3CFF]",
      bg: "bg-[#F4F0FF]",
      border: "border-[#E2D9FF]",
      btn: "from-[#7D3CFF] to-[#5A20E0]",
    },
    {
      mode: "ielts_part3",
      title: "Part 3 — Discussion",
      desc: "Discuss abstract and complex topics in depth. Extended analytical responses required.",
      duration: "60s per question",
      icon: "🧠",
      accent: "text-[#F107A3]",
      bg: "bg-[#FFF0F7]",
      border: "border-[#FFD6EC]",
      btn: "from-[#F107A3] to-[#C2006B]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5FF] to-[#F0F2FF]">
      <div className="bg-white border-b border-[#F0E8FF] px-8 py-5 shadow-sm">
        <button onClick={() => navigate("/speaking")} className="text-[#7D3CFF] text-sm hover:underline mb-2 block">← Speaking</button>
        <h1 className="text-2xl font-bold text-[#333]">IELTS Speaking Practice</h1>
        <p className="text-[#777] text-sm">Choose a part to practice, or complete all three.</p>
      </div>

      <div className="px-8 py-8 max-w-3xl mx-auto space-y-5">
        {parts.map(p => (
          <div key={p.mode} className={`bg-white border ${p.border} rounded-3xl p-7 shadow-sm flex flex-col md:flex-row md:items-center gap-6`}>
            <div className="text-5xl">{p.icon}</div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold mb-1 ${p.accent}`}>{p.title}</h2>
              <p className="text-[#666] text-sm mb-3">{p.desc}</p>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${p.bg} ${p.accent}`}>⏱ {p.duration}</span>
            </div>
            <button
              onClick={() => navigate(`/speaking/session?mode=${p.mode}`)}
              className={`bg-gradient-to-r ${p.btn} text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shrink-0 shadow-md`}
            >
              Practice →
            </button>
          </div>
        ))}

        <button
          onClick={() => navigate("/speaking/session?mode=ielts_part1")}
          className="w-full bg-gradient-to-r from-[#7D3CFF] to-[#F107A3] text-white py-5 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2"
        >
          🚀 Complete Full IELTS Mock (All 3 Parts) <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
