import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import { readingService, ReadingSession, ReadingQuestion, QuestionType } from '../../services/readingService';

// Helper to convert index to letter (0 -> 'A', 1 -> 'B', etc.)
const indexToLetter = (idx: number): string => String.fromCharCode(65 + idx);

export default function ReadingPractice() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Session state
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Practice state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI state
  const [showPassage, setShowPassage] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const state = location.state as { session?: ReadingSession; sessionId?: string } | null;
        
        if (state?.session) {
          // New session passed from selection
          setSession(state.session);
          setTimeLeft(state.session.timeLimit);
          
          // Initialize answers from session
          const initialAnswers: Record<string, string> = {};
          state.session.questions.forEach((q) => {
            if (q.userAnswer) {
              // Convert array answers to comma-separated string
              initialAnswers[q._id] = Array.isArray(q.userAnswer) ? q.userAnswer.join(',') : q.userAnswer;
            }
          });
          setAnswers(initialAnswers);
        } else if (state?.sessionId) {
          // Resume existing session
          const response = await readingService.getSession(state.sessionId);
          if (response.success && response.session) {
            setSession(response.session);
            setTimeLeft(response.session.timeRemaining || response.session.timeLimit);
            
            const initialAnswers: Record<string, string> = {};
            response.session.questions.forEach((q) => {
              if (q.userAnswer) {
                // Convert array answers to comma-separated string
                initialAnswers[q._id] = Array.isArray(q.userAnswer) ? q.userAnswer.join(',') : q.userAnswer;
              }
            });
            setAnswers(initialAnswers);
          } else {
            setError('Failed to load session');
          }
        } else {
          setError('No session data found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [location.state]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.status !== 'in-progress' || timeLeft <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmitAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.status, isPaused]);

  // Auto-save answers periodically
  useEffect(() => {
    if (!session || Object.keys(answers).length === 0) return;

    const saveTimeout = setTimeout(async () => {
      try {
        // Convert to Record format
        const answersRecord: Record<string, string> = answers;
        await readingService.submitAllAnswers(session._id, answersRecord);
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 5000);

    return () => clearTimeout(saveTimeout);
  }, [answers, session?._id]);

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }, []);

  const handleSubmitAll = async () => {
    if (!session) return;
    
    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      // Submit all answers
      if (Object.keys(answers).length > 0) {
        await readingService.submitAllAnswers(session._id, answers);
      }

      // Complete the session
      const response = await readingService.completeSession(session._id);
      
      if (response.success) {
        navigate('/reading/feedback', {
          state: { sessionId: session._id },
        });
      } else {
        setError(response.error || 'Failed to complete session');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
      setIsSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (!session) return;
    
    if (window.confirm('Are you sure you want to abandon this test? Your progress will be lost.')) {
      try {
        await readingService.abandonSession(session._id);
        navigate('/reading');
      } catch (err) {
        console.error('Failed to abandon session:', err);
        navigate('/reading');
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return 'text-red-500';
    if (timeLeft <= 300) return 'text-orange-500';
    return 'text-[#7D3CFF]';
  };

  const currentQuestion = session?.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).filter((id) => answers[id]?.trim()).length;

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
            <p className="mt-4 text-[#666] dark:text-gray-400">Loading reading test...</p>
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

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md mx-4 shadow-xl">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#333] dark:text-white mb-2">Test Paused</h2>
            <p className="text-[#666] dark:text-gray-400 mb-6">
              Timer paused at {formatTime(timeLeft)}. Your progress is saved.
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-[#7D3CFF] text-white px-8 py-3 rounded-lg hover:bg-[#6B2FE6] transition-colors font-medium"
            >
              Resume Test
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
        {/* Top Bar */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#333] dark:text-white">
              {session.passage.title}
            </h1>
            <p className="text-[#777] dark:text-gray-400 text-sm">
              {session.examType} • {session.difficulty}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${getTimeColor()} ${isPaused ? 'opacity-50' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-lg transition-colors ${
                  isPaused 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200' 
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200'
                }`}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Progress */}
            <div className="text-sm text-[#666] dark:text-gray-400">
              {answeredCount}/{session.questions.length} answered
            </div>
            
            {/* Abandon Button */}
            <button
              onClick={handleAbandon}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Abandon
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden mb-4">
          <div className="flex rounded-lg overflow-hidden border border-[#E8DCFF] dark:border-gray-600">
            <button
              onClick={() => setShowPassage(true)}
              className={`flex-1 py-2 text-sm ${showPassage ? 'bg-[#7D3CFF] text-white' : 'bg-white dark:bg-gray-800 text-[#666] dark:text-gray-300'}`}
            >
              Passage
            </button>
            <button
              onClick={() => setShowPassage(false)}
              className={`flex-1 py-2 text-sm ${!showPassage ? 'bg-[#7D3CFF] text-white' : 'bg-white dark:bg-gray-800 text-[#666] dark:text-gray-300'}`}
            >
              Questions
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Passage Section */}
          <div className={`${showPassage ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm sticky top-4">
              <h3 className="font-semibold text-lg mb-4 text-[#333] dark:text-white">
                {session.passage.title}
              </h3>
              <div className="h-[65vh] overflow-y-auto text-[#333] dark:text-gray-200 leading-relaxed pr-2">
{session.passage.paragraphs && session.passage.paragraphs.length > 0 ? (
                  session.passage.paragraphs.map((para, idx) => (
                    <p
                      key={idx}
                      className={`mb-4 p-2 rounded transition-colors ${
                        highlightedParagraph === idx
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : ''
                      }`}
                      onClick={() => setHighlightedParagraph(highlightedParagraph === idx ? null : idx)}
                    >
                      <span className="text-xs font-bold text-[#7D3CFF] dark:text-[#A78BFA] mr-2">[{indexToLetter(idx)}]</span>
                      {para.content || para.text}
                    </p>
                  ))
                ) : (
                  <p className="mb-4 whitespace-pre-wrap">{session.passage.content}</p>
                )}
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className={`${!showPassage ? 'block' : 'hidden'} lg:block space-y-4`}>
            {/* Current Question */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#333] dark:text-white">
                  Question {currentQuestionIndex + 1} of {session.questions.length}
                </h3>
                <span className="text-sm text-[#7D3CFF] bg-[#F8F5FF] dark:bg-[#7D3CFF]/20 px-2 py-1 rounded">
                  {readingService.getQuestionTypeDisplayName(currentQuestion?.questionType as QuestionType)}
                </span>
              </div>

              {currentQuestion && (
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion._id] || ''}
                  onAnswerChange={(answer) => handleAnswerChange(currentQuestion._id, answer)}
                  onHighlightParagraph={setHighlightedParagraph}
                />
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-4 border-t border-[#F0E8FF] dark:border-gray-700">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-[#A78BFA] px-4 py-2 rounded-lg hover:bg-[#E8DCFF] dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  ← Previous
                </button>
                
                {currentQuestionIndex === session.questions.length - 1 ? (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                  >
                    Submit All
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(session.questions.length - 1, prev + 1))}
                    className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>

            {/* Question Navigator */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h4 className="font-medium mb-3 text-[#333] dark:text-white text-sm">Question Navigator</h4>
              <div className="grid grid-cols-7 gap-2">
                {session.questions.map((q, idx) => {
                  const isAnswered = answers[q._id]?.trim();
                  const isCurrent = idx === currentQuestionIndex;
                  
                  return (
                    <button
                      key={`nav-${idx}-${q._id}`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        isCurrent
                          ? 'bg-[#7D3CFF] text-white ring-2 ring-[#7D3CFF] ring-offset-2 dark:ring-offset-gray-800'
                          : isAnswered
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-[#F8F9FF] dark:bg-gray-700 text-[#666] dark:text-gray-300'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs text-[#777] dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-[#7D3CFF]"></span>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-[#F8F9FF] dark:bg-gray-700"></span>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>

            {/* Submit Button (always visible) */}
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
              className="w-full bg-[#7D3CFF] text-white py-3 rounded-xl hover:bg-[#6B2FE6] disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit All Answers'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-[#333] dark:text-white">Submit Test?</h3>
            <p className="text-[#666] dark:text-gray-400 mb-4">
              You have answered <strong>{answeredCount}</strong> of <strong>{session.questions.length}</strong> questions.
            </p>
            {answeredCount < session.questions.length && (
              <p className="text-orange-500 text-sm mb-4">
                ⚠️ You have {session.questions.length - answeredCount} unanswered questions.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-[#333] dark:text-white py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Continue Test
              </button>
              <button
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Question Renderer Component
interface QuestionRendererProps {
  question: ReadingQuestion;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onHighlightParagraph: (idx: number | null) => void;
}

function QuestionRenderer({ question, answer, onAnswerChange, onHighlightParagraph }: QuestionRendererProps) {
  // Helper to extract letter from option like "A. Some text" or just "A"
  const extractLetter = (option: string): string => {
    const match = option.match(/^([A-Za-z])[\.\)\s:]/);
    if (match) return match[1].toUpperCase();
    // If option is already just a letter
    if (/^[A-Za-z]$/.test(option.trim())) return option.trim().toUpperCase();
    return option;
  };

  // Helper to check if answer matches option
  const isOptionSelected = (option: string): boolean => {
    const optionLetter = extractLetter(option);
    const answerLetter = extractLetter(answer);
    return optionLetter === answerLetter;
  };

  const renderQuestionContent = () => {
    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <p className="text-[#333] dark:text-white mb-4">{question.questionText}</p>
            {question.options?.map((option, idx) => {
              const letter = extractLetter(option);
              return (
                <label
                  key={idx}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                    isOptionSelected(option)
                      ? 'bg-[#7D3CFF]/10 border-2 border-[#7D3CFF]'
                      : 'bg-[#F8F9FF] dark:bg-gray-700 border-2 border-transparent hover:bg-[#E8DCFF] dark:hover:bg-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question._id}`}
                    checked={isOptionSelected(option)}
                    onChange={() => onAnswerChange(letter)}
                    className="text-[#7D3CFF] w-4 h-4"
                  />
                  <span className="text-[#333] dark:text-white">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case 'true_false_not_given':
      case 'yes_no_not_given':
        const options = question.questionType === 'true_false_not_given'
          ? ['True', 'False', 'Not Given']
          : ['Yes', 'No', 'Not Given'];
        return (
          <div className="space-y-3">
            <p className="text-[#333] dark:text-white mb-4">{question.questionText}</p>
            {options.map((option) => (
              <label
                key={option}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                  answer === option
                    ? 'bg-[#7D3CFF]/10 border-2 border-[#7D3CFF]'
                    : 'bg-[#F8F9FF] dark:bg-gray-700 border-2 border-transparent hover:bg-[#E8DCFF] dark:hover:bg-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question._id}`}
                  checked={answer === option}
                  onChange={() => onAnswerChange(option)}
                  className="text-[#7D3CFF] w-4 h-4"
                />
                <span className="text-[#333] dark:text-white">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'sentence_completion':
      case 'summary_completion':
      case 'short_answer':
      case 'diagram_labelling':
        return (
          <div>
            <p className="text-[#333] dark:text-white mb-4">{question.questionText}</p>
            {question.instructions && (
              <p className="text-sm text-[#777] dark:text-gray-400 mb-3 italic">{question.instructions}</p>
            )}
            <input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
            />
          </div>
        );

      case 'matching_headings':
      case 'matching_information':
      case 'matching_features':
      case 'matching_sentence_endings':
        return (
          <div>
            <p className="text-[#333] dark:text-white mb-4">{question.questionText}</p>
            {question.instructions && (
              <p className="text-sm text-[#777] dark:text-gray-400 mb-3 italic">{question.instructions}</p>
            )}
            {question.options && question.options.length > 0 ? (
              <div className="space-y-2">
                {question.options.map((option, idx) => {
                  const letter = extractLetter(option);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isOptionSelected(option)
                          ? 'bg-[#7D3CFF]/10 border-2 border-[#7D3CFF]'
                          : 'bg-[#F8F9FF] dark:bg-gray-700 border-2 border-transparent hover:bg-[#E8DCFF] dark:hover:bg-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${question._id}`}
                        checked={isOptionSelected(option)}
                        onChange={() => onAnswerChange(letter)}
                        className="text-[#7D3CFF] w-4 h-4"
                      />
                      <span className="text-[#333] dark:text-white">{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value.toUpperCase())}
                placeholder="Enter letter (A, B, C, etc.)..."
                className="w-full p-3 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF] uppercase"
                maxLength={1}
              />
            )}
          </div>
        );

      case 'list_selection':
      case 'multiple_choice_multiple':
        return (
          <div>
            <p className="text-[#333] dark:text-white mb-4">{question.questionText}</p>
            {question.instructions && (
              <p className="text-sm text-[#777] dark:text-gray-400 mb-3 italic">{question.instructions}</p>
            )}
            <div className="space-y-2">
              {question.options?.map((option, idx) => {
                const letter = extractLetter(option);
                const selectedLetters = answer ? answer.split(',').filter(Boolean) : [];
                const isSelected = selectedLetters.includes(letter);
                return (
                  <label
                    key={idx}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#7D3CFF]/10 border-2 border-[#7D3CFF]'
                        : 'bg-[#F8F9FF] dark:bg-gray-700 border-2 border-transparent hover:bg-[#E8DCFF] dark:hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onAnswerChange([...selectedLetters, letter].join(','));
                        } else {
                          onAnswerChange(selectedLetters.filter((s) => s !== letter).join(','));
                        }
                      }}
                      className="text-[#7D3CFF] w-4 h-4 rounded"
                    />
                    <span className="text-[#333] dark:text-white">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'table_completion':
      case 'flow_chart_completion':
      case 'note_completion':
        return (
          <div>
            <p className="text-[#333] dark:text-white mb-4">{question.questionText}</p>
            {question.instructions && (
              <p className="text-sm text-[#777] dark:text-gray-400 mb-3 italic">{question.instructions}</p>
            )}
            <textarea
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={3}
              className="w-full p-3 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF] resize-none"
            />
          </div>
        );

      default:
        return (
          <div>
            <p className="text-[#333] dark:text-white mb-4">{question.questionText}</p>
            <input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
            />
          </div>
        );
    }
  };

  return (
    <div>
      {question.paragraphRef !== undefined && (
        <button
          onClick={() => onHighlightParagraph(question.paragraphRef!)}
          className="text-xs text-[#7D3CFF] hover:underline mb-2"
        >
          📍 Reference: Paragraph {indexToLetter(question.paragraphRef)}
        </button>
      )}
      {renderQuestionContent()}
    </div>
  );
}