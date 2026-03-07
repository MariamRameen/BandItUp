import React, { useState, useEffect } from 'react';
import { getAllReports, adminReplyToReport, updateReportStatus } from '../../services/reportService';

interface Reply {
  _id: string;
  message: string;
  sentBy: 'admin' | 'user';
  senderName: string;
  createdAt: string;
}

interface Report {
  _id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  replies: Reply[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};
const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export default function AdminReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Report | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getAllReports(statusFilter);
      if (data.success) setReports(data.reports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [statusFilter]);

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSubmitting(true);
    try {
      const data = await adminReplyToReport(selected._id, replyText);
      if (data.success) {
        setReplyText('');
        setSelected(data.report);
        fetchReports();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (reportId: string, status: string) => {
    const data = await updateReportStatus(reportId, status);
    if (data.success) {
      if (selected?._id === reportId) setSelected(data.report);
      fetchReports();
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-xl font-semibold mb-6">User Reports</h2>
      <div className="flex gap-6 h-[65vh]">

        {/* Left: list */}
        <div className="w-2/5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-center text-gray-400 py-8">Loading...</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p>No reports found.</p>
              </div>
            ) : (
              reports.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selected?._id === r._id
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm text-gray-800 truncate">{r.subject}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[r.status]}`}>
                      {statusLabels[r.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{r.userName} · {r.userEmail}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    {r.replies.length > 0 && <p className="text-xs text-purple-500">💬 {r.replies.length}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-2">👈</p>
                <p>Select a report to respond</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-gray-800">{selected.subject}</h3>
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(selected._id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusColors[selected.status]}`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  From: <span className="font-medium">{selected.userName}</span> ({selected.userEmail})
                  &nbsp;·&nbsp;{new Date(selected.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selected.message}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.replies.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">No replies yet.</p>
                ) : (
                  selected.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className={`p-3 rounded-xl text-sm max-w-[85%] ${
                        reply.sentBy === 'admin'
                          ? 'bg-purple-600 text-white ml-auto'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className={`text-xs font-semibold mb-1 ${reply.sentBy === 'admin' ? 'text-purple-200' : 'text-gray-500'}`}>
                        {reply.sentBy === 'admin' ? '🛡 You (Admin)' : `👤 ${reply.senderName}`}
                      </p>
                      <p>{reply.message}</p>
                      <p className={`text-xs mt-1 ${reply.sentBy === 'admin' ? 'text-purple-300' : 'text-gray-400'}`}>
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm resize-none"
                />
                <button
                  onClick={handleReply}
                  disabled={submitting || !replyText.trim()}
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 self-end transition-colors"
                >
                  {submitting ? '...' : 'Reply'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
