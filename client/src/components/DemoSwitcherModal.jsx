import React from "react";
import { useAuth } from "../context/AuthContext";
import { X, Check } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    name: "Rohan Mehra",
    email: "admin@bookleaf.com",
    tag: "Senior Publishing Operations Lead",
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
    name: "Priya Sharma (AUTH001)",
    email: "priya.sharma@email.com",
    tag: "Critical Royalty Query (BL-1001)",
    notes: "Overdue royalty case for 'Whispers of the Ganges' (₹3,570 pending)"
  },
  {
    role: "author",
    name: "Rohit Kapoor (AUTH002)",
    email: "rohit.kapoor@email.com",
    tag: "Royalty Formula Query (BL-1002)",
    notes: "'Code & Karma' (876 copies sold) & 'Startup Sutra' (1203 copies sold)"
  },
  {
    role: "author",
    name: "Sneha Kulkarni (AUTH007)",
    email: "sneha.kulkarni@email.com",
    tag: "Critical ISBN Mismatch (BL-1003)",
    notes: "3 books including 'Midnight in Mysore' (In Production - Cover Design)"
  },
  {
    role: "author",
    name: "Vikram Joshi (AUTH004)",
    email: "vikram.joshi@email.com",
    tag: "Print Defect Query (BL-1004)",
    notes: "Cracked spine binding on author copies of 'Debugging Life'"
  },
  {
    role: "author",
    name: "Meera Nair (AUTH005)",
    email: "meera.nair@email.com",
    tag: "Availability Lag (BL-1005)",
    notes: "'Cardamom & Chaos' currently unavailable on Amazon India"
  },
  {
    role: "author",
    name: "Kavita Deshmukh (AUTH009)",
    email: "kavita.deshmukh@email.com",
    tag: "In Production - Typesetting (BL-1006)",
    notes: "'Raising Roots' (Typesetting) & 'The Nagpur Notebooks' (₹850 pending < ₹1,000 threshold)"
  },
  {
    role: "author",
    name: "Farhan Sheikh (AUTH008)",
    email: "farhan.sheikh@email.com",
    tag: "Empty State Test Case",
    notes: "Published author with 1 book ('Ghazal of the Forgotten') and 0 tickets"
  },
  {
    role: "author",
    name: "Ananya Reddy (AUTH003)",
    email: "ananya.reddy@email.com",
    tag: "Pending First Payout",
    notes: "'Between Two Temples' (67 copies sold, ₹2,546 pending)"
  },
  {
    role: "author",
    name: "Arjun Malhotra (AUTH006)",
    email: "arjun.malhotra@email.com",
    tag: "Pending Payout",
    notes: "'Turban Tales' (88 copies sold, ₹2,464 pending)"
  },
  {
    role: "author",
    name: "Diya Chatterjee (AUTH010)",
    email: "diya.chatterjee@email.com",
    tag: "Resolved Ticket (BL-1007)",
    notes: "Amazon blurb and bio update for 'Durga’s Daughters'"
  }
];

export function DemoSwitcherModal({ onClose }) {
  const { user, login } = useAuth();

  const handleSelect = async (account) => {
    try {
      await login(account.email, "password123");
      onClose();
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
              Switch instantly between official BookLeaf personas to evaluate author and admin workflows.
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
            Author Accounts (Official Sample Dataset)
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
