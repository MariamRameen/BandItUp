import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { writingService, WritingTask } from '../../services/writingService';

interface LocationState {
  sessionId: string;
  taskType: 1 | 2;
  examType: 'Academic' | 'General';
  task: WritingTask;
  savedEssay?: string;
}

export default function WritingPractice() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // Redirect if no state
  useEffect(() => {
    if (!state?.sessionId || !state?.task) {
      navigate('/writing');
    }
  }, [state, navigate]);

  const sessionId = state?.sessionId || '';
  const taskType = state?.taskType || 2;
  const examType = state?.examType || 'Academic';
  const task = state?.task;
  const initialEssay = state?.savedEssay || '';

  const [essay, setEssay] = useState(initialEssay);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(writingService.getTimeLimit(taskType));
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const minWords = writingService.getMinWords(taskType);

  // Update word/char/paragraph counts
  useEffect(() => {
    const text = essay.trim();
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
    setCharCount(text.length);
    setParagraphCount(text ? text.split(/\n\n+/).filter(p => p.trim()).length : 0);
  }, [essay]);

  // Timer
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, timeLeft]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (essay.trim() && sessionId) {
        handleAutoSave();
      }
    }, 30000);

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [essay, sessionId]);

  const handleAutoSave = useCallback(async () => {
    if (!sessionId || isSaving || isSubmitting) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      await writingService.updateSession(sessionId, essay, timeSpent);
      setLastSaved(new Date());
    } catch (err: any) {
      setSaveError('Failed to save');
      console.error('Auto-save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, essay, isSaving, isSubmitting]);

  const handleManualSave = async () => {
    if (!sessionId) return;
    await handleAutoSave();
  };

  const handleSubmit = async () => {
    if (!sessionId) return;

    setIsSubmitting(true);
    setSaveError(null);

    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const response = await writingService.submitForEvaluation(sessionId, essay, timeSpent);

      if (response.success) {
        navigate('/writing/feedback', {
          state: {
            session: response.session,
          },
        });
      } else {
        setSaveError(response.error || 'Failed to submit');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const handleExit = async () => {
    // Save before exit
    if (essay.trim() && sessionId) {
      await handleAutoSave();
    }
    navigate('/writing');
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return 'text-red-600'; // Last minute
    if (timeLeft <= 300) return 'text-orange-500'; // Last 5 minutes
    return 'text-[#7D3CFF]';
  };

  const getWordCountColor = () => {
    if (wordCount >= minWords) return 'text-green-600';
    if (wordCount >= minWords * 0.8) return 'text-orange-500';
    return 'text-[#777]';
  };

  if (!task) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Writing Practice</h1>
            <p className="text-[#777] dark:text-gray-400 text-sm">
              Task {taskType} - {examType} | {task.essayType || task.letterType || task.chartType || 'Essay'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {/* Save Status */}
            <div className="text-sm">
              {isSaving ? (
                <span className="text-blue-500 flex items-center gap-1">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="text-green-600">
                  Saved at {lastSaved.toLocaleTimeString()}
                </span>
              ) : (
                <span className="text-[#777] dark:text-gray-400">Not saved yet</span>
              )}
            </div>

            {/* Timer */}
            <div className="text-right">
              <div className={`text-xl font-semibold ${getTimerColor()}`}>
                {writingService.formatTime(timeLeft)}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-[#777] dark:text-gray-400">Time Remaining</p>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="text-xs text-[#7D3CFF] hover:underline"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
            </div>

            {/* Exit Button */}
            <button
              onClick={handleExit}
              className="text-[#777] hover:text-red-500 transition-colors"
              title="Save and Exit"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Paused Overlay */}
        {isPaused && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center">
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">Timer Paused</h2>
              <p className="text-[#777] dark:text-gray-400 mb-6">Your essay is saved. Click resume to continue.</p>
              <button
                onClick={() => setIsPaused(false)}
                className="bg-[#7D3CFF] text-white px-8 py-3 rounded-lg hover:bg-[#6B2FE6]"
              >
                Resume Writing
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Writing Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm mb-6">
              {/* Task Question */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 dark:text-white">Task Question</h3>
                <div className="bg-[#F8F9FF] dark:bg-gray-700 p-4 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-[#333] dark:text-gray-300 whitespace-pre-wrap">
                    {task.prompt}
                  </p>
                  {task.visualDescription && (
                    <div className="mt-3 pt-3 border-t border-[#E0D8FF] dark:border-gray-600">
                      <p className="text-sm font-semibold mb-1 dark:text-white">Visual Data:</p>
                      <p className="text-sm text-[#666] dark:text-gray-400">{task.visualDescription}</p>
                    </div>
                  )}
                  {task.bulletPoints && (
                    <div className="mt-3 pt-3 border-t border-[#E0D8FF] dark:border-gray-600">
                      <p className="text-sm font-semibold mb-1 dark:text-white">Your letter should:</p>
                      <ul className="list-disc list-inside text-sm text-[#666] dark:text-gray-400">
                        {task.bulletPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Essay Textarea */}
              <div className="mb-4">
                <textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="Start typing your response here..."
                  className="w-full h-96 p-4 border border-[#E2D9FF] dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:border-[#7D3CFF] bg-white dark:bg-gray-700 text-[#333] dark:text-white"
                  disabled={isSubmitting || timeLeft === 0}
                />
              </div>

              {/* Stats Bar */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-6 text-sm">
                  <div className={getWordCountColor()}>
                    Words: <span className="font-semibold">{wordCount}</span> / {minWords} min
                  </div>
                  <div className="text-[#777] dark:text-gray-400">
                    Characters: <span className="font-semibold">{charCount}</span>
                  </div>
                  <div className="text-[#777] dark:text-gray-400">
                    Paragraphs: <span className="font-semibold">{paragraphCount}</span>
                  </div>
                </div>
                <button
                  onClick={handleManualSave}
                  disabled={isSaving || isSubmitting}
                  className="bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] px-4 py-2 rounded-lg hover:bg-[#E8E0FF] disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </button>
              </div>

              {saveError && (
                <p className="mt-3 text-red-500 text-sm">{saveError}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting || wordCount < 50}
              className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Evaluating...
                </>
              ) : (
                'Submit for AI Evaluation'
              )}
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Remember</h3>
              <div className="space-y-3 text-sm text-[#666] dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Write at least {minWords} words</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Time limit: {taskType === 1 ? '20' : '40'} minutes</span>
                </div>
                {taskType === 2 && (
                  <>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Plan your essay structure</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Include introduction, body paragraphs, and conclusion</span>
                    </div>
                  </>
                )}
                {taskType === 1 && examType === 'Academic' && (
                  <>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Start with an overview of main trends</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Make comparisons where relevant</span>
                    </div>
                  </>
                )}
                {taskType === 1 && examType === 'General' && (
                  <>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Use appropriate tone for the letter type</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Address all bullet points</span>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#7D3CFF] rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Auto-save every 30 seconds</span>
                </div>
              </div>
            </div>

            {/* Writing Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-3 dark:text-white">Writing Tips</h3>
              <ul className="text-sm text-[#666] dark:text-gray-400 space-y-2">
                <li>• Plan your structure before writing</li>
                <li>• Use formal academic language</li>
                <li>• Include clear topic sentences</li>
                <li>• Support arguments with examples</li>
                <li>• Leave time for proofreading</li>
                <li>• Vary your sentence structures</li>
              </ul>
            </div>

            {/* Vocabulary Hints */}
            {task.vocabularyHints && task.vocabularyHints.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold mb-3 dark:text-white">Useful Vocabulary</h3>
                <div className="flex flex-wrap gap-2">
                  {task.vocabularyHints.map((word, i) => (
                    <span
                      key={i}
                      className="bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-purple-400 px-3 py-1 rounded-full text-sm"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Submit Your Response?</h2>
            <div className="mb-6 space-y-2 text-sm text-[#666] dark:text-gray-400">
              <p>Word count: <span className={`font-semibold ${wordCount >= minWords ? 'text-green-600' : 'text-orange-500'}`}>{wordCount}</span> / {minWords} minimum</p>
              <p>Time used: {writingService.formatTime(writingService.getTimeLimit(taskType) - timeLeft)}</p>
              {wordCount < minWords && (
                <p className="text-orange-500">
                  Warning: Your response is below the minimum word count.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] py-3 rounded-lg hover:bg-[#E8E0FF] transition-colors"
              >
                Continue Writing
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}