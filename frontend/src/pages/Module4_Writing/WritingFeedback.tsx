import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { writingService, WritingSession, GrammarError, VocabSuggestion } from '../../services/writingService';

interface LocationState {
  session: WritingSession;
}

export default function WritingFeedback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const locationState = location.state as LocationState | null;

  const [session, setSession] = useState<WritingSession | null>(locationState?.session || null);
  const [isLoading, setIsLoading] = useState(!locationState?.session);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showEssay, setShowEssay] = useState(false);

  // Load session if not passed via state
  useEffect(() => {
    if (!session && sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, session]);

  const loadSession = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await writingService.getSession(id);
      if (response.success) {
        setSession(response.session);
      } else {
        setError('Failed to load feedback');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const getBandColor = (band: number) => writingService.getBandColor(band);

  const getCriteriaBackground = (band: number): string => {
    if (band >= 7.5) return 'bg-green-50 dark:bg-green-900/30';
    if (band >= 6.5) return 'bg-blue-50 dark:bg-blue-900/30';
    if (band >= 5.5) return 'bg-yellow-50 dark:bg-yellow-900/30';
    return 'bg-orange-50 dark:bg-orange-900/30';
  };

  const getCriteriaTextColor = (band: number): string => {
    if (band >= 7.5) return 'text-green-700 dark:text-green-400';
    if (band >= 6.5) return 'text-blue-700 dark:text-blue-400';
    if (band >= 5.5) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-orange-700 dark:text-orange-400';
  };

  const handlePracticeAgain = () => {
    navigate('/writing');
  };

  const handleViewHistory = () => {
    navigate('/writing/history');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 mx-auto text-[#7D3CFF] mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[#777] dark:text-gray-400">Loading your feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Session not found'}</p>
            <button
              onClick={() => navigate('/writing')}
              className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
            >
              Back to Writing
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { evaluation, grammarErrors, vocabularySuggestions, task, essay, wordCount, timeSpent, taskType, examType } = session;

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-[#777] dark:text-gray-400 mb-4">This session hasn't been evaluated yet.</p>
            <button
              onClick={() => navigate('/writing')}
              className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
            >
              Back to Writing
            </button>
          </div>
        </div>
      </div>
    );
  }

  const criteria = [
    { key: 'taskResponse', label: taskType === 2 ? 'Task Response' : 'Task Achievement', data: evaluation.taskResponse },
    { key: 'coherenceCohesion', label: 'Coherence & Cohesion', data: evaluation.coherenceCohesion },
    { key: 'lexicalResource', label: 'Lexical Resource', data: evaluation.lexicalResource },
    { key: 'grammaticalRange', label: 'Grammar', data: evaluation.grammaticalRange },
  ].filter(c => c.data && typeof c.data.band === 'number');

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Writing Feedback Report</h1>
          <p className="text-[#777] dark:text-gray-400 text-sm">
            Task {taskType} - {examType} | {task.essayType || task.letterType || 'Essay'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <div className="text-center mb-6">
                <div 
                  className="w-28 h-28 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4"
                  style={{ backgroundColor: getBandColor(evaluation.overallBand ?? 0) }}
                >
                  {(evaluation.overallBand ?? 0).toFixed(1)}
                </div>
                <h3 className="text-lg font-semibold dark:text-white">Overall Band Score</h3>
                <p className="text-[#777] dark:text-gray-400">{writingService.getBandDescription(evaluation.overallBand ?? 0)}</p>
                <div className="flex justify-center gap-4 mt-2 text-sm text-[#777] dark:text-gray-400">
                  <span>{wordCount} words</span>
                  {timeSpent && <span>• {Math.floor(timeSpent / 60)} min spent</span>}
                </div>
              </div>

              {/* Criteria Scores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {criteria.map(({ key, label, data }) => (
                  <div 
                    key={key} 
                    className="text-center cursor-pointer"
                    onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                  >
                    <div 
                      className={`w-16 h-16 ${getCriteriaBackground(data.band)} rounded-full flex items-center justify-center mx-auto mb-2`}
                    >
                      <span className={`${getCriteriaTextColor(data.band)} font-semibold`}>
                        {data.band.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-[#777] dark:text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Expanded Criteria Feedback */}
              {expandedSection && (
                <div className="bg-[#F8F9FF] dark:bg-gray-700 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold mb-2 dark:text-white">
                    {criteria.find(c => c.key === expandedSection)?.label} Feedback
                  </h4>
                  <p className="text-sm text-[#666] dark:text-gray-300">
                    {criteria.find(c => c.key === expandedSection)?.data?.feedback}
                  </p>
                </div>
              )}

              {/* Strengths */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                    <span className="text-green-500">✓</span> Strengths
                  </h4>
                  <div className="space-y-2">
                    {evaluation.strengths.map((strength, i) => (
                      <div key={i} className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-400">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {evaluation.improvements && evaluation.improvements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                    <span className="text-orange-500">→</span> Areas to Improve
                  </h4>
                  <div className="space-y-2">
                    {evaluation.improvements.map((improvement, i) => (
                      <div key={i} className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
                        <p className="text-sm text-orange-700 dark:text-orange-400">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grammar Errors */}
            {grammarErrors && grammarErrors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h4 className="font-semibold mb-4 dark:text-white flex items-center gap-2">
                  <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {grammarErrors.length}
                  </span>
                  Grammar Corrections
                </h4>
                <div className="space-y-3">
                  {grammarErrors.map((err: GrammarError, i: number) => (
                    <div key={i} className="border border-[#F0E8FF] dark:border-gray-600 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        <span className="line-through text-red-500 text-sm">{err.original}</span>
                        <span className="text-[#777] dark:text-gray-400">→</span>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">{err.correction}</span>
                        {err.errorType && (
                          <span className="text-xs bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-purple-400 px-2 py-0.5 rounded">
                            {err.errorType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#666] dark:text-gray-400">{err.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vocabulary Suggestions */}
            {vocabularySuggestions && vocabularySuggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h4 className="font-semibold mb-4 dark:text-white">Vocabulary Upgrades</h4>
                <div className="space-y-3">
                  {vocabularySuggestions.map((sug: VocabSuggestion, i: number) => (
                    <div key={i} className="bg-[#F8F9FF] dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        <span className="text-[#666] dark:text-gray-400 text-sm">"{sug.original}"</span>
                        <span className="text-[#777] dark:text-gray-400">→</span>
                        <span className="text-[#7D3CFF] dark:text-purple-400 text-sm font-semibold">{sug.upgrade}</span>
                      </div>
                      {sug.context && (
                        <p className="text-xs text-[#666] dark:text-gray-400 italic">
                          Example: {sug.context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Essay Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setShowEssay(!showEssay)}
                className="flex items-center justify-between w-full"
              >
                <h4 className="font-semibold dark:text-white">Your Response</h4>
                <span className="text-[#7D3CFF]">{showEssay ? '▲ Hide' : '▼ Show'}</span>
              </button>
              {showEssay && (
                <div className="mt-4">
                  <div className="bg-[#F8F9FF] dark:bg-gray-700 p-4 rounded-lg mb-4">
                    <p className="text-sm font-semibold mb-2 dark:text-white">Task:</p>
                    <p className="text-sm text-[#666] dark:text-gray-300">{task.prompt}</p>
                  </div>
                  <div className="border border-[#E2D9FF] dark:border-gray-600 p-4 rounded-lg">
                    <p className="text-sm text-[#333] dark:text-gray-300 whitespace-pre-wrap">{essay}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Session Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#777] dark:text-gray-400">Word Count</span>
                  <span className="font-medium dark:text-white">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777] dark:text-gray-400">Min Required</span>
                  <span className="font-medium dark:text-white">{writingService.getMinWords(taskType)}</span>
                </div>
                {timeSpent && (
                  <div className="flex justify-between">
                    <span className="text-[#777] dark:text-gray-400">Time Spent</span>
                    <span className="font-medium dark:text-white">{writingService.formatTime(timeSpent)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#777] dark:text-gray-400">Task Type</span>
                  <span className="font-medium dark:text-white">Task {taskType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777] dark:text-gray-400">Exam Type</span>
                  <span className="font-medium dark:text-white">{examType}</span>
                </div>
              </div>
            </div>

            {/* Band Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Band Breakdown</h3>
              <div className="space-y-3">
                {criteria.map(({ label, data }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#777] dark:text-gray-400">{label}</span>
                      <span className="font-medium dark:text-white">{data.band.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(data.band / 9) * 100}%`,
                          backgroundColor: getBandColor(data.band)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePracticeAgain}
                className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg hover:bg-[#6B2FE6] transition-colors"
              >
                Practice Again
              </button>
              <button
                onClick={handleViewHistory}
                className="w-full bg-white dark:bg-gray-800 border border-[#F0E8FF] dark:border-gray-700 text-[#7D3CFF] py-3 rounded-lg hover:bg-[#F8F9FF] dark:hover:bg-gray-700 transition-colors"
              >
                View History
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] py-3 rounded-lg hover:bg-[#E8DCFF] dark:hover:bg-gray-600 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}