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
type Screen = "loading" | "quiz" | "submitting" | "results" | "error";
type QuestionType = "meaning_mcq" | "collocation_mcq" | "fill_blank_mcq" | "written";

interface Option {
  text: string;
  correct: boolean;
}

interface Question {
  type: QuestionType;
  wordId: string;
  word: string;
  topic?: string;
  prompt: string;
  meaning?: string;
  options?: Option[];
  correctAnswer: string;
}

interface Answer {
  userAnswer: string;
  isCorrect: boolean;
}

interface AIEvaluation {
  bandScore: number;
  marks: number;
  feedback: string;
  lowBandWords: string[];
  suggestions: string[];
}

interface QuestionResult {
  wordId: string;
  word: string;
  questionType: QuestionType;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  aiEvaluation?: AIEvaluation;
}

interface QuizResults {
  mcqScore: number;
  mcqTotal: number;
  writtenScore: number;
  writtenBand: number;
  writtenEval: AIEvaluation | null;
  quizBandScore: number;
  questions: QuestionResult[];
}

interface LocationState {
  band?: number;
  topics?: string[];
}

// ── Component ──────────────────────────────────────────
export default function VocabQuiz(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const band = state?.band ?? 6;
  const topics = state?.topics ?? [];

  const [screen, setScreen] = useState<Screen>("loading");
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [writtenAnswer, setWrittenAnswer] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [results, setResults] = useState<QuizResults | null>(null);

  const generateQuiz = useCallback(async (): Promise<void> => {
    setScreen("loading");
    setResults(null);
    setAnswers({});
    setWrittenAnswer("");
    setCurrentQ(0);
    try {
      const params = new URLSearchParams({ band: String(band) });
      if (topics.length > 0) params.set("topics", topics.join(","));
      const r = await fetch(`${API}/quiz/generate?${params}`, { headers: authHeaders() });
      const d = await r.json();
      if (!d.success) { setErrorMsg(d.message ?? "Could not generate quiz."); setScreen("error"); return; }
      setSessionId(d.sessionId);
      setQuestions(d.questions);
      setScreen("quiz");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setScreen("error");
    }
  }, [band, topics.join(",")]);

  useEffect(() => { generateQuiz(); }, [generateQuiz]);

  const selectMCQ = (optionText: string, isCorrect: boolean): void => {
    if (answers[currentQ]) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: { userAnswer: optionText, isCorrect } }));
  };

  const goNextQuestion = (): void => {
    if (currentQ < questions.length - 1) setCurrentQ((i) => i + 1);
  };

  const goPrevQuestion = (): void => {
    if (currentQ > 0) setCurrentQ((i) => i - 1);
  };

  const handleSubmit = async (): Promise<void> => {
    setScreen("submitting");
    const payload = questions.map((q, i) => {
      if (q.type === "written") {
        return { wordId: q.wordId, word: q.word, type: "written", topic: q.topic ?? "Academic", userAnswer: writtenAnswer || "(no answer)", correctAnswer: q.correctAnswer, isCorrect: false };
      }
      const ans = answers[i] ?? { userAnswer: "", isCorrect: false };
      return { wordId: q.wordId, word: q.word, type: q.type, userAnswer: ans.userAnswer, correctAnswer: q.correctAnswer, isCorrect: ans.isCorrect };
    });

    try {
      const r = await fetch(`${API}/quiz/submit`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ sessionId, bandLevel: band, topics: topics.join(","), answers: payload }),
      });
      const d = await r.json();
      if (d.success) { setResults(d); setScreen("results"); }
      else { setErrorMsg(d.message ?? "Submission failed."); setScreen("error"); }
    } catch {
      setErrorMsg("Network error during submission.");
      setScreen("error");
    }
  };

  const allAnswered = questions.every((q, i) =>
    q.type === "written" ? writtenAnswer.trim().length > 0 : !!answers[i]
  );
  const wordCount = writtenAnswer.trim() ? writtenAnswer.trim().split(/\s+/).length : 0;

  // ── Loading ──────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div className="min-h-screen bg-[#F7F5FF]"><Header />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
          <p className="text-gray-600">Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (screen === "submitting") {
    return (
      <div className="min-h-screen bg-[#F7F5FF]"><Header />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
          <p className="text-gray-600 font-medium">Evaluating your answers with AI...</p>
          <p className="text-sm text-gray-400">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (screen === "error") {
    return (
      <div className="min-h-screen bg-[#F7F5FF]"><Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-gray-700 font-medium mb-2">{errorMsg}</p>
          <p className="text-sm text-gray-500 mb-6">Try viewing some flashcards first, then come back to quiz.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/vocabulary/flashcards", { state: { band, topics } })} className="bg-[#7D3CFF] text-white px-6 py-2 rounded-xl">Go to Flashcards</button>
            <button onClick={() => navigate("/vocabulary")} className="border border-gray-200 px-6 py-2 rounded-xl text-gray-600">Back</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────
  if (screen === "results" && results) {
    const { mcqScore, mcqTotal, writtenScore, writtenBand, writtenEval, quizBandScore, questions: qResults } = results;
    const bandBg = quizBandScore >= 7.5 ? "from-green-500 to-emerald-600" : quizBandScore >= 6.5 ? "from-[#7D3CFF] to-[#9B59B6]" : "from-orange-400 to-red-500";

    return (
      <div className="min-h-screen bg-[#F7F5FF]"><Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className={`bg-gradient-to-r ${bandBg} rounded-3xl p-6 text-white text-center mb-6 shadow-lg`}>
            <p className="text-sm opacity-80 uppercase tracking-wider mb-1">Quiz Band Score</p>
            <p className="text-6xl font-bold mb-1">{quizBandScore}</p>
            <p className="text-sm opacity-80">Vocabulary Quiz</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "MCQ Score", value: `${mcqScore}/${mcqTotal}` },
              { label: "Written Score", value: `${writtenScore}/4` },
              { label: "Written Band", value: String(writtenBand) },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#F0E8FF] p-4 text-center">
                <p className="text-2xl font-bold text-[#7D3CFF]">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {writtenEval && (
            <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-5 mb-6">
              <h3 className="font-bold text-[#1a1a2e] mb-3 flex items-center gap-2"><span>🤖</span> AI Writing Evaluation</h3>
              <p className="text-sm text-gray-700 mb-3">{writtenEval.feedback}</p>
              {writtenEval.lowBandWords?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-orange-600 mb-1">Low-band words used:</p>
                  <div className="flex flex-wrap gap-2">{writtenEval.lowBandWords.map((w) => <span key={w} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full">{w}</span>)}</div>
                </div>
              )}
              {writtenEval.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">Higher-band alternatives:</p>
                  <div className="flex flex-wrap gap-2">{writtenEval.suggestions.map((s) => <span key={s} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">{s}</span>)}</div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm p-5 mb-6">
            <h3 className="font-bold text-[#1a1a2e] mb-4">Question Review</h3>
            <div className="space-y-4">
              {qResults?.map((q, i) => (
                <div key={i} className={`p-3 rounded-xl border ${q.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">{q.questionType?.replace("_", " ")}</p>
                      <p className="font-semibold text-sm text-[#1a1a2e]">{q.word}</p>
                      <p className="text-xs text-gray-600 mt-1">Your answer: <span className="font-medium">{q.userAnswer || "(blank)"}</span></p>
                      {!q.isCorrect && q.questionType !== "written" && (
                        <p className="text-xs text-green-700 mt-0.5">Correct: <span className="font-medium">{q.correctAnswer}</span></p>
                      )}
                    </div>
                    <span className={`text-xl shrink-0 ${q.isCorrect ? "text-green-600" : "text-red-500"}`}>{q.isCorrect ? "✓" : "✗"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={generateQuiz} className="flex-1 bg-[#7D3CFF] text-white py-3 rounded-xl font-semibold hover:bg-[#6B2FE6]">🔄 Retry Quiz</button>
            <button onClick={() => navigate("/vocabulary/flashcards", { state: { band, topics } })} className="flex-1 border border-[#7D3CFF] text-[#7D3CFF] py-3 rounded-xl font-semibold hover:bg-[#F0E8FF]">🃏 More Flashcards</button>
            <button onClick={() => navigate("/vocabulary/progress")} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50">📊 Progress</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz ─────────────────────────────────────────────
  const q = questions[currentQ];
  const answered = answers[currentQ];
  const isLast = currentQ === questions.length - 1;

  return (
    <div className="min-h-screen bg-[#F7F5FF]"><Header />
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/vocabulary")} className="text-sm text-[#7D3CFF]">← Back</button>
          <div className="text-center">
            <p className="font-semibold text-[#1a1a2e]">Vocabulary Quiz</p>
            <p className="text-xs text-gray-500">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className="w-16" />
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {questions.map((_, i) => {
            let color = "bg-gray-200";
            if (i === currentQ) color = "bg-[#7D3CFF]";
            else if (questions[i].type === "written" ? writtenAnswer.trim().length > 0 : answers[i]) {
              if (questions[i].type === "written") color = "bg-blue-400";
              else color = answers[i]?.isCorrect ? "bg-green-400" : "bg-orange-400";
            }
            return <div key={i} className={`h-2 rounded-full transition-all ${i === currentQ ? "w-8" : "w-2"} ${color}`} />;
          })}
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl border border-[#F0E8FF] shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              q.type === "written" ? "bg-blue-100 text-blue-700"
              : q.type === "meaning_mcq" ? "bg-purple-100 text-purple-700"
              : q.type === "collocation_mcq" ? "bg-orange-100 text-orange-700"
              : "bg-green-100 text-green-700"
            }`}>
              {q.type === "meaning_mcq" ? "📖 Meaning" : q.type === "collocation_mcq" ? "🔗 Collocation" : q.type === "fill_blank_mcq" ? "✏️ Fill in the Blank" : "✍️ Written Answer (AI Evaluated)"}
            </span>
          </div>

          <p className="text-base font-semibold text-[#1a1a2e] mb-5 leading-relaxed">{q.prompt}</p>

          {/* MCQ */}
          {q.type !== "written" && (
            <div className="space-y-3">
              {q.options?.map((opt, i) => {
                let style = "bg-[#F8F9FF] border-[#E2D9FF] text-[#1a1a2e] hover:border-[#7D3CFF] hover:bg-[#F0E8FF]";
                if (answered) {
                  if (opt.correct) style = "bg-green-50 border-green-400 text-green-800";
                  else if (answered.userAnswer === opt.text && !opt.correct) style = "bg-red-50 border-red-400 text-red-700";
                  else style = "bg-gray-50 border-gray-200 text-gray-400";
                }
                return (
                  <button key={i} disabled={!!answered} onClick={() => selectMCQ(opt.text, opt.correct)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${style}`}>
                    <span className="mr-2 font-bold text-gray-400">{["A", "B", "C", "D"][i]}.</span>
                    {opt.text}
                    {answered && opt.correct && <span className="float-right text-green-600">✓</span>}
                    {answered && answered.userAnswer === opt.text && !opt.correct && <span className="float-right text-red-500">✗</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Written */}
          {q.type === "written" && (
            <div>
              <div className="bg-[#F8F9FF] rounded-xl p-3 mb-4 border border-[#E2D9FF] flex items-center gap-2">
                <span className="text-lg">✍️</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-0.5">Topic</p>
                  <p className="text-sm font-semibold text-[#7D3CFF]">{q.topic ?? "Academic"}</p>
                </div>
              </div>
              <textarea value={writtenAnswer} onChange={(e) => setWrittenAnswer(e.target.value)}
                placeholder={`Write your paragraph on "${q.topic ?? "Academic"}" here...`} maxLength={200} rows={4}
                className="w-full border-2 border-[#E2D9FF] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7D3CFF] resize-none" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Max 30 words · Use varied vocabulary</p>
                <p className={`text-xs font-medium ${wordCount > 30 ? "text-red-500" : "text-gray-500"}`}>{wordCount}/30 words</p>
              </div>
            </div>
          )}

          {answered && q.type !== "written" && (
            <div className={`mt-4 p-3 rounded-xl text-sm ${answered.isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {answered.isCorrect ? "✓ Correct! Great job." : `✗ Incorrect. The correct answer is: "${q.correctAnswer}"`}
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3">
          <button disabled={currentQ === 0} onClick={goPrevQuestion} className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm disabled:opacity-40">← Prev</button>
          {!isLast ? (
            <button onClick={goNextQuestion} disabled={q.type !== "written" && !answered}
              className="flex-1 bg-[#7D3CFF] text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-[#6B2FE6]">Next Question →</button>
          ) : (
            <button onClick={handleSubmit} disabled={!allAnswered || wordCount > 30}
              className="flex-1 bg-gradient-to-r from-[#7D3CFF] to-[#9B59B6] text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:opacity-90">🎯 Submit Quiz</button>
          )}
        </div>

        {/* Overview */}
        <div className="mt-4 bg-white rounded-2xl border border-[#F0E8FF] p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Question overview</p>
          <div className="flex gap-2 flex-wrap">
            {questions.map((q2, i) => {
              let cls = "bg-gray-100 text-gray-500";
              if (i === currentQ) cls = "bg-[#7D3CFF] text-white";
              else if (q2.type === "written" && writtenAnswer.trim()) cls = "bg-blue-100 text-blue-700";
              else if (answers[i]?.isCorrect) cls = "bg-green-100 text-green-700";
              else if (answers[i] && !answers[i].isCorrect) cls = "bg-red-100 text-red-700";
              return (
                <button key={i} onClick={() => setCurrentQ(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${cls}`}>{i + 1}</button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
