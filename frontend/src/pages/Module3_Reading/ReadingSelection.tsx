import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { readingService, ExamType, Difficulty, ReadingStats, SessionSummary, RecentProgress } from '../../services/readingService';

const TOPICS = {
  Academic: [
    'Climate Change and Environmental Science',
    'Artificial Intelligence and Machine Learning',
    'Space Exploration and Astronomy',
    'Medical Research and Healthcare',
    'Archaeology and Ancient Civilizations',
    'Psychology and Human Behavior',
    'Economics and Global Trade',
    'Marine Biology and Ocean Conservation',
    'Renewable Energy Technologies',
    'Linguistics and Language Evolution',
  ],
  General: [
    'Travel and Tourism',
    'Workplace Safety',
    'Consumer Rights',
    'Public Transportation',
    'Health and Fitness',
    'Housing and Property',
    'Entertainment and Leisure',
    'Community Services',
  ],
};

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'Band 5-6', label: 'Foundation', description: 'Simpler vocabulary, clear structure' },
  { value: 'Band 6-7', label: 'Intermediate', description: 'Moderate complexity' },
  { value: 'Band 7-8', label: 'Advanced', description: 'Complex arguments, nuanced ideas' },
  { value: 'Band 8-9', label: 'Expert', description: 'Sophisticated language' },
];

export default function ReadingSelection() {
  const navigate = useNavigate();
  
  // Form state
  const [examType, setExamType] = useState<ExamType>('Academic');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Band 6-7');
  const [questionCount, setQuestionCount] = useState<number>(13);
  
  // Loading and error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stats and history
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [recentProgress, setRecentProgress] = useState<RecentProgress[]>([]);
  const [inProgressSessions, setInProgressSessions] = useState<SessionSummary[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch stats and in-progress sessions on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoadingStats(true);
    try {
      const [statsResponse, sessionsResponse] = await Promise.all([
        readingService.getStats(),
        readingService.getSessions({ status: 'in-progress', limit: 5 }),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.stats);
        setRecentProgress(statsResponse.recentProgress || []);
      }

      if (sessionsResponse.success) {
        setInProgressSessions(sessionsResponse.sessions);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await readingService.generateTest({
        examType,
        topic: topic || undefined,
        difficulty,
        questionCount,
      });

      if (response.success) {
        // Start a session with the generated test
        const sessionResponse = await readingService.startSession({
          examType,
          difficulty,
          passage: response.passage,
          questions: response.questions,
          timeLimit: response.timeLimit,
        });

        if (sessionResponse.success) {
          navigate('/reading/practice', {
            state: {
              session: sessionResponse.session,
            },
          });
        } else {
          setError(sessionResponse.error || 'Failed to start session');
        }
      } else {
        setError(response.error || 'Failed to generate test');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueSession = (session: SessionSummary) => {
    navigate('/reading/practice', {
      state: { sessionId: session.id },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Reading Practice</h1>
          <p className="text-[#777] dark:text-gray-400 text-sm">
            Improve your reading comprehension with AI-generated IELTS passages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue In-Progress Sessions */}
            {inProgressSessions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold mb-4 dark:text-white flex items-center gap-2">
                  <span className="text-blue-500">⏱</span> Continue Your Test
                </h3>
                <div className="space-y-3">
                  {inProgressSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800"
                    >
                      <div>
                        <p className="font-medium text-[#333] dark:text-white">{session.passageTitle}</p>
                        <p className="text-sm text-[#777] dark:text-gray-400">
                          {session.examType} • {session.difficulty} • {session.totalQuestions} questions
                        </p>
                      </div>
                      <button
                        onClick={() => handleContinueSession(session)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Continue
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Test Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-6 dark:text-white">Generate New Reading Test</h3>

              {/* Exam Type Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#333] dark:text-gray-300 mb-2">
                  Exam Type
                </label>
                <div className="flex rounded-lg overflow-hidden border border-[#E8DCFF] dark:border-gray-600">
                  {(['Academic', 'General'] as ExamType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setExamType(type);
                        setTopic(''); // Reset topic when changing exam type
                      }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        examType === type
                          ? 'bg-[#7D3CFF] text-white'
                          : 'bg-white dark:bg-gray-700 text-[#666] dark:text-gray-300 hover:bg-[#F8F5FF] dark:hover:bg-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#333] dark:text-gray-300 mb-2">
                  Topic (Optional)
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-3 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                >
                  <option value="">Random Topic</option>
                  {TOPICS[examType].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#333] dark:text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        difficulty === d.value
                          ? 'border-[#7D3CFF] bg-[#F8F5FF] dark:bg-[#7D3CFF]/20'
                          : 'border-[#E8DCFF] dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-[#7D3CFF]'
                      }`}
                    >
                      <p className={`font-medium ${difficulty === d.value ? 'text-[#7D3CFF]' : 'text-[#333] dark:text-white'}`}>
                        {d.label}
                      </p>
                      <p className="text-xs text-[#777] dark:text-gray-400">{d.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#333] dark:text-gray-300 mb-2">
                  Number of Questions: {questionCount}
                </label>
                <input
                  type="range"
                  min="8"
                  max="14"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full accent-[#7D3CFF]"
                />
                <div className="flex justify-between text-xs text-[#777] dark:text-gray-400 mt-1">
                  <span>8 (Quick)</span>
                  <span>14 (Full)</span>
                </div>
              </div>

              {/* Time Estimate */}
              <div className="mb-6 p-4 bg-[#F8F5FF] dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-[#666] dark:text-gray-300">
                  <span className="font-medium">Estimated Time:</span> {Math.round(questionCount * 1.5)} minutes
                </p>
                <p className="text-xs text-[#777] dark:text-gray-400 mt-1">
                  Based on ~1.5 minutes per question (IELTS standard)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateTest}
                disabled={isGenerating}
                className="w-full bg-[#7D3CFF] text-white py-4 rounded-lg hover:bg-[#6B2FE6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating Test...
                  </>
                ) : (
                  'Generate Reading Test'
                )}
              </button>
            </div>

            {/* View History Link */}
            <div className="text-center">
              <button
                onClick={() => navigate('/reading/history')}
                className="text-[#7D3CFF] hover:underline text-sm"
              >
                View all past sessions →
              </button>
            </div>
          </div>

          {/* Sidebar - Stats & Tips */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Your Progress</h3>
              
              {isLoadingStats ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#777] dark:text-gray-400">Average Band</p>
                    <p className="text-3xl font-bold text-[#7D3CFF]">
                      {stats.avgBandScore > 0 ? stats.avgBandScore.toFixed(1) : '-'}
                    </p>
                    {stats.avgBandScore > 0 && (
                      <p className="text-xs text-[#777] dark:text-gray-400">
                        {readingService.getBandDescription(stats.avgBandScore)}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#777] dark:text-gray-400">Tests Completed</p>
                      <p className="font-semibold text-[#333] dark:text-white">{stats.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-[#777] dark:text-gray-400">Accuracy</p>
                      <p className="font-semibold text-[#333] dark:text-white">{stats.overallAccuracy}%</p>
                    </div>
                    <div>
                      <p className="text-[#777] dark:text-gray-400">Academic</p>
                      <p className="font-semibold text-[#333] dark:text-white">{stats.academicCount}</p>
                    </div>
                    <div>
                      <p className="text-[#777] dark:text-gray-400">General</p>
                      <p className="font-semibold text-[#333] dark:text-white">{stats.generalCount}</p>
                    </div>
                  </div>

                  {/* Recent Progress Mini Chart */}
                  {recentProgress.length > 0 && (
                    <div className="pt-4 border-t border-[#F0E8FF] dark:border-gray-700">
                      <p className="text-xs text-[#777] dark:text-gray-400 mb-2">Recent Scores</p>
                      <div className="flex items-end gap-1 h-12">
                        {recentProgress.slice(0, 7).reverse().map((p, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t"
                            style={{
                              height: `${(p.bandScore / 9) * 100}%`,
                              backgroundColor: readingService.getBandColor(p.bandScore),
                            }}
                            title={`Band ${p.bandScore}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#777] dark:text-gray-400">
                  Complete your first reading test to see your progress!
                </p>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-3 dark:text-white">Quick Tips</h3>
              <ul className="text-sm text-[#666] dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#7D3CFF]">•</span>
                  Skim the passage first for main ideas
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7D3CFF]">•</span>
                  Look for keywords in questions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7D3CFF]">•</span>
                  Manage your time: ~1.5 min per question
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7D3CFF]">•</span>
                  Don't spend too long on one question
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7D3CFF]">•</span>
                  Practice all question types regularly
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}