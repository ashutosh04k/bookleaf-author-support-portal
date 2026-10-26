import React from "react";
import { useAuth } from "../context/AuthContext";
import { X, Check } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    name: "Rohan Mehra",
    email: "admin@bookleaf.com",
    tag: "Senior Publishing Lead",
    notes: "Full ops queue access, overrides, notes & replies"
  },
  {
    role: "admin",
    name: "Aditi Roy",
    email: "ops@bookleaf.com",
    tag: "Author Success Specialist",
    notes: "Assigned tickets, resolution workflows"
  },
  {
    role: "author",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    tag: "Critical Royalty Query (BL-1001)",
    notes: "Overdue royalty case for 'Echoes of the Malabar Coast'"
  },
  {
    role: "author",
    name: "Rajesh Verma",
    email: "rajesh.verma@example.com",
    tag: "Royalty Formula Query (BL-1002)",
    notes: "Bestseller 'The Silicon Alchemist' (820 copies sold)"
  },
  {
    role: "author",
    name: "Ananya Sen",
    email: "ananya.sen@example.com",
    tag: "Critical ISBN Mismatch (BL-1003)",
    notes: "Amazon retail feed discrepancy"
  },
  {
    role: "author",
    name: "Vikram Malhotra",
    email: "vikram.malhotra@example.com",
    tag: "Print Defect Query (BL-1004)",
    notes: "Spine glue & cover scratches on author copies"
  },
  {
    role: "author",
    name: "Sunita Rao",
    email: "sunita.rao@example.com",
    tag: "Availability Lag (BL-1005)",
    notes: "'Currently Unavailable' on Amazon India"
  },
  {
    role: "author",
    name: "Devendra Joshi",
    email: "devendra.joshi@example.com",
    tag: "Production Stage (BL-1006)",
    notes: "Book currently in 'Typesetting' production stage"
  },
  {
    role: "author",
    name: "Karthik Subramanian",
    email: "karthik.sub@example.com",
    tag: "Empty State Test Case",
    notes: "Published author with 2 books and 0 tickets (empty state test)"
  },
  {
    role: "author",
    name: "Meera Nambiar",
    email: "meera.nambiar@example.com",
    tag: "Resolved Ticket (BL-1007)",
    notes: "Amazon blurb & bio update completed"
  }
];

export function DemoSwitcherModal({ onClose }) {
  const { user, login } = useAuth();

  const handleSelect = async (account) => {
    try {
      await login(account.email, "password123");
      onClose();
      // Redirect depending on role
      if (account.role === "admin") {
        window.location.href = "/admin/queue";
      } else {
        window.location.href = "/author/books";
      }
    } catch (err) {
      alert("Error switching account: " + err.message);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px"
      }}
    >
      <div
        className="surface-card"
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Evaluation Account Switcher</h3>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-muted)" }}>
              Switch instantly between pre-seeded test personas to evaluate author and admin portals.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: "4px 6px" }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Operations & Admin Accounts
          </div>

          {DEMO_ACCOUNTS.filter(a => a.role === "admin").map(account => {
            const isCurrent = user?.email === account.email;
            return (
              <div
                key={account.email}
                onClick={() => handleSelect(account)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  border: isCurrent ? "1px solid var(--primary)" : "1px solid var(--border)",
                  backgroundColor: isCurrent ? "var(--surface-alt)" : "var(--surface)",
                  cursor: "pointer",
                  transition: "border-color 150ms ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "13.5px" }}>{account.name}</span>
                    <span className="badge badge-open" style={{ fontSize: "11px" }}>{account.tag}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {account.email} — {account.notes}
                  </div>
                </div>
                {isCurrent && <Check size={16} color="var(--primary)" />}
              </div>
            );
          })}

          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "12px" }}>
            Author Accounts (Edge Cases & Personas)
          </div>

          {DEMO_ACCOUNTS.filter(a => a.role === "author").map(account => {
            const isCurrent = user?.email === account.email;
            return (
              <div
                key={account.email}
                onClick={() => handleSelect(account)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  border: isCurrent ? "1px solid var(--primary)" : "1px solid var(--border)",
                  backgroundColor: isCurrent ? "var(--surface-alt)" : "var(--surface)",
                  cursor: "pointer",
                  transition: "border-color 150ms ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "13.5px" }}>{account.name}</span>
                    <span className="badge badge-low" style={{ fontSize: "11px" }}>{account.tag}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {account.email} — {account.notes}
                  </div>
                </div>
                {isCurrent && <Check size={16} color="var(--primary)" />}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", backgroundColor: "var(--surface-alt)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
