import React from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "No tickets yet",
  description = "No tickets yet – raise one if you need help with a book.",
  actionText = "Raise a query",
  actionTo = "/author/raise-query"
}) {
  return (
    <div
      className="surface-card"
      style={{
        padding: "48px 24px",
        textAlign: "center",
        backgroundColor: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--surface-alt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          border: "1px solid var(--border)"
        }}
      >
        <Inbox size={22} color="var(--text-muted)" />
      </div>

      <h3 style={{ marginBottom: "6px", fontSize: "1.15rem" }}>{title}</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "420px", marginBottom: "20px" }}>
        {description}
      </p>

      {actionText && actionTo && (
        <Link to={actionTo} className="btn btn-accent">
          {actionText}
        </Link>
      )}
    </div>
  );
}
