import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, LogIn, AlertCircle, ArrowRight } from "lucide-react";

const QUICK_LOGINS = [
  { role: "admin", label: "Admin: Rohan Mehra (Ops Lead)", email: "admin@bookleaf.com" },
  { role: "admin", label: "Admin: Aditi Roy (Success Specialist)", email: "ops@bookleaf.com" },
  { role: "author", label: "Author: Priya Sharma (Critical Royalty)", email: "priya.sharma@example.com" },
  { role: "author", label: "Author: Rajesh Verma (Royalty Formula)", email: "rajesh.verma@example.com" },
  { role: "author", label: "Author: Ananya Sen (Critical ISBN Mismatch)", email: "ananya.sen@example.com" },
  { role: "author", label: "Author: Vikram Malhotra (Print Defect)", email: "vikram.malhotra@example.com" },
  { role: "author", label: "Author: Devendra Joshi (In Production)", email: "devendra.joshi@example.com" },
  { role: "author", label: "Author: Karthik Subramanian (Empty State)", email: "karthik.sub@example.com" }
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@bookleaf.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === "admin") {
        navigate("/admin/queue");
      } else {
        navigate("/author/books");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail) => {
    setEmail(targetEmail);
    setPassword("password123");
    setError(null);
    setLoading(true);

    try {
      const user = await login(targetEmail, "password123");
      if (user.role === "admin") {
        navigate("/admin/queue");
      } else {
        navigate("/author/books");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg)",
        padding: "24px"
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* BookLeaf Branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius)",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              marginBottom: "12px"
            }}
          >
            <BookOpen size={22} color="var(--primary)" />
          </div>
          <h1 className="serif-heading" style={{ fontSize: "1.75rem", marginBottom: "4px" }}>
            BookLeaf Publishing
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Author Support & Operations Desk Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="surface-card" style={{ padding: "28px 24px" }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "var(--surface-alt)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: "var(--radius)",
                color: "var(--accent)",
                fontSize: "13px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="emailInput">
                Email address
              </label>
              <input
                id="emailInput"
                type="email"
                className="form-input"
                placeholder="author@example.com or admin@bookleaf.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label className="form-label" htmlFor="passwordInput">
                Password
              </label>
              <input
                id="passwordInput"
                type="password"
                className="form-input"
                placeholder="Default: password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="form-helper">
                Pre-seeded default password for all demo accounts is: <code>password123</code>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent"
              disabled={loading}
              style={{ width: "100%", padding: "9px" }}
            >
              <LogIn size={15} />
              <span>{loading ? "Signing in..." : "Sign in to portal"}</span>
            </button>
          </form>

          {/* Quick 1-Click Evaluation Switcher */}
          <div style={{ marginTop: "24px", borderTop: "1px solid var(--border)", paddingTop: "18px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
              1-Click Demo Personas (Reviewer Convenience)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {QUICK_LOGINS.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => handleQuickLogin(q.email)}
                  className="btn btn-outline btn-sm"
                  style={{
                    justifyContent: "space-between",
                    fontSize: "12px",
                    padding: "5px 10px",
                    textAlign: "left"
                  }}
                >
                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {q.label}
                  </span>
                  <ArrowRight size={12} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
