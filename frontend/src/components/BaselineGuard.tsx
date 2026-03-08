import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const EXEMPT = ["/baseline", "/baseline/test", "/baseline/results", "/login", "/register"];

export default function BaselineGuard({ children }: { children: React.ReactNode }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (EXEMPT.some((p) => location.pathname.startsWith(p))) {
      setChecked(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) { setChecked(true); return; }

    fetch("http://localhost:4000/api/baseline/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.role === "admin") { setChecked(true); return; }
        if (!d.completed) navigate("/baseline", { replace: true });
        else setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [location.pathname]);

  if (!checked) return null;
  return <>{children}</>;
}