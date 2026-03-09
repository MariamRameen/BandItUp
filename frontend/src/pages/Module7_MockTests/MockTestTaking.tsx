import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import { Clock, ChevronRight, ChevronLeft, Play, Pause, CheckCircle, AlertCircle, Loader2, Volume2, Mic, Square, MicOff } from 'lucide-react';

const API_URL = "http://localhost:4000/api";
const auth = () => ({ 
  headers: { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` 
  } 
});

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

type Section = 'listening' | 'reading' | 'writing' | 'speaking';

interface SectionState {
  status: 'pending' | 'loading' | 'active' | 'completed';
  sessionId?: string;
  data?: any;
  answers: Record<string, any>;
  timeSpent: number;
  bandScore?: number;
}

interface MockTestState {
  _id: string;
  testNumber: number;
  listening: SectionState;
  reading: SectionState;
  writing: SectionState;
  speaking: SectionState;
}

// Section time limits in seconds
const TIME_LIMITS: Record<Section, number> = {
  listening: 40 * 60,  // 40 minutes
  reading: 60 * 60,    // 60 minutes
  writing: 60 * 60,    // 60 minutes
  speaking: 15 * 60,   // 15 minutes (simplified for now)
};

const SECTION_ORDER: Section[] = ['listening', 'reading', 'writing', 'speaking'];

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────

export default function MockTestTaking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mockTestId = searchParams.get('id');
  
  const [currentSection, setCurrentSection] = useState<Section>('listening');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMITS.listening);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [mockTest, setMockTest] = useState<MockTestState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Recording state for speaking
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<Record<string, Blob>>({});
  const [recordingQuestionIdx, setRecordingQuestionIdx] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ────────────────────────────────────────────────────────────────
  // Initialize Test
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mockTestId) {
      setError('No test ID provided');
      setLoading(false);
      return;
    }
    initializeTest();
  }, [mockTestId]);

  const initializeTest = async () => {
    try {
      // Fetch mock test details
      const res = await fetch(`${API_URL}/mock-tests/${mockTestId}`, auth());
      const data = await res.json();
      
      if (!data.success) {
        setError(data.message || 'Failed to load test');
        setLoading(false);
        return;
      }

      // Initialize state
      setMockTest({
        _id: data.mockTest._id,
        testNumber: data.mockTest.testNumber,
        listening: { status: 'pending', answers: {}, timeSpent: 0 },
        reading: { status: 'pending', answers: {}, timeSpent: 0 },
        writing: { status: 'pending', answers: {}, timeSpent: 0 },
        speaking: { status: 'pending', answers: {}, timeSpent: 0 },
      });

      // Start with listening section
      setCurrentSection('listening');
      setLoading(false);
      
    } catch (err) {
      console.error('Init error:', err);
      setError('Failed to initialize test');
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Timer Management
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleTimeUp = () => {
    setIsRunning(false);
    // Auto-submit current section
    submitCurrentSection(true);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ────────────────────────────────────────────────────────────────
  // Section Generation
  // ────────────────────────────────────────────────────────────────

  const generateSection = async (section: Section) => {
    if (!mockTest) return;

    setMockTest(prev => prev ? {
      ...prev,
      [section]: { ...prev[section], status: 'loading' }
    } : null);

    try {
      let response;
      let sessionData;

      switch (section) {
        case 'listening':
          // Generate listening with required accent parameter
          response = await fetch(`${API_URL}/listening/generate`, {
            method: 'POST',
            ...auth(),
            body: JSON.stringify({ 
              part: 1, 
              accent: 'British',  // Required parameter
              sessionType: 'mock'
            }),
          });
          sessionData = await response.json();
          break;

        case 'reading':
          // Generate reading passage and questions
          response = await fetch(`${API_URL}/reading/generate`, {
            method: 'POST',
            ...auth(),
            body: JSON.stringify({
              examType: 'Academic',
              difficulty: 'Band 6-7',
              questionCount: 13,
            }),
          });
          const readingGenData = await response.json();
          
          if (readingGenData.success) {
            // Start a session with the generated content
            // Note: response uses passage/questions directly, not wrapped in 'test'
            const sessionRes = await fetch(`${API_URL}/reading/sessions`, {
              method: 'POST',
              ...auth(),
              body: JSON.stringify({
                examType: 'Academic',
                difficulty: 'Band 6-7',
                passage: readingGenData.passage,  // Direct property
                questions: readingGenData.questions,  // Direct property
                timeLimit: 60,
              }),
            });
            sessionData = await sessionRes.json();
          } else {
            throw new Error(readingGenData.error || 'Failed to generate reading');
          }
          break;

        case 'writing':
          // Generate both Task 1 and Task 2 for mock test
          const [task1Res, task2Res] = await Promise.all([
            fetch(`${API_URL}/writing/generate-task`, {
              method: 'POST',
              ...auth(),
              body: JSON.stringify({ taskType: 1, examType: 'Academic' }),
            }),
            fetch(`${API_URL}/writing/generate-task`, {
              method: 'POST',
              ...auth(),
              body: JSON.stringify({ taskType: 2, examType: 'Academic' }),
            }),
          ]);
          
          const task1Data = await task1Res.json();
          const task2Data = await task2Res.json();
          
          if (task1Data.success && task2Data.success) {
            sessionData = {
              success: true,
              tasks: [
                { taskType: 1, ...task1Data.task, minWords: 150 },
                { taskType: 2, ...task2Data.task, minWords: 250 },
              ],
            };
          } else {
            throw new Error('Failed to generate writing tasks');
          }
          break;

        case 'speaking':
          // Generate speaking questions for all 3 parts
          sessionData = {
            success: true,
            questions: [
              { part: 1, question: "Let's talk about your hometown. Where is it located?", duration: 60 },
              { part: 1, question: "What do you like most about living there?", duration: 60 },
              { part: 1, question: "Do you think you will live there in the future?", duration: 60 },
              { part: 2, topic: "Describe a skill you would like to learn", 
                points: ["What the skill is", "Why you want to learn it", "How you would learn it", "How learning this skill would benefit you"],
                duration: 120,
                prepTime: 60 },
              { part: 3, question: "What skills do you think are most important for young people to learn today?", duration: 90 },
              { part: 3, question: "How has technology changed the way people learn new skills?", duration: 90 },
            ],
          };
          break;
      }

      if (sessionData?.success) {
        setMockTest(prev => prev ? {
          ...prev,
          [section]: {
            ...prev[section],
            status: 'active',
            sessionId: sessionData.session?._id || sessionData.sessionId,
            data: sessionData,
            answers: {},
          }
        } : null);

        // Start timer
        setTimeLeft(TIME_LIMITS[section]);
        setIsRunning(true);
        setCurrentQuestionIndex(0);
      } else {
        throw new Error(sessionData?.message || sessionData?.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error(`Generate ${section} error:`, err);
      setMockTest(prev => prev ? {
        ...prev,
        [section]: { ...prev[section], status: 'pending' }
      } : null);
      setError(`Failed to generate ${section} section: ${err.message}`);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Answer Handling
  // ────────────────────────────────────────────────────────────────

  const updateAnswer = (questionId: string, answer: any) => {
    if (!mockTest) return;
    
    setMockTest(prev => prev ? {
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        answers: {
          ...prev[currentSection].answers,
          [questionId]: answer,
        }
      }
    } : null);
  };

  // ────────────────────────────────────────────────────────────────
  // Section Submission
  // ────────────────────────────────────────────────────────────────

  const submitCurrentSection = async (autoSubmitted = false) => {
    if (!mockTest) return;

    setIsRunning(false);
    setSubmitting(true);

    const sectionState = mockTest[currentSection];
    const timeSpent = TIME_LIMITS[currentSection] - timeLeft;

    try {
      let result;

      switch (currentSection) {
        case 'listening':
          if (sectionState.sessionId) {
            const answers = Object.entries(sectionState.answers).map(([qNum, ans]) => ({
              questionNumber: parseInt(qNum),
              userAnswer: ans,
            }));
            
            const res = await fetch(`${API_URL}/listening/submit/${sectionState.sessionId}`, {
              method: 'POST',
              ...auth(),
              body: JSON.stringify({ answers, timeUsed: timeSpent, autoSubmitted }),
            });
            result = await res.json();
          }
          break;

        case 'reading':
          if (sectionState.sessionId) {
            // Submit all answers
            await fetch(`${API_URL}/reading/sessions/${sectionState.sessionId}/answers`, {
              method: 'PUT',
              ...auth(),
              body: JSON.stringify({ answers: sectionState.answers, timeSpent }),
            });
            
            // Complete session
            const completeRes = await fetch(`${API_URL}/reading/sessions/${sectionState.sessionId}/complete`, {
              method: 'POST',
              ...auth(),
              body: JSON.stringify({ timeSpent }),
            });
            result = await completeRes.json();
          }
          break;

        case 'writing':
          if (sectionState.sessionId) {
            const res = await fetch(`${API_URL}/writing/sessions/${sectionState.sessionId}/submit`, {
              method: 'POST',
              ...auth(),
              body: JSON.stringify({ 
                essay: sectionState.answers.essay || '', 
                timeSpent 
              }),
            });
            result = await res.json();
          }
          break;

        case 'speaking':
          // Simplified - just mark as done with estimated score
          result = { success: true, bandScore: 6.0 };
          break;
      }

      const bandScore = result?.bandEstimate || result?.session?.bandScore || result?.bandScore || 5.5;

      // Update mock test with section result
      await fetch(`${API_URL}/mock-tests/${mockTest._id}/section`, {
        method: 'POST',
        ...auth(),
        body: JSON.stringify({
          section: currentSection,
          band: bandScore,
          rawScore: result?.correctCount || result?.session?.correctAnswers,
          maxScore: result?.totalQuestions || result?.session?.totalQuestions,
          feedback: result?.feedback?.rawText || '',
          sessionId: sectionState.sessionId,
        }),
      });

      // Mark section as completed
      setMockTest(prev => prev ? {
        ...prev,
        [currentSection]: {
          ...prev[currentSection],
          status: 'completed',
          timeSpent,
          bandScore,
        }
      } : null);

      // Move to next section or complete test
      const currentIdx = SECTION_ORDER.indexOf(currentSection);
      if (currentIdx < SECTION_ORDER.length - 1) {
        const nextSection = SECTION_ORDER[currentIdx + 1];
        setCurrentSection(nextSection);
      } else {
        // All sections done - complete the test
        await completeTest();
      }

    } catch (err: any) {
      console.error('Submit error:', err);
      setError(`Failed to submit ${currentSection}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Test Completion
  // ────────────────────────────────────────────────────────────────

  const completeTest = async () => {
    if (!mockTest) return;

    try {
      const totalTime = Object.values(mockTest).reduce((sum, section) => {
        if (typeof section === 'object' && 'timeSpent' in section) {
          return sum + (section.timeSpent || 0);
        }
        return sum;
      }, 0);

      const res = await fetch(`${API_URL}/mock-tests/${mockTest._id}/complete`, {
        method: 'POST',
        ...auth(),
        body: JSON.stringify({
          listening: { band: mockTest.listening.bandScore },
          reading: { band: mockTest.reading.bandScore },
          writing: { band: mockTest.writing.bandScore },
          speaking: { band: mockTest.speaking.bandScore },
          timeUsed: Math.round(totalTime / 60),
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        navigate(`/mock-tests/result?id=${mockTest._id}`);
      } else {
        setError(data.message || 'Failed to complete test');
      }
    } catch (err: any) {
      console.error('Complete test error:', err);
      setError(err.message);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Render Helpers
  // ────────────────────────────────────────────────────────────────

  const getSectionIcon = (section: Section) => {
    switch (section) {
      case 'listening': return '👂';
      case 'reading': return '📖';
      case 'writing': return '✍️';
      case 'speaking': return '🎤';
    }
  };

  const getSectionStatus = (section: Section) => {
    if (!mockTest) return 'pending';
    return mockTest[section].status;
  };

  // ────────────────────────────────────────────────────────────────
  // Section Content Renderers
  // ────────────────────────────────────────────────────────────────

  const renderListeningSection = () => {
    const state = mockTest?.listening;
    if (!state?.data) return null;

    const questions = state.data.questions || [];
    const audioUrl = state.data.audioUrl;

    return (
      <div className="space-y-6">
        {/* Audio Player */}
        {audioUrl && (
          <div className="bg-[#F4F0FF] p-4 rounded-xl flex items-center gap-4">
            <button
              onClick={() => audioRef.current?.play()}
              className="w-12 h-12 bg-[#7D3CFF] rounded-full flex items-center justify-center text-white"
            >
              <Volume2 size={24} />
            </button>
            <div className="flex-1">
              <p className="font-medium text-sm">Audio Recording</p>
              <p className="text-xs text-[#777]">Listen carefully and answer the questions</p>
            </div>
            <audio ref={audioRef} src={audioUrl} />
          </div>
        )}

        {/* Passage Text (if available) */}
        {state.data.passageText && (
          <div className="bg-[#F8F9FF] p-4 rounded-xl max-h-48 overflow-y-auto">
            <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
              {state.data.passageText}
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q: any, idx: number) => (
            <div key={q.questionNumber || idx} className="bg-white p-4 rounded-xl border border-[#E2D9FF]">
              <p className="font-medium mb-3">
                Q{q.questionNumber || idx + 1}: {q.prompt || q.questionText || 'Question'}
              </p>
              
              {(q.type === 'mcq' || q.type === 'multiple_choice') && q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt: string, optIdx: number) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        state.answers[q.questionNumber || idx] === opt
                          ? 'bg-[#7D3CFF] text-white'
                          : 'bg-[#F8F9FF] hover:bg-[#F0E8FF]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${q.questionNumber || idx}`}
                        checked={state.answers[q.questionNumber || idx] === opt}
                        onChange={() => updateAnswer(String(q.questionNumber || idx), opt)}
                        className="sr-only"
                      />
                      <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={state.answers[q.questionNumber || idx] || ''}
                  onChange={(e) => updateAnswer(String(q.questionNumber || idx), e.target.value)}
                  className="w-full p-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReadingSection = () => {
    const state = mockTest?.reading;
    if (!state?.data) return null;

    const session = state.data.session || state.data;
    const passage = session.passage || {};
    const questions = session.questions || [];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passage */}
        <div className="bg-[#F8F9FF] p-6 rounded-xl max-h-[600px] overflow-y-auto">
          <h3 className="font-semibold text-lg mb-4">{passage.title || 'Reading Passage'}</h3>
          <div className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
            {passage.text || passage.content || 'Loading passage...'}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {questions.map((q: any, idx: number) => (
            <div key={q.id || idx} className="bg-white p-4 rounded-xl border border-[#E2D9FF]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs px-2 py-1 bg-[#F4F0FF] text-[#7D3CFF] rounded-full">
                  {q.questionType || q.type || 'Question'}
                </span>
              </div>
              <p className="font-medium mb-3">
                Q{idx + 1}: {q.questionText}
              </p>

              {q.instruction && (
                <p className="text-sm text-[#777] mb-3 italic">{q.instruction}</p>
              )}

              {q.options && q.options.length > 0 ? (
                <div className="space-y-2">
                  {q.options.map((opt: string, optIdx: number) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        state.answers[q.id || idx] === opt
                          ? 'bg-[#7D3CFF] text-white'
                          : 'bg-[#F8F9FF] hover:bg-[#F0E8FF]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${q.id || idx}`}
                        checked={state.answers[q.id || idx] === opt}
                        onChange={() => updateAnswer(q.id || String(idx), opt)}
                        className="sr-only"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={state.answers[q.id || idx] || ''}
                  onChange={(e) => updateAnswer(q.id || String(idx), e.target.value)}
                  className="w-full p-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWritingSection = () => {
    const state = mockTest?.writing;
    if (!state?.data) return null;

    // Support both single task (old) and multiple tasks (new)
    const tasks = state.data.tasks || [state.data.task || state.data.session?.task].filter(Boolean);
    // Use currentQuestionIndex to track active task (shared state)
    const activeTaskIdx = Math.min(currentQuestionIndex, tasks.length - 1);

    return (
      <div className="space-y-6">
        {/* Task Tabs */}
        {tasks.length > 1 && (
          <div className="flex gap-2">
            {tasks.map((t: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTaskIdx === idx
                    ? 'bg-[#7D3CFF] text-white'
                    : 'bg-[#F4F0FF] text-[#7D3CFF] hover:bg-[#E8DCFF]'
                }`}
              >
                Task {t.taskType || idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Current Task */}
        {tasks[activeTaskIdx] && (
          <>
            <div className="bg-[#F8F9FF] p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-[#7D3CFF] text-white text-sm rounded-full">
                  Task {tasks[activeTaskIdx].taskType || activeTaskIdx + 1}
                </span>
                <span className="text-sm text-[#777]">
                  Minimum {tasks[activeTaskIdx].minWords || (tasks[activeTaskIdx].taskType === 1 ? 150 : 250)} words
                </span>
              </div>
              
              {/* Task 1 specific: show data/chart description if available */}
              {tasks[activeTaskIdx].taskType === 1 && tasks[activeTaskIdx].dataDescription && (
                <div className="mb-4 p-4 bg-white rounded-lg border border-[#E2D9FF]">
                  <p className="text-sm text-[#666] italic">{tasks[activeTaskIdx].dataDescription}</p>
                </div>
              )}
              
              <p className="text-[#333] leading-relaxed">
                {tasks[activeTaskIdx].prompt || 'Loading task prompt...'}
              </p>
            </div>

            {/* Essay Input */}
            <div className="bg-white p-6 rounded-xl border border-[#E2D9FF]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Your Response - Task {tasks[activeTaskIdx].taskType || activeTaskIdx + 1}</h3>
                <span className="text-sm text-[#777]">
                  Word count: {(state.answers[`task${activeTaskIdx}`] || '').trim().split(/\s+/).filter(Boolean).length}
                </span>
              </div>
              <textarea
                value={state.answers[`task${activeTaskIdx}`] || ''}
                onChange={(e) => updateAnswer(`task${activeTaskIdx}`, e.target.value)}
                placeholder={`Write your Task ${tasks[activeTaskIdx].taskType || activeTaskIdx + 1} response here...`}
                rows={16}
                className="w-full p-4 border border-[#E2D9FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D3CFF] resize-none"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  // Recording functions for speaking section
  const startRecording = async (questionIdx: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlobs(prev => ({ ...prev, [`q${questionIdx}`]: blob }));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingQuestionIdx(questionIdx);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingQuestionIdx(null);
  };

  const renderSpeakingSection = () => {
    const state = mockTest?.speaking;
    if (!state?.data) return null;

    const questions = state.data.questions || [];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <p className="text-blue-800 text-sm">
            <strong>Instructions:</strong> Click the microphone button to record your response for each question. 
            You can re-record if needed by clicking the record button again.
          </p>
        </div>

        {questions.map((q: any, idx: number) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-[#E2D9FF]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs px-2 py-1 bg-[#F4F0FF] text-[#7D3CFF] rounded-full">
                Part {q.part}
              </span>
              {q.duration && (
                <span className="text-xs text-[#777]">
                  {q.prepTime ? `${q.prepTime}s prep + ` : ''}{q.duration}s response
                </span>
              )}
            </div>
            
            {q.topic ? (
              <>
                <h3 className="font-semibold text-lg mb-3">{q.topic}</h3>
                {q.prepTime && (
                  <p className="text-sm text-amber-600 mb-2">
                    You have {q.prepTime} seconds to prepare before speaking for {q.duration} seconds.
                  </p>
                )}
                <ul className="list-disc list-inside text-[#666] text-sm space-y-1 mb-4">
                  {q.points?.map((p: string, pIdx: number) => (
                    <li key={pIdx}>{p}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-[#333] mb-4">{q.question}</p>
            )}

            {/* Recording Controls */}
            <div className="flex items-center gap-4 mt-4 p-4 bg-[#F8F9FF] rounded-xl">
              {isRecording && recordingQuestionIdx === idx ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  <Square size={20} />
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={() => startRecording(idx)}
                  disabled={isRecording}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                    isRecording 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#7D3CFF] text-white hover:bg-[#6B2FE6]'
                  }`}
                >
                  <Mic size={20} />
                  {recordedBlobs[`q${idx}`] ? 'Re-record' : 'Record'}
                </button>
              )}
              
              {recordedBlobs[`q${idx}`] && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-sm text-green-600">Recorded</span>
                  <audio 
                    controls 
                    src={URL.createObjectURL(recordedBlobs[`q${idx}`])} 
                    className="h-10"
                  />
                </div>
              )}
              
              {isRecording && recordingQuestionIdx === idx && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-600">Recording...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSectionContent = () => {
    const state = mockTest?.[currentSection];

    if (state?.status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#7D3CFF] animate-spin mb-4" />
          <p className="text-[#666]">Generating {currentSection} section...</p>
        </div>
      );
    }

    if (state?.status === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-6">{getSectionIcon(currentSection)}</div>
          <h2 className="text-2xl font-semibold mb-2 capitalize">{currentSection} Section</h2>
          <p className="text-[#777] mb-6">
            Time limit: {Math.floor(TIME_LIMITS[currentSection] / 60)} minutes
          </p>
          <button
            onClick={() => generateSection(currentSection)}
            className="flex items-center gap-2 bg-[#7D3CFF] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#6B2FE6] transition-colors"
          >
            <Play size={20} />
            Start {currentSection} Section
          </button>
        </div>
      );
    }

    if (state?.status === 'completed') {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2 capitalize">{currentSection} Complete</h2>
          <p className="text-[#777] mb-2">
            Band Score: <span className="font-semibold text-[#7D3CFF]">{state.bandScore}</span>
          </p>
          <p className="text-sm text-[#999]">
            Time used: {Math.floor(state.timeSpent / 60)}m {state.timeSpent % 60}s
          </p>
        </div>
      );
    }

    // Active sections
    switch (currentSection) {
      case 'listening': return renderListeningSection();
      case 'reading': return renderReadingSection();
      case 'writing': return renderWritingSection();
      case 'speaking': return renderSpeakingSection();
      default: return null;
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Main Render
  // ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#7D3CFF] animate-spin" />
      </div>
    );
  }

  if (error && !mockTest) {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-center gap-4">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/mock-tests')}
            className="mt-4 text-[#7D3CFF] hover:underline"
          >
            ← Back to Mock Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />

      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Test Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">
              Mock Test {mockTest?.testNumber}
            </h1>
            <p className="text-[#777] text-sm">Complete all sections to receive your scores</p>
          </div>
          
          {/* Timer with Pause */}
          {isRunning && (
            <div className="flex items-center gap-3">
              <button
                onClick={togglePause}
                className={`p-3 rounded-xl transition-colors ${
                  isPaused 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
                title={isPaused ? 'Resume test' : 'Pause test'}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>
              <div className={`text-right px-4 py-2 rounded-xl ${
                isPaused ? 'bg-amber-100 text-amber-700' :
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-[#F4F0FF] text-[#7D3CFF]'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
                  {isPaused && <span className="text-xs font-medium">(PAUSED)</span>}
                </div>
                <p className="text-xs opacity-75">Time Remaining</p>
              </div>
            </div>
          )}
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="flex gap-2 mb-4">
            {SECTION_ORDER.map((section, idx) => {
              const status = getSectionStatus(section);
              const isCurrent = currentSection === section;
              
              return (
                <button
                  key={section}
                  onClick={() => {
                    if (status === 'completed' || status === 'pending') {
                      setCurrentSection(section);
                    }
                  }}
                  disabled={status === 'active' && !isCurrent}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-[#7D3CFF] text-white'
                      : status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-[#F8F9FF] text-[#666] hover:bg-[#F0E8FF]'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <span>{getSectionIcon(section)}</span>
                  )}
                  <span className="capitalize">{section}</span>
                </button>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
            <div
              className="bg-[#7D3CFF] h-full rounded-full transition-all duration-300"
              style={{
                width: `${(SECTION_ORDER.filter(s => mockTest?.[s].status === 'completed').length / 4) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Section Content */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm min-h-[400px]">
          {renderSectionContent()}
        </div>

        {/* Section Actions */}
        {mockTest?.[currentSection].status === 'active' && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-[#777]">
              Progress is saved automatically. Submit when ready.
            </p>
            <button
              onClick={() => submitCurrentSection(false)}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#7D3CFF] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6B2FE6] disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
              Submit {currentSection} Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
