import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  LogIn,
  AlertCircle,
  ArrowRight,
  Library,
  Coins,
  Sparkles,
  ShieldCheck,
  Feather
} from "lucide-react";

const ADMIN_PERSONAS = [
  {
    role: "admin",
    name: "Rohan Mehra",
    title: "Operations Lead (Admin)",
    email: "admin@bookleaf.com",
    badge: "Full SLA Desk Access",
    badgeColor: "#E3ECEA",
    textColor: "#2F5D50"
  },
  {
    role: "admin",
    name: "Aditi Roy",
    title: "Author Success Specialist",
    email: "ops@bookleaf.com",
    badge: "Triage & Replies",
    badgeColor: "#E3ECEA",
    textColor: "#2F5D50"
  }
];

const AUTHOR_PERSONAS = [
  {
    name: "Priya Sharma",
    book: "Whispers of the Ganges",
    ticketId: "BL-1001",
    scenario: "Overdue Royalty (4+ mo)",
    email: "priya.sharma@email.com",
    priority: "Critical",
    badgeBg: "#F8E1DE",
    badgeText: "#8A1F14"
  },
  {
    name: "Sneha Kulkarni",
    book: "The Forgotten Melody",
    ticketId: "BL-1003",
    scenario: "ISBN Mismatch on Retail",
    email: "sneha.kulkarni@email.com",
    priority: "Critical",
    badgeBg: "#F8E1DE",
    badgeText: "#8A1F14"
  },
  {
    name: "Vikram Joshi",
    book: "Shadows of the Fort",
    ticketId: "BL-1004",
    scenario: "Binding & Print Defect",
    email: "vikram.joshi@email.com",
    priority: "High",
    badgeBg: "#F6E3DA",
    badgeText: "#7A3418"
  },
  {
    name: "Meera Nair",
    book: "Echoes of Silence",
    ticketId: "BL-1005",
    scenario: "Unavailable on Amazon",
    email: "meera.nair@email.com",
    priority: "High",
    badgeBg: "#F6E3DA",
    badgeText: "#7A3418"
  },
  {
    name: "Rohit Kapoor",
    book: "Beyond the Horizon",
    ticketId: "BL-1002",
    scenario: "Royalty Calculation Clarification",
    email: "rohit.kapoor@email.com",
    priority: "Medium",
    badgeBg: "#F4EBCF",
    badgeText: "#6B5512"
  },
  {
    name: "Farhan Sheikh",
    book: "Silent Symphony",
    ticketId: "None",
    scenario: "Clean Slate (0 Tickets)",
    email: "farhan.sheikh@email.com",
    priority: "Empty State",
    badgeBg: "#E5EBE6",
    badgeText: "#3E5247"
  }
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@bookleaf.com");
  const [password, setPassword] = useState("password123");
  const [personaTab, setPersonaTab] = useState("authors"); // "authors" | "admins"
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
    <div className="login-container">
      {/* =========================================================
          LEFT SIDE: EDITORIAL BOOK PUBLICATION SHOWCASE
          ========================================================= */}
      <div className="login-hero">
        <div className="login-hero-overlay"></div>
        <div className="login-hero-content">
          {/* Header Brand */}
          <div className="login-hero-brand">
            <div className="login-hero-brand-icon">
              <BookOpen size={22} color="#FFFFFF" />
            </div>
            <div>
              <span className="login-hero-brand-name">BookLeaf Publishing</span>
              <span className="login-hero-brand-tag">Author & Editorial Desk</span>
            </div>
          </div>

          {/* Core Literary Statement */}
          <div className="login-hero-statement">
            <div className="login-hero-pill">
              <Feather size={13} color="#E29578" />
              <span>Independent Publishing Platform</span>
            </div>
            <h1 className="login-hero-title">
              Every great story deserves an exceptional journey into print.
            </h1>
            <p className="login-hero-desc">
              From manuscript typesetting and global ISBN cataloging to transparent quarterly royalties — the dedicated portal for BookLeaf authors and editorial operations.
            </p>
          </div>

          {/* Publication Highlights */}
          <div className="login-hero-features">
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <Library size={18} color="#E29578" />
              </div>
              <div>
                <h4 className="login-feature-heading">Retail Distribution</h4>
                <p className="login-feature-text">
                  Direct storefront sync across Amazon India, Flipkart, & international book retailers.
                </p>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon">
                <Coins size={18} color="#E29578" />
              </div>
              <div>
                <h4 className="login-feature-heading">Quarterly Royalty Payouts</h4>
                <p className="login-feature-text">
                  Automated net profit calculation with direct NEFT disbursements within 45 days.
                </p>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon">
                <Sparkles size={18} color="#E29578" />
              </div>
              <div>
                <h4 className="login-feature-heading">AI-Assisted SLA Triage</h4>
                <p className="login-feature-text">
                  Grounded response drafts & sub-second query classification for editorial speed.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial from BookLeaf Author */}
          <div className="login-hero-quote">
            <p className="login-quote-text">
              "The transparency on quarterly royalty disbursements and instant ISBN tracking made publishing our edition seamless."
            </p>
            <div className="login-quote-author">
              <div className="login-quote-avatar">PS</div>
              <div>
                <div className="login-quote-name">Priya Sharma</div>
                <div className="login-quote-sub">Author of <em>Whispers of the Ganges</em> (ISBN 978-93-87654-01-2)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT SIDE: PORTAL SIGN-IN & DEMO PERSONA SWITCHER
          ========================================================= */}
      <div className="login-panel">
        <div className="login-panel-inner">
          {/* Mobile Top Brand (visible on small screens) */}
          <div className="login-mobile-brand">
            <div className="login-mobile-brand-icon">
              <BookOpen size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: 0 }}>BookLeaf Publishing</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                Author Support & Operations Desk
              </p>
            </div>
          </div>

          <div className="login-form-header">
            <h2 className="serif-heading" style={{ fontSize: "1.75rem", marginBottom: "6px" }}>
              Sign in to your portal
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
              Access your publications, royalty statements, and author support queries.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 14px",
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
              <AlertCircle size={16} />
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
                placeholder="author@email.com or admin@bookleaf.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label" htmlFor="passwordInput">
                  Password
                </label>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  default: password123
                </span>
              </div>
              <input
                id="passwordInput"
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-accent"
              disabled={loading}
              style={{ width: "100%", padding: "10px", fontSize: "15px" }}
            >
              <LogIn size={16} />
              <span>{loading ? "Authenticating..." : "Sign in to portal"}</span>
            </button>
          </form>

          {/* Quick 1-Click Evaluation Switcher */}
          <div className="login-switcher-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                1-Click Demo Personas
              </div>
              <div className="login-persona-tabs">
                <button
                  type="button"
                  onClick={() => setPersonaTab("authors")}
                  className={`login-persona-tab ${personaTab === "authors" ? "active" : ""}`}
                >
                  Authors ({AUTHOR_PERSONAS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaTab("admins")}
                  className={`login-persona-tab ${personaTab === "admins" ? "active" : ""}`}
                >
                  Admins ({ADMIN_PERSONAS.length})
                </button>
              </div>
            </div>

            {personaTab === "authors" ? (
              <div className="login-persona-grid">
                {AUTHOR_PERSONAS.map((author) => (
                  <button
                    key={author.email}
                    type="button"
                    onClick={() => handleQuickLogin(author.email)}
                    className="login-persona-card"
                    title={`Login as ${author.name}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>
                        {author.name}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 5px",
                          borderRadius: "3px",
                          backgroundColor: author.badgeBg,
                          color: author.badgeText,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {author.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontStyle: "italic" }}>
                      "{author.book}"
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--accent)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>{author.scenario}</span>
                      <ArrowRight size={11} style={{ marginLeft: "auto" }} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {ADMIN_PERSONAS.map((admin) => (
                  <button
                    key={admin.email}
                    type="button"
                    onClick={() => handleQuickLogin(admin.email)}
                    className="login-persona-card"
                    style={{ padding: "10px 12px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "4px",
                            backgroundColor: "var(--surface-alt)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <ShieldCheck size={16} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>
                            {admin.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {admin.title}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "4px",
                          backgroundColor: admin.badgeColor,
                          color: admin.textColor
                        }}
                      >
                        {admin.badge}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded CSS for Split-Screen Layout */}
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          background-color: var(--bg);
          font-family: var(--font-sans);
        }

        /* Hero Left Side */
        .login-hero {
          flex: 1.15;
          position: relative;
          background-color: #173129;
          background-image: url("https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80");
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          padding: 48px;
          color: #FCFAF6;
          overflow: hidden;
        }

        .login-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, rgba(20, 44, 37, 0.92) 0%, rgba(13, 27, 23, 0.94) 100%);
          backdrop-filter: blur(2px);
          z-index: 1;
        }

        .login-hero-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
          justifyContent: space-between;
          gap: 36px;
        }

        .login-hero-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .login-hero-brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .login-hero-brand-name {
          display: block;
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 600;
          color: #FCFAF6;
          letter-spacing: -0.01em;
        }

        .login-hero-brand-tag {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #E29578;
          font-weight: 600;
        }

        .login-hero-statement {
          max-width: 520px;
        }

        .login-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(226, 149, 120, 0.15);
          border: 1px solid rgba(226, 149, 120, 0.3);
          color: #E29578;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .login-hero-title {
          font-family: var(--font-serif);
          font-size: 2.35rem;
          line-height: 1.22;
          font-weight: 600;
          color: #FCFAF6;
          margin-bottom: 14px;
        }

        .login-hero-desc {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(252, 250, 246, 0.82);
          margin: 0;
        }

        .login-hero-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          max-width: 520px;
        }

        .login-feature-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        .login-feature-icon {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: rgba(226, 149, 120, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .login-feature-heading {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: 600;
          color: #FCFAF6;
        }

        .login-feature-text {
          margin: 0;
          font-size: 12px;
          line-height: 1.45;
          color: rgba(252, 250, 246, 0.75);
        }

        .login-hero-quote {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 18px;
          max-width: 520px;
        }

        .login-quote-text {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 14px;
          line-height: 1.5;
          color: rgba(252, 250, 246, 0.9);
          margin-bottom: 10px;
        }

        .login-quote-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-quote-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #B5562F;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }

        .login-quote-name {
          font-size: 12px;
          font-weight: 600;
          color: #FCFAF6;
        }

        .login-quote-sub {
          font-size: 11px;
          color: rgba(252, 250, 246, 0.65);
        }

        /* Right Side Panel */
        .login-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justifyContent: center;
          padding: 40px 32px;
          background-color: var(--bg);
        }

        .login-panel-inner {
          width: 100%;
          max-width: 440px;
        }

        .login-mobile-brand {
          display: none;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .login-mobile-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius);
          background-color: var(--surface);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-form-header {
          margin-bottom: 24px;
        }

        .login-switcher-section {
          margin-top: 24px;
          border-top: 1px solid var(--border);
          padding-top: 18px;
        }

        .login-persona-tabs {
          display: flex;
          gap: 4px;
          background: var(--surface-alt);
          padding: 2px;
          border-radius: 4px;
          border: 1px solid var(--border);
        }

        .login-persona-tab {
          background: transparent;
          border: none;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 3px;
          color: var(--text-muted);
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .login-persona-tab.active {
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .login-persona-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .login-persona-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 8px 10px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
        }

        .login-persona-card:hover {
          border-color: var(--accent);
          box-shadow: 0 2px 6px rgba(181, 86, 47, 0.08);
          transform: translateY(-1px);
        }

        /* Responsive Breakpoint */
        @media (max-width: 960px) {
          .login-container {
            flex-direction: column;
          }
          .login-hero {
            display: none;
          }
          .login-mobile-brand {
            display: flex;
          }
          .login-panel {
            padding: 32px 20px;
          }
          .login-persona-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
