import React, { useState, useEffect } from "react";
import { submitReport, getUserReports, replyToReport } from "../services/reportService";
import { ClipboardList, Bug, Mail, CheckCircle } from "lucide-react";

interface Reply {
  _id: string;
  message: string;
  sentBy: "admin" | "user";
  senderName: string;
  createdAt: string;
}

interface Report {
  _id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  replies: Reply[];
  createdAt: string;
}

interface Props {
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};
const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export default function ReportModal({ onClose }: Props) {
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getUserReports();
      if (data.success) setReports(data.reports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setErrorMsg("Both subject and message are required.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const data = await submitReport(subject, message);
      if (data.success) {
        setSuccessMsg("Report submitted! We'll get back to you soon.");
        setSubject(""); setMessage("");
        await fetchReports();
        setTimeout(() => { setSuccessMsg(""); setView("list"); }, 2000);
      } else {
        setErrorMsg(data.message || "Failed to submit.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSubmitting(true);
    try {
      const data = await replyToReport(selected._id, replyText);
      if (data.success) {
        setReplyText("");
        setSelected(data.report);
        await fetchReports();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => { setView("list"); setErrorMsg(""); setSuccessMsg(""); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#7D3CFF] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== "list" && (
              <button onClick={goBack} className="hover:opacity-80 mr-1 text-lg">←</button>
            )}
            <span className="font-semibold text-lg flex items-center gap-2">
              {view === "list" ? <><ClipboardList className="w-5 h-5" /> My Reports</> : view === "new" ? <><Bug className="w-5 h-5" /> Report an Issue</> : <><Mail className="w-5 h-5" /> Report Details</>}
            </span>
          </div>
          <button onClick={onClose} className="hover:opacity-80 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {/* LIST */}
          {view === "list" && (
            <div>
              <button
                onClick={() => setView("new")}
                className="w-full mb-4 bg-[#7D3CFF] text-white py-2.5 rounded-lg hover:bg-[#6B2FE6] font-medium transition-colors"
              >
                + Submit New Report
              </button>
              {loading ? (
                <p className="text-center text-gray-400 py-8">Loading...</p>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-4xl mb-2">📭</p>
                  <p>No reports yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <button
                      key={r._id}
                      onClick={() => { setSelected(r); setView("detail"); }}
                      className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-[#7D3CFF] hover:bg-[#F8F4FF] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-gray-800 truncate">{r.subject}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[r.status]}`}>
                          {statusLabels[r.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{r.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                        {r.replies.length > 0 && (
                          <p className="text-xs text-[#7D3CFF]">💬 {r.replies.length} {r.replies.length === 1 ? "reply" : "replies"}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NEW */}
          {view === "new" && (
            <div className="space-y-4">
              {successMsg && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{successMsg}</div>}
              {errorMsg && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. App crash on speaking module" maxLength={100}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7D3CFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe the issue</label>
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="What happened? What did you expect?" rows={5} maxLength={1000}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7D3CFF] text-sm resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{message.length}/1000</p>
              </div>
              <button
                onClick={handleSubmit} disabled={submitting}
                className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg hover:bg-[#6B2FE6] font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          )}

          {/* DETAIL */}
          {view === "detail" && selected && (
            <div>
              <div className="mb-4 p-4 bg-[#F8F4FF] rounded-xl border border-[#E8DCFF]">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800">{selected.subject}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[selected.status]}`}>
                    {statusLabels[selected.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{selected.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>

              {selected.replies.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">No replies yet. We'll respond shortly!</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {selected.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className={`p-3 rounded-xl text-sm ${
                        reply.sentBy === "admin"
                          ? "bg-white border border-gray-200"
                          : "bg-[#7D3CFF] text-white ml-8"
                      }`}
                    >
                      <p className={`text-xs font-semibold mb-1 ${reply.sentBy === "admin" ? "text-[#7D3CFF]" : "text-purple-200"}`}>
                        {reply.sentBy === "admin" ? "🛡 Admin" : "You"}
                      </p>
                      <p>{reply.message}</p>
                      <p className={`text-xs mt-1 ${reply.sentBy === "admin" ? "text-gray-400" : "text-purple-200"}`}>
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {selected.status !== "resolved" ? (
                <div className="border-t pt-4">
                  <textarea
                    value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Add a follow-up message..." rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7D3CFF] text-sm resize-none mb-2"
                  />
                  <button
                    onClick={handleReply} disabled={submitting || !replyText.trim()}
                    className="w-full bg-[#7D3CFF] text-white py-2.5 rounded-lg hover:bg-[#6B2FE6] font-medium text-sm disabled:opacity-60 transition-colors"
                  >
                    {submitting ? "Sending..." : "Send Follow-up"}
                  </button>
                </div>
              ) : (
                <p className="text-center text-green-600 text-sm py-2 font-medium flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> This report has been resolved.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
