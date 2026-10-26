import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  PlusCircle,
  Inbox,
  UserCheck,
  FileText,
  HelpCircle,
  LifeBuoy
} from "lucide-react";

export function Sidebar() {
  const { isAdmin } = useAuth();

  const authorLinks = [
    { to: "/author/books", label: "Your books", icon: BookOpen },
    { to: "/author/raise-query", label: "Raise a query", icon: PlusCircle },
    { to: "/author/tickets", label: "Your tickets", icon: Inbox }
  ];

  const adminLinks = [
    { to: "/admin/queue", label: "Ticket queue", icon: Inbox },
    { to: "/admin/assigned", label: "Assigned to me", icon: UserCheck }
  ];

  const links = isAdmin ? adminLinks : authorLinks;

  return (
    <aside className="app-sidebar">
      <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "8px 12px 4px 12px"
          }}
        >
          {isAdmin ? "Operations" : "Author Workspace"}
        </div>

        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "var(--radius)",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--text)" : "var(--text-muted)",
                backgroundColor: isActive ? "var(--surface)" : "transparent",
                border: isActive ? "1px solid var(--border)" : "1px solid transparent",
                textDecoration: "none",
                transition: "background-color 150ms ease, color 150ms ease"
              })}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box in Sidebar */}
      <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
            BookLeaf Support Desk
          </div>
          <div>Delhi Fulfillment Facility</div>
          <div>Repro India & Epitome Books</div>
        </div>

        <a
          href="http://localhost:5002/api-docs"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            marginTop: "12px",
            color: "var(--primary)"
          }}
        >
          <FileText size={13} />
          <span>Interactive API Docs</span>
        </a>
      </div>
    </aside>
  );
}
