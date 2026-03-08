import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { readingService, SessionSummary, ReadingStats, ExamType } from '../../services/readingService';

export default function ReadingHistory() {
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress' | 'abandoned'>('all');
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | ExamType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter, examTypeFilter, sortBy, page]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [sessionsResponse, statsResponse] = await Promise.all([
        readingService.getSessions({
          status: statusFilter === 'all' ? undefined : statusFilter,
          examType: examTypeFilter === 'all' ? undefined : examTypeFilter,
          sort: sortBy === 'newest' || sortBy === 'highest' ? 'desc' : 'asc',
          sortBy: sortBy === 'highest' || sortBy === 'lowest' ? 'bandScore' : 'createdAt',
          page,
          limit: LIMIT,
        }),
        page === 1 ? readingService.getStats() : Promise.resolve({ success: true, stats: stats }),
      ]);

      if (sessionsResponse.success) {
        if (page === 1) {
          setSessions(sessionsResponse.sessions);
        } else {
          setSessions((prev) => [...prev, ...sessionsResponse.sessions]);
        }
        setHasMore(sessionsResponse.sessions.length === LIMIT);
      } else {
        setError(sessionsResponse.error || 'Failed to load sessions');
      }

      if (statsResponse.success && statsResponse.stats) {
        setStats(statsResponse.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter: Partial<{
    status: typeof statusFilter;
    examType: typeof examTypeFilter;
    sort: typeof sortBy;
  }>) => {
    if (newFilter.status !== undefined) setStatusFilter(newFilter.status);
    if (newFilter.examType !== undefined) setExamTypeFilter(newFilter.examType);
    if (newFilter.sort !== undefined) setSortBy(newFilter.sort);
    setPage(1);
  };

  const handleDelete = async (sessionId: string) => {
    setIsDeleting(true);
    try {
      const response = await readingService.deleteSession(sessionId);
      if (response.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setDeleteConfirm(null);
      } else {
        setError(response.error || 'Failed to delete session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewSession = (session: SessionSummary) => {
    if (session.status === 'completed') {
      navigate('/reading/feedback', { state: { sessionId: session.id } });
    } else if (session.status === 'in-progress') {
      navigate('/reading/practice', { state: { sessionId: session.id } });
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: SessionSummary['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Completed</span>;
      case 'in-progress':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">In Progress</span>;
      case 'abandoned':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Abandoned</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333] dark:text-white">Reading History</h1>
            <p className="text-[#777] dark:text-gray-400 text-sm">View and manage your past reading sessions</p>
          </div>
          <button
            onClick={() => navigate('/reading')}
            className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]"
          >
            Start New Test
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Overview */}
            {stats && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold mb-4 text-[#333] dark:text-white">Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#777] dark:text-gray-400">Average Band</span>
                    <span className="font-semibold text-[#7D3CFF]">
                      {stats.avgBandScore > 0 ? stats.avgBandScore.toFixed(1) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#777] dark:text-gray-400">Total Tests</span>
                    <span className="font-semibold text-[#333] dark:text-white">{stats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#777] dark:text-gray-400">Accuracy</span>
                    <span className="font-semibold text-[#333] dark:text-white">{stats.overallAccuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#777] dark:text-gray-400">Best Score</span>
                    <span className="font-semibold text-green-500">{stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-[#F0E8FF] dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-4 text-[#333] dark:text-white">Filters</h3>
              
              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-sm text-[#777] dark:text-gray-400 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange({ status: e.target.value as typeof statusFilter })}
                  className="w-full p-2 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              {/* Exam Type Filter */}
              <div className="mb-4">
                <label className="block text-sm text-[#777] dark:text-gray-400 mb-2">Exam Type</label>
                <select
                  value={examTypeFilter}
                  onChange={(e) => handleFilterChange({ examType: e.target.value as typeof examTypeFilter })}
                  className="w-full p-2 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="Academic">Academic</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm text-[#777] dark:text-gray-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleFilterChange({ sort: e.target.value as typeof sortBy })}
                  className="w-full p-2 border border-[#E8DCFF] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#333] dark:text-white text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Score</option>
                  <option value="lowest">Lowest Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {isLoading && page === 1 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-[#F0E8FF] dark:border-gray-700 text-center">
                <p className="text-[#777] dark:text-gray-400 mb-4">No reading sessions found</p>
                <button
                  onClick={() => navigate('/reading')}
                  className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg hover:bg-[#6B2FE6]"
                >
                  Start Your First Test
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-[#F0E8FF] dark:border-gray-700 shadow-sm overflow-hidden"
                  >
                    <div className="p-4 flex flex-wrap items-center gap-4">
                      {/* Score Badge */}
                      {session.status === 'completed' && session.bandScore !== undefined && (
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                          style={{ backgroundColor: readingService.getBandColor(session.bandScore) }}
                        >
                          {session.bandScore.toFixed(1)}
                        </div>
                      )}
                      {session.status === 'in-progress' && (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-lg flex-shrink-0">
                          ⏱
                        </div>
                      )}
                      {session.status === 'abandoned' && (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                          —
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-[#333] dark:text-white truncate">
                            {session.passageTitle}
                          </h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-sm text-[#777] dark:text-gray-400">
                          {session.examType} • {session.difficulty} • {session.totalQuestions} questions
                        </p>
                        <p className="text-xs text-[#999] dark:text-gray-500 mt-1">
                          {formatDate(session.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {session.status !== 'abandoned' && (
                          <button
                            onClick={() => handleViewSession(session)}
                            className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6] text-sm"
                          >
                            {session.status === 'completed' ? 'View' : 'Continue'}
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(session.id)}
                          className="text-red-500 hover:text-red-600 p-2"
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

                {/* Load More */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isLoading}
                      className="bg-[#F4F0FF] dark:bg-gray-700 text-[#7D3CFF] dark:text-[#A78BFA] px-6 py-2 rounded-lg hover:bg-[#E8DCFF] dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      {isLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-3 text-[#333] dark:text-white">Delete Session?</h3>
            <p className="text-[#666] dark:text-gray-400 mb-4">
              This action cannot be undone. The session and all its data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-[#333] dark:text-white py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
