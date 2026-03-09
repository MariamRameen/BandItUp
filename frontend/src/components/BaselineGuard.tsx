
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


const EXEMPT = ["/baseline", "/baseline/test", "/baseline/results", "/login", "/signup", "/register", "/verify-email", "/set-password", "/forgot-password", "/reset-password"];

export default function BaselineGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    
    if (EXEMPT.some((p) => location.pathname.startsWith(p))) {
      setReady(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true); 
      return;
    }

    fetch("http://localhost:4000/api/baseline/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
  
        if (d.isAdmin || d.completed) {
          setReady(true);
        } else {
          navigate("/baseline", { replace: true });
        }
      })
      .catch(() => setReady(true)); // On network error, don't block the app
  }, [location.pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
