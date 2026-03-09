import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import { readingService, ReadingSession, QuestionType } from '../../services/readingService';

// Helper to convert index to letter (0 -> 'A', 1 -> 'B', etc.)
const indexToLetter = (idx: number): string => String.fromCharCode(65 + idx);

export default function ReadingFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'passage'>('overview');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const state = location.state as { sessionId?: string } | null;
        
        if (!state?.sessionId) {
          setError('No session ID provided');
          return;
        }

        const response = await readingService.getSession(state.sessionId);
        
        if (response.success && response.session) {
          setSession(response.session);
        } else {
          setError(response.error || 'Failed to load session');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load feedback');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [location.state]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 mx-auto text-[#7D3CFF]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-4 text-[#666] dark:text-gray-400">Loading feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
        <Header />
        <div className="max-w-lg mx-auto px-8 py-12 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Session not found'}</p>
            <button
              onClick={() => navigate('/reading')}
              className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg hover:bg-[#6B2FE6]"
            >
              Back to Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const correctCount = session.questions.filter((q) => q.isCorrect).length;
  const accuracy = Math.round((correctCount / session.questions.length) * 100);
  const timeTaken = session.timeLimit - (session.timeRemaining || 0);

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Reading Test Results</h1>
          <p className="text-[#777] dark:text-gray-400 text-sm">
            {session.passage.title} • {session.examType} • {session.difficulty}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Band Score Circle */}
            <div className="text-center">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: readingService.getBandColor(session.bandScore || 0) }}
              >
                {session.bandScore?.toFixed(1) || '-'}
              </div>
              <p className="mt-2 font-semibold text-[#333] dark:text-white">Band Score</p>
              <p className="text-sm text-[#777] dark:text-gray-400">
                {readingService.getBandDescription(session.bandScore || 0)}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-[#F8F5FF] dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-2xl font-bold text-[#7D3CFF]">{accuracy}%</p>
                <p className="text-sm text-[#777] dark:text-gray-400">Accuracy</p>
              </div>
              <div className="bg-[#F8F5FF] dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-2xl font-bold text-green-500">{correctCount}</p>
                <p className="text-sm text-[#777] dark:text-gray-400">Correct</p>
              </div>
              <div className="bg-[#F8F5FF] dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-2xl font-bold text-red-500">{session.questions.length - correctCount}</p>
                <p className="text-sm text-[#777] dark:text-gray-400">Incorrect</p>
              </div>
              <div className="bg-[#F8F5FF] dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-2xl font-bold text-[#7D3CFF]">{formatTime(timeTaken)}</p>
                <p className="text-sm text-[#777] dark:text-gray-400">Time Taken</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#E8DCFF] dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'questions', label: 'Questions Review' },
            { id: 'passage', label: 'Passage' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-[#7D3CFF] border-b-2 border-[#7D3CFF]'
                  : 'text-[#666] dark:text-gray-400 hover:text-[#7D3CFF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Feedback */}
            {session.feedback && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold mb-4 text-[#333] dark:text-white">AI Feedback</h3>
                
                {session.feedback.overallFeedback && (
                  <div className="mb-4">
                    <p className="text-[#666] dark:text-gray-300">{session.feedback.overallFeedback}</p>
                  </div>
                )}

                {/* Strengths & Areas to Improve */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {session.feedback.strengths && session.feedback.strengths.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                      <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">💪 Strengths</h4>
                      <ul className="text-sm text-green-600 dark:text-green-300 space-y-1">
                        {session.feedback.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.feedback.areasToImprove && session.feedback.areasToImprove.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
                      <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-2">📈 Areas to Improve</h4>
                      <ul className="text-sm text-orange-600 dark:text-orange-300 space-y-1">
                        {session.feedback.areasToImprove.map((a, i) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Study Tips */}
                {session.feedback.studyTips && session.feedback.studyTips.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">📚 Study Tips</h4>
                    <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                      {session.feedback.studyTips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Question Type Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 text-[#333] dark:text-white">Performance by Question Type</h3>
              <div className="space-y-3">
                {getQuestionTypeStats(session.questions).map((stat) => (
                  <div key={stat.type} className="flex items-center gap-4">
                    <div className="w-40 text-sm text-[#666] dark:text-gray-400">
                      {readingService.getQuestionTypeDisplayName(stat.type as QuestionType)}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          stat.accuracy >= 80 ? 'bg-green-500' :
                          stat.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stat.accuracy}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-sm font-medium text-[#333] dark:text-white">
                      {stat.correct}/{stat.total} ({stat.accuracy}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            {session.questions.map((q, idx) => (
              <div
                key={q._id}
                className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden ${
                  q.isCorrect
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-red-200 dark:border-red-800'
                }`}
              >
                <button
                  onClick={() => setExpandedQuestion(expandedQuestion === q._id ? null : q._id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      q.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[#333] dark:text-white line-clamp-1">
                        {q.questionText}
                      </p>
                      <p className="text-xs text-[#777] dark:text-gray-400">
                        {readingService.getQuestionTypeDisplayName(q.questionType as QuestionType)}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#777] transition-transform ${
                      expandedQuestion === q._id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedQuestion === q._id && (
                  <div className="px-4 pb-4 border-t border-[#F0E8FF] dark:border-gray-700 pt-4">
                    <p className="text-[#333] dark:text-white mb-4">{q.questionText}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className={`p-3 rounded-lg ${
                        q.isCorrect
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}>
                        <p className="text-xs text-[#777] dark:text-gray-400 mb-1">Your Answer</p>
                        <p className={`font-medium ${
                          q.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                        }`}>
                          {q.userAnswer || '(No answer)'}
                        </p>
                      </div>
                      
                      {!q.isCorrect && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <p className="text-xs text-[#777] dark:text-gray-400 mb-1">Correct Answer</p>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            {q.correctAnswer}
                          </p>
                        </div>
                      )}
                    </div>

                    {q.explanation && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-xs text-[#777] dark:text-gray-400 mb-1">Explanation</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'passage' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 text-[#333] dark:text-white">
              {session.passage.title}
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              {session.passage.paragraphs && session.passage.paragraphs.length > 0 ? (
                session.passage.paragraphs.map((para, idx) => (
                  <p key={idx} className="mb-4 text-[#333] dark:text-gray-200 leading-relaxed">
                    <span className="text-xs font-bold text-[#7D3CFF] dark:text-[#A78BFA] mr-2">[{indexToLetter(idx)}]</span>
                    {para.content || para.text}
                  </p>
                ))
              ) : (
                <p className="text-[#333] dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {session.passage.content}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <button
            onClick={() => navigate('/reading')}
            className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
          >
            Practice Again
          </button>
          <button
            onClick={() => navigate('/reading/history')}
            className="bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-[#A78BFA] px-6 py-3 rounded-lg hover:bg-[#E8DCFF] dark:hover:bg-gray-600"
          >
            View History
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-[#A78BFA] px-6 py-3 rounded-lg hover:bg-[#E8DCFF] dark:hover:bg-gray-600"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate question type statistics
function getQuestionTypeStats(questions: ReadingSession['questions']) {
  const typeMap: Record<string, { correct: number; total: number }> = {};
  
  questions.forEach((q) => {
    if (!typeMap[q.questionType]) {
      typeMap[q.questionType] = { correct: 0, total: 0 };
    }
    typeMap[q.questionType].total++;
    if (q.isCorrect) {
      typeMap[q.questionType].correct++;
    }
  });

  return Object.entries(typeMap).map(([type, stats]) => ({
    type,
    ...stats,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }));
}