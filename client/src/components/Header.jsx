import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, LogOut, Users, BookOpen } from "lucide-react";
import { DemoSwitcherModal } from "./DemoSwitcherModal";

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="app-header">
        <div className="flex items-center gap-3">
          <Link
            to={isAdmin ? "/admin/queue" : "/author/books"}
            style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <BookOpen size={20} color="var(--primary)" />
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              BookLeaf
            </span>
          </Link>
          <span style={{ color: "var(--border)", userSelect: "none" }}>/</span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
            {isAdmin ? "Operations Desk" : "Author Support Portal"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Demo Account Switcher Button */}
          <button
            onClick={() => setShowDemoModal(true)}
            className="btn btn-outline btn-sm"
            title="Switch demo account (Admins & Authors)"
            style={{ fontSize: "12px", padding: "4px 9px" }}
          >
            <Users size={14} />
            <span>Switch Role / Author</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-outline btn-sm"
            aria-label="Toggle dark/light mode"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{ padding: "6px 8px" }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User Profile Info & Sign Out */}
          {user && (
            <div className="flex items-center gap-3" style={{ borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
              <div style={{ textAlign: "right", lineHeight: 1.2 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                  {user.name}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  {user.role === "admin" ? "Ops Admin" : "Author"}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Log out"
                style={{ padding: "5px 7px" }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {showDemoModal && (
        <DemoSwitcherModal onClose={() => setShowDemoModal(false)} />
      )}
    </>
  );
}
