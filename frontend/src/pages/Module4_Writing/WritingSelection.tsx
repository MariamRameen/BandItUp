import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { writingService, WritingTask, WritingSession, WritingStats, RecentProgress } from '../../services/writingService';

const TOPICS = [
  'Education',
  'Technology',
  'Environment',
  'Health',
  'Society',
  'Work',
  'Government',
  'Culture',
  'Media',
  'Globalization',
];

const ESSAY_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'opinion', label: 'Opinion (Agree/Disagree)' },
  { value: 'discussion', label: 'Discussion (Both Views)' },
  { value: 'problem-solution', label: 'Problem-Solution' },
  { value: 'advantages-disadvantages', label: 'Advantages-Disadvantages' },
];

const CHART_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'line graph', label: 'Line Graph' },
  { value: 'bar chart', label: 'Bar Chart' },
  { value: 'pie chart', label: 'Pie Chart' },
  { value: 'table', label: 'Table' },
  { value: 'process diagram', label: 'Process Diagram' },
  { value: 'map', label: 'Map' },
];

const LETTER_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'formal', label: 'Formal' },
  { value: 'semi-formal', label: 'Semi-formal' },
  { value: 'informal', label: 'Informal' },
];

export default function WritingSelection() {
  const navigate = useNavigate();
  const [examType, setExamType] = useState<'Academic' | 'General'>('Academic');
  const [selectedTaskType, setSelectedTaskType] = useState<1 | 2 | null>(null);
  const [topic, setTopic] = useState('');
  const [essayType, setEssayType] = useState('');
  const [chartType, setChartType] = useState('');
  const [letterType, setLetterType] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<WritingTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<WritingStats | null>(null);
  const [recentProgress, setRecentProgress] = useState<RecentProgress[]>([]);
  const [drafts, setDrafts] = useState<WritingSession[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  // Load user stats and drafts on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load stats
        const statsResponse = await writingService.getStats();
        if (statsResponse.success) {
          setStats(statsResponse.stats);
          setRecentProgress(statsResponse.recentProgress);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setIsLoadingStats(false);
      }

      try {
        // Load drafts
        const draftsResponse = await writingService.getSessions({ status: 'draft', limit: 5 });
        if (draftsResponse.success) {
          setDrafts(draftsResponse.sessions);
        }
      } catch (err) {
        console.error('Failed to load drafts:', err);
      } finally {
        setIsLoadingDrafts(false);
      }
    };

    loadData();
  }, []);

  const handleGenerateTask = async () => {
    if (!selectedTaskType) {
      setError('Please select a task type first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedTask(null);

    try {
      const options: any = {};
      
      if (selectedTaskType === 2) {
        if (topic) options.topic = topic;
        if (essayType) options.essayType = essayType;
      } else if (selectedTaskType === 1) {
        if (examType === 'Academic') {
          if (chartType) options.chartType = chartType;
          if (topic) options.topic = topic;
        } else {
          if (letterType) options.letterType = letterType;
        }
      }

      const response = await writingService.generateTask(selectedTaskType, examType, options);
      
      if (response.success) {
        setGeneratedTask(response.task);
      } else {
        setError(response.error || 'Failed to generate task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate task');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartPractice = async () => {
    if (!generatedTask || !selectedTaskType) return;

    try {
      // Create session and navigate to practice
      const response = await writingService.createSession(
        selectedTaskType,
        examType,
        generatedTask
      );

      if (response.success) {
        navigate('/writing/practice', {
          state: {
            sessionId: response.session._id || response.session.id,
            taskType: selectedTaskType,
            examType,
            task: generatedTask,
          },
        });
      } else {
        setError('Failed to create session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start practice');
    }
  };

  const handleContinueDraft = (session: WritingSession) => {
    navigate('/writing/practice', {
      state: {
        sessionId: session._id,
        taskType: session.taskType,
        examType: session.examType,
        task: session.task,
        savedEssay: session.essay,
      },
    });
  };

  const getAvgBand = () => {
    if (!stats || stats.totalSessions === 0) return '—';
    return stats.avgOverallBand.toFixed(1);
  };

  const taskDescriptions = {
    task1Academic: {
      title: 'Task 1 - Report',
      description: 'Describe, summarize or explain information from a chart, graph, table or diagram',
      duration: '20 minutes',
      words: 'Min. 150 words',
    },
    task1General: {
      title: 'Task 1 - Letter',
      description: 'Write a letter requesting information or explaining a situation',
      duration: '20 minutes',
      words: 'Min. 150 words',
    },
    task2: {
      title: 'Task 2 - Essay',
      description: 'Write an essay in response to a point of view, argument or problem',
      duration: '40 minutes',
      words: 'Min. 250 words',
    },
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Writing Practice</h1>
          <p className="text-[#777] dark:text-gray-400 text-sm">Select a writing task to practice and improve your skills</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Selection Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exam Type Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Exam Type</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => { setExamType('Academic'); setSelectedTaskType(null); setGeneratedTask(null); }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    examType === 'Academic' 
                      ? 'bg-[#7D3CFF] text-white' 
                      : 'bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-purple-400'
                  }`}
                >
                  Academic
                </button>
                <button
                  onClick={() => { setExamType('General'); setSelectedTaskType(null); setGeneratedTask(null); }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    examType === 'General' 
                      ? 'bg-[#7D3CFF] text-white' 
                      : 'bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-purple-400'
                  }`}
                >
                  General Training
                </button>
              </div>
            </div>

            {/* Task Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Select Task Type</h3>
              <div className="space-y-4">
                {/* Task 1 */}
                <div
                  onClick={() => { setSelectedTaskType(1); setGeneratedTask(null); }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTaskType === 1 
                      ? 'border-[#7D3CFF] bg-[#F8F9FF] dark:bg-gray-700' 
                      : 'border-[#F0E8FF] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#D0C8FF]'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-2 dark:text-white">
                    {examType === 'Academic' ? taskDescriptions.task1Academic.title : taskDescriptions.task1General.title}
                  </h3>
                  <p className="text-[#777] dark:text-gray-400 text-sm mb-3">
                    {examType === 'Academic' ? taskDescriptions.task1Academic.description : taskDescriptions.task1General.description}
                  </p>
                  <div className="flex gap-4 text-sm text-[#666] dark:text-gray-500">
                    <span>{examType === 'Academic' ? taskDescriptions.task1Academic.duration : taskDescriptions.task1General.duration}</span>
                    <span>•</span>
                    <span>{examType === 'Academic' ? taskDescriptions.task1Academic.words : taskDescriptions.task1General.words}</span>
                  </div>
                </div>

                {/* Task 2 */}
                <div
                  onClick={() => { setSelectedTaskType(2); setGeneratedTask(null); }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTaskType === 2 
                      ? 'border-[#7D3CFF] bg-[#F8F9FF] dark:bg-gray-700' 
                      : 'border-[#F0E8FF] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#D0C8FF]'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-2 dark:text-white">{taskDescriptions.task2.title}</h3>
                  <p className="text-[#777] dark:text-gray-400 text-sm mb-3">{taskDescriptions.task2.description}</p>
                  <div className="flex gap-4 text-sm text-[#666] dark:text-gray-500">
                    <span>{taskDescriptions.task2.duration}</span>
                    <span>•</span>
                    <span>{taskDescriptions.task2.words}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Options */}
            {selectedTaskType && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold mb-4 dark:text-white">Customize Task</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Topic (for Task 2 and Task 1 Academic) */}
                  {(selectedTaskType === 2 || (selectedTaskType === 1 && examType === 'Academic')) && (
                    <div>
                      <label className="block text-sm font-medium text-[#666] dark:text-gray-400 mb-2">
                        Topic (Optional)
                      </label>
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-3 border border-[#E0D8FF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                      >
                        <option value="">Random Topic</option>
                        {TOPICS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Essay Type (for Task 2) */}
                  {selectedTaskType === 2 && (
                    <div>
                      <label className="block text-sm font-medium text-[#666] dark:text-gray-400 mb-2">
                        Essay Type (Optional)
                      </label>
                      <select
                        value={essayType}
                        onChange={(e) => setEssayType(e.target.value)}
                        className="w-full p-3 border border-[#E0D8FF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                      >
                        {ESSAY_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Chart Type (for Task 1 Academic) */}
                  {selectedTaskType === 1 && examType === 'Academic' && (
                    <div>
                      <label className="block text-sm font-medium text-[#666] dark:text-gray-400 mb-2">
                        Chart Type (Optional)
                      </label>
                      <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="w-full p-3 border border-[#E0D8FF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                      >
                        {CHART_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Letter Type (for Task 1 General) */}
                  {selectedTaskType === 1 && examType === 'General' && (
                    <div>
                      <label className="block text-sm font-medium text-[#666] dark:text-gray-400 mb-2">
                        Letter Type (Optional)
                      </label>
                      <select
                        value={letterType}
                        onChange={(e) => setLetterType(e.target.value)}
                        className="w-full p-3 border border-[#E0D8FF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                      >
                        {LETTER_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerateTask}
                  disabled={isGenerating}
                  className="w-full mt-4 bg-[#7D3CFF] text-white py-3 rounded-lg hover:bg-[#6B2FE6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Task...
                    </>
                  ) : (
                    'Generate Task'
                  )}
                </button>

                {error && (
                  <p className="mt-3 text-red-500 text-sm text-center">{error}</p>
                )}
              </div>
            )}

            {/* Continue Drafts */}
            {drafts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold mb-4 dark:text-white">Continue Writing</h3>
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft._id}
                      onClick={() => handleContinueDraft(draft)}
                      className="p-4 border border-[#E0D8FF] dark:border-gray-600 rounded-lg cursor-pointer hover:bg-[#F8F9FF] dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm dark:text-white">
                            Task {draft.taskType} - {draft.examType}
                          </p>
                          <p className="text-xs text-[#777] dark:text-gray-400 mt-1 line-clamp-1">
                            {draft.task.prompt?.substring(0, 80)}...
                          </p>
                        </div>
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                          {draft.wordCount} words
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Task Preview</h3>
              {generatedTask ? (
                <div>
                  <div className="bg-[#F8F9FF] dark:bg-gray-700 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-sm font-semibold mb-2 dark:text-white">Question:</p>
                    <p className="text-sm text-[#333] dark:text-gray-300 mb-4 whitespace-pre-wrap">
                      {generatedTask.prompt}
                    </p>
                    {generatedTask.visualDescription && (
                      <div className="mt-3 pt-3 border-t border-[#E0D8FF] dark:border-gray-600">
                        <p className="text-sm font-semibold mb-2 dark:text-white">Visual Data:</p>
                        <p className="text-xs text-[#666] dark:text-gray-400">
                          {generatedTask.visualDescription}
                        </p>
                      </div>
                    )}
                    {generatedTask.bulletPoints && (
                      <div className="mt-3 pt-3 border-t border-[#E0D8FF] dark:border-gray-600">
                        <p className="text-sm font-semibold mb-2 dark:text-white">Include:</p>
                        <ul className="list-disc list-inside text-xs text-[#666] dark:text-gray-400">
                          {generatedTask.bulletPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[#666] dark:text-gray-400">
                    <p>• Write at least {selectedTaskType === 1 ? '150' : '250'} words</p>
                    <p>• Time limit: {selectedTaskType === 1 ? '20' : '40'} minutes</p>
                  </div>
                  <button
                    onClick={handleStartPractice}
                    className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg mt-4 hover:bg-[#6B2FE6] transition-colors"
                  >
                    Start Writing
                  </button>
                </div>
              ) : (
                <p className="text-[#777] dark:text-gray-400 text-sm">
                  {selectedTaskType 
                    ? 'Click "Generate Task" to create a new writing task'
                    : 'Select a task type to get started'}
                </p>
              )}
            </div>

            {/* Current Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-3 dark:text-white">Your Progress</h3>
              {isLoadingStats ? (
                <div className="flex justify-center py-4">
                  <svg className="animate-spin h-6 w-6 text-[#7D3CFF]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-4">
                    <div 
                      className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-2"
                      style={{ backgroundColor: stats ? writingService.getBandColor(stats.avgOverallBand) : '#7D3CFF' }}
                    >
                      {getAvgBand()}
                    </div>
                    <p className="text-sm text-[#777] dark:text-gray-400">Average Band Score</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center text-sm">
                    <div className="bg-[#F8F9FF] dark:bg-gray-700 p-3 rounded-lg">
                      <p className="font-semibold text-[#7D3CFF]">{stats?.totalSessions || 0}</p>
                      <p className="text-xs text-[#777] dark:text-gray-400">Essays Written</p>
                    </div>
                    <div className="bg-[#F8F9FF] dark:bg-gray-700 p-3 rounded-lg">
                      <p className="font-semibold text-[#7D3CFF]">{Math.round((stats?.avgWordCount || 0))}</p>
                      <p className="text-xs text-[#777] dark:text-gray-400">Avg. Words</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* View History Link */}
            <button
              onClick={() => navigate('/writing/history')}
              className="w-full bg-white dark:bg-gray-800 border border-[#F0E8FF] dark:border-gray-700 text-[#7D3CFF] py-3 rounded-lg hover:bg-[#F8F9FF] dark:hover:bg-gray-700 transition-colors"
            >
              View Writing History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}