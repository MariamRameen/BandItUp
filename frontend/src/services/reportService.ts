const BASE = "http://localhost:4000/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});


export const submitReport = async (subject: string, message: string) => {
  const res = await fetch(`${BASE}/profile/reports`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ subject, message }),
  });
  return res.json();
};

export const getUserReports = async () => {
  const res = await fetch(`${BASE}/profile/reports`, { headers: authHeaders() });
  return res.json();
};

export const replyToReport = async (reportId: string, message: string) => {
  const res = await fetch(`${BASE}/profile/reports/${reportId}/reply`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  return res.json();
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const getAllReports = async (status = "all") => {
  const res = await fetch(`${BASE}/admin/reports?status=${status}`, { headers: authHeaders() });
  return res.json();
};

export const adminReplyToReport = async (reportId: string, message: string) => {
  const res = await fetch(`${BASE}/admin/reports/${reportId}/reply`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  return res.json();
};

export const updateReportStatus = async (reportId: string, status: string) => {
  const res = await fetch(`${BASE}/admin/reports/${reportId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const getUnreadNotifications = async () => {
  const res = await fetch(`${BASE}/profile/reports/notifications`, { headers: authHeaders() });
  return res.json();
};