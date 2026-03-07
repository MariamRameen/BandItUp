import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
  writingService, 
  WritingSession, 
  WritingStats, 
  RecentProgress 
} from '../../services/writingService';

export default function WritingHistory() {
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [stats, setStats] = useState<WritingStats | null>(null);
  const [recentProgress, setRecentProgress] = useState<RecentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Load data
  useEffect(() => {
    loadData();
  }, [page, statusFilter, taskTypeFilter, examTypeFilter]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build filter options
      const options: any = { page, limit };
      if (statusFilter) options.status = statusFilter;
      if (taskTypeFilter) options.taskType = parseInt(taskTypeFilter);
      if (examTypeFilter) options.examType = examTypeFilter;

      // Fetch sessions
      const sessionsResponse = await writingService.getSessions(options);
      if (sessionsResponse.success) {
        setSessions(sessionsResponse.sessions);
        setTotalPages(sessionsResponse.pagination.pages);
      }

      // Fetch stats (only on first load)
      if (page === 1) {
        const statsResponse = await writingService.getStats();
        if (statsResponse.success) {
          setStats(statsResponse.stats);
          setRecentProgress(statsResponse.recentProgress);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSession = (session: WritingSession) => {
    if (session.status === 'evaluated') {
      navigate(`/writing/feedback/${session._id}`, { state: { session } });
    } else if (session.status === 'draft') {
      // Continue draft
      navigate('/writing/practice', {
        state: {
          sessionId: session._id,
          taskType: session.taskType,
          examType: session.examType,
          task: session.task,
          savedEssay: session.essay,
        },
      });
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await writingService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s._id !== sessionId));
    } catch (err: any) {
      alert('Failed to delete session');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'evaluated':
        return (
          <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full">
            Evaluated
          </span>
        );
      case 'submitted':
        return (
          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
            Submitted
          </span>
        );
      case 'draft':
        return (
          <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-1 rounded-full">
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTaskTypeFilter('');
    setExamTypeFilter('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Writing History</h1>
            <p className="text-[#777] dark:text-gray-400 text-sm">View and track your writing progress</p>
          </div>
          <button
            onClick={() => navigate('/writing')}
            className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6] transition-colors"
          >
            New Practice
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-[#E0D8FF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                >
                  <option value="">All Status</option>
                  <option value="evaluated">Evaluated</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                </select>

                <select
                  value={taskTypeFilter}
                  onChange={(e) => { setTaskTypeFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-[#E0D8FF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                >
                  <option value="">All Tasks</option>
                  <option value="1">Task 1</option>
                  <option value="2">Task 2</option>
                </select>

                <select
                  value={examTypeFilter}
                  onChange={(e) => { setExamTypeFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-[#E0D8FF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7D3CFF]"
                >
                  <option value="">All Exam Types</option>
                  <option value="Academic">Academic</option>
                  <option value="General">General</option>
                </select>

                {(statusFilter || taskTypeFilter || examTypeFilter) && (
                  <button
                    onClick={clearFilters}
                    className="text-[#7D3CFF] text-sm hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#F0E8FF] dark:border-gray-700 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-[#7D3CFF]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">{error}</p>
                  <button
                    onClick={loadData}
                    className="mt-4 text-[#7D3CFF] hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#777] dark:text-gray-400 mb-4">No writing sessions found</p>
                  <button
                    onClick={() => navigate('/writing')}
                    className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg hover:bg-[#6B2FE6]"
                  >
                    Start Writing
                  </button>
                </div>
              ) : (
                <div>
                  {sessions.map((session) => (
                    <div
                      key={session._id}
                      onClick={() => handleViewSession(session)}
                      className="p-4 border-b border-[#F0E8FF] dark:border-gray-700 hover:bg-[#F8F9FF] dark:hover:bg-gray-700 cursor-pointer transition-colors last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium dark:text-white">
                              Task {session.taskType} - {session.examType}
                            </span>
                            {getStatusBadge(session.status)}
                          </div>
                          <p className="text-sm text-[#777] dark:text-gray-400 line-clamp-1 mb-2">
                            {session.task.prompt?.substring(0, 100)}...
                          </p>
                          <div className="flex gap-4 text-xs text-[#999] dark:text-gray-500">
                            <span>{formatDate(session.createdAt)}</span>
                            <span>{session.wordCount} words</span>
                            {session.evaluation && (
                              <span className="text-[#7D3CFF] dark:text-purple-400 font-medium">
                                Band {session.evaluation.overallBand.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {session.evaluation && (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                              style={{ backgroundColor: writingService.getBandColor(session.evaluation.overallBand) }}
                            >
                              {session.evaluation.overallBand.toFixed(1)}
                            </div>
                          )}
                          <button
                            onClick={(e) => handleDeleteSession(session._id, e)}
                            className="text-[#999] hover:text-red-500 p-1 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t border-[#F0E8FF] dark:border-gray-700">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border border-[#E0D8FF] dark:border-gray-600 text-sm disabled:opacity-50 hover:bg-[#F8F9FF] dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#777] dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border border-[#E0D8FF] dark:border-gray-600 text-sm disabled:opacity-50 hover:bg-[#F8F9FF] dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Stats */}
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 dark:text-white">Your Statistics</h3>
              {stats ? (
                <div>
                  <div className="text-center mb-4">
                    <div 
                      className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-2"
                      style={{ backgroundColor: writingService.getBandColor(stats.avgOverallBand) }}
                    >
                      {stats.avgOverallBand > 0 ? stats.avgOverallBand.toFixed(1) : '—'}
                    </div>
                    <p className="text-sm text-[#777] dark:text-gray-400">Average Band</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#F8F9FF] dark:bg-gray-700 p-3 rounded-lg text-center">
                      <p className="font-semibold text-[#7D3CFF] text-lg">{stats.totalSessions}</p>
                      <p className="text-xs text-[#777] dark:text-gray-400">Total Essays</p>
                    </div>
                    <div className="bg-[#F8F9FF] dark:bg-gray-700 p-3 rounded-lg text-center">
                      <p className="font-semibold text-[#7D3CFF] text-lg">{Math.round(stats.avgWordCount)}</p>
                      <p className="text-xs text-[#777] dark:text-gray-400">Avg Words</p>
                    </div>
                    <div className="bg-[#F8F9FF] dark:bg-gray-700 p-3 rounded-lg text-center">
                      <p className="font-semibold text-[#7D3CFF] text-lg">{stats.task1Count}</p>
                      <p className="text-xs text-[#777] dark:text-gray-400">Task 1</p>
                    </div>
                    <div className="bg-[#F8F9FF] dark:bg-gray-700 p-3 rounded-lg text-center">
                      <p className="font-semibold text-[#7D3CFF] text-lg">{stats.task2Count}</p>
                      <p className="text-xs text-[#777] dark:text-gray-400">Task 2</p>
                    </div>
                  </div>

                  {/* Criteria Averages */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#777] dark:text-gray-400">Task Response</span>
                      <span className="font-medium dark:text-white">
                        {stats.avgTaskResponse > 0 ? stats.avgTaskResponse.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777] dark:text-gray-400">Coherence</span>
                      <span className="font-medium dark:text-white">
                        {stats.avgCoherenceCohesion > 0 ? stats.avgCoherenceCohesion.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777] dark:text-gray-400">Vocabulary</span>
                      <span className="font-medium dark:text-white">
                        {stats.avgLexicalResource > 0 ? stats.avgLexicalResource.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777] dark:text-gray-400">Grammar</span>
                      <span className="font-medium dark:text-white">
                        {stats.avgGrammaticalRange > 0 ? stats.avgGrammaticalRange.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#777] dark:text-gray-400 text-sm">No stats yet</p>
                </div>
              )}
            </div>

            {/* Recent Progress */}
            {recentProgress.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold mb-4 dark:text-white">Recent Progress</h3>
                <div className="space-y-2">
                  {recentProgress.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[#777] dark:text-gray-400">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#999] dark:text-gray-500">T{item.taskType}</span>
                        <span 
                          className="font-medium"
                          style={{ color: writingService.getBandColor(item.band) }}
                        >
                          {item.band.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => navigate('/writing')}
              className="w-full bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] py-3 rounded-lg hover:bg-[#E8DCFF] dark:hover:bg-gray-600 transition-colors"
            >
              Back to Writing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
