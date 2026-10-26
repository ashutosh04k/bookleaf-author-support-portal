import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { formatDateTime, formatINR } from "../../utils/formatters";
import { Badge } from "../../components/Badge";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Lock,
  MessageSquare,
  UserCheck,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry"
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export function AdminTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active view tab: "reply" (Public customer response) vs "notes" (Internal team only)
  const [activeTab, setActiveTab] = useState("reply");

  // Form states
  const [replyText, setReplyText] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/tickets/${id}`);
      if (res.success) {
        setTicket(res.ticket);
        setMessages(res.messages || []);
        setInternalNotes(res.internalNotes || []);

        // Pre-fill reply text with AI draft if replyText is currently empty
        if (res.ticket.aiDraft?.content && !replyText) {
          setReplyText(res.ticket.aiDraft.content);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("joinTicket", id);

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    };

    const handleNewInternalNote = (data) => {
      if (data.ticketId === id) {
        setInternalNotes((prev) => {
          if (prev.some((n) => n._id === data.note._id)) return prev;
          return [...prev, data.note];
        });
      }
    };

    const handleTicketUpdated = (updated) => {
      if (updated._id === id) {
        setTicket(updated);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("note:new", handleNewInternalNote);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socket.emit("leaveTicket", id);
      socket.off("message:new", handleNewMessage);
      socket.off("note:new", handleNewInternalNote);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, internalNotes, activeTab]);

  // Status Change
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await apiRequest(`/admin/tickets/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) setTicket(res.ticket);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  // Override Category or Priority
  const handleOverride = async (field, value) => {
    try {
      const payload = { [field]: value };
      const res = await apiRequest(`/admin/tickets/${id}/override`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      if (res.success) setTicket(res.ticket);
    } catch (err) {
      alert("Failed to override classification: " + err.message);
    }
  };

  // Self Assign
  const handleSelfAssign = async () => {
    try {
      const res = await apiRequest(`/admin/tickets/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ adminId: "me" })
      });
      if (res.success) setTicket(res.ticket);
    } catch (err) {
      alert("Failed to assign ticket: " + err.message);
    }
  };

  // Regenerate Draft
  const handleRegenerateDraft = async () => {
    try {
      setRegeneratingDraft(true);
      const res = await apiRequest(`/admin/tickets/${id}/regenerate-draft`, {
        method: "POST"
      });
      if (res.success && res.aiDraft) {
        setTicket((prev) => ({ ...prev, aiDraft: res.aiDraft }));
        setReplyText(res.aiDraft.content);
      }
    } catch (err) {
      alert("Failed to regenerate draft: " + err.message);
    } finally {
      setRegeneratingDraft(false);
    }
  };

  // Insert Draft into reply textarea
  const handleInsertDraft = () => {
    if (ticket?.aiDraft?.content) {
      setReplyText(ticket.aiDraft.content);
      setActiveTab("reply");
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  // Send Public Reply to Author
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSendingReply(true);
      const res = await apiRequest(`/admin/tickets/${id}/send-reply`, {
        method: "POST",
        body: JSON.stringify({ content: replyText.trim() })
      });

      if (res.success) {
        setReplyText("");
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
      }
    } catch (err) {
      alert("Failed to send reply: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  // Add Internal Staff Note
  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;

    try {
      setSavingNote(true);
      const res = await apiRequest(`/admin/tickets/${id}/internal-notes`, {
        method: "POST",
        body: JSON.stringify({ content: internalNoteText.trim() })
      });

      if (res.success) {
        setInternalNoteText("");
        setInternalNotes((prev) => {
          if (prev.some((n) => n._id === res.note._id)) return prev;
          return [...prev, res.note];
        });
      }
    } catch (err) {
      alert("Failed to add note: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ padding: "40px 0", color: "var(--text-muted)" }}>Loading ticket ops detail...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="app-container">
        <div className="surface-card" style={{ borderLeft: "3px solid var(--accent)", color: "var(--accent)" }}>
          {error || "Ticket not found"}
        </div>
      </div>
    );
  }

  const isAssignedToMe = ticket.assignedTo?._id === user?.id || ticket.assignedTo === user?.id;

  return (
    <div className="app-container" style={{ maxWidth: "1120px" }}>
      <button
        onClick={() => navigate("/admin/queue")}
        className="btn btn-outline btn-sm mb-4"
        style={{ border: "none", paddingLeft: 0, color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        <span>Back to Ticket Queue</span>
      </button>

      {/* Main Grid: Left side conversation & replies, Right side metadata & ops controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        {/* Left Column: Ticket conversation, AI Draft, Reply box */}
        <div>
          {/* Header Card */}
          <div className="surface-card mb-4" style={{ padding: "20px" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="isbn-font" style={{ fontSize: "14px", fontWeight: 600 }}>
                  {ticket.ticketNumber}
                </span>
                <Badge type={ticket.status}>{ticket.status}</Badge>
                <Badge type={ticket.priority}>{ticket.priority}</Badge>
              </div>
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                Opened {formatDateTime(ticket.createdAt)}
              </span>
            </div>

            <h2 className="serif-heading" style={{ fontSize: "1.35rem", marginBottom: "8px" }}>
              {ticket.subject}
            </h2>

            {/* Author summary & book summary */}
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ color: "var(--text)" }}>Author:</strong> {ticket.author?.name} ({ticket.author?.email})
                </div>
                <div>
                  <strong style={{ color: "var(--text)" }}>Book:</strong> {ticket.book ? ticket.book.title : "General Account"}
                </div>
              </div>
            </div>
          </div>

          {/* AI Auto-Classification & Draft Box (No robot/sparkle branding) */}
          {ticket.aiDraft?.content && (
            <div className="suggested-reply-box">
              <div className="suggested-reply-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Suggested reply (editable)</span>
                  <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>
                    &bull; Model: {ticket.aiDraft.model || "gpt-4o-mini"} &bull; Source: {ticket.aiDraft.relevantKbTopic}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={handleRegenerateDraft}
                    disabled={regeneratingDraft}
                    className="btn btn-outline btn-sm"
                    title="Regenerate suggested reply"
                    style={{ fontSize: "11.5px", padding: "2px 7px" }}
                  >
                    <RefreshCw size={12} className={regeneratingDraft ? "spin" : ""} />
                    <span>Regenerate</span>
                  </button>

                  <button
                    onClick={handleInsertDraft}
                    className="btn btn-secondary btn-sm"
                    title="Load into reply composer below"
                    style={{ fontSize: "11.5px", padding: "2px 7px" }}
                  >
                    {copiedDraft ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedDraft ? "Inserted" : "Use in reply"}</span>
                  </button>
                </div>
              </div>

              <div className="suggested-reply-content">
                {ticket.aiDraft.content}
              </div>
            </div>
          )}

          {/* Tabs: Public Customer Reply vs Internal Team Notes */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            <button
              onClick={() => setActiveTab("reply")}
              className={`btn btn-sm ${activeTab === "reply" ? "btn-secondary font-semibold" : "btn-outline"}`}
              style={{
                borderColor: activeTab === "reply" ? "var(--primary)" : "var(--border)",
                color: activeTab === "reply" ? "var(--primary)" : "var(--text-muted)"
              }}
            >
              <MessageSquare size={14} />
              <span>Author Conversation ({messages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`btn btn-sm ${activeTab === "notes" ? "btn-secondary font-semibold" : "btn-outline"}`}
              style={{
                borderColor: activeTab === "notes" ? "var(--accent)" : "var(--border)",
                color: activeTab === "notes" ? "var(--accent)" : "var(--text-muted)"
              }}
            >
              <Lock size={14} />
              <span>Internal Notes ({internalNotes.length})</span>
            </button>
          </div>

          {/* Tab 1: Author Conversation Thread */}
          {activeTab === "reply" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                {messages.map((m) => {
                  const isAuthor = m.role === "author";
                  return (
                    <div
                      key={m._id}
                      className="surface-card"
                      style={{
                        padding: "14px 16px",
                        backgroundColor: isAuthor ? "var(--surface)" : "var(--surface-alt)",
                        borderLeft: isAuthor ? "1px solid var(--border)" : "3px solid var(--primary)"
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>
                            {m.sender?.name || (isAuthor ? "Author" : "BookLeaf Staff")}
                          </span>
                          <span
                            className={`badge ${isAuthor ? "badge-low" : "badge-open"}`}
                            style={{ fontSize: "10.5px" }}
                          >
                            {isAuthor ? "Author" : "Staff"}
                          </span>
                        </div>
                        <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          {formatDateTime(m.createdAt)}
                        </span>
                      </div>

                      <div style={{ fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Public Reply Composer */}
              <div className="surface-card" style={{ padding: "18px" }}>
                <form onSubmit={handleSendReply}>
                  <div className="form-group" style={{ marginBottom: "10px" }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label" style={{ margin: 0 }}>
                        Official Reply to Author
                      </label>
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        Will be dispatched to author portal instantly
                      </span>
                    </div>
                    <textarea
                      className="form-textarea"
                      rows={6}
                      placeholder="Write your reply or adapt the suggested reply above..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Sending a reply automatically marks Open tickets as 'In Progress'.
                    </div>
                    <button
                      type="submit"
                      className="btn btn-accent"
                      disabled={sendingReply || !replyText.trim()}
                    >
                      <Send size={14} />
                      <span>{sendingReply ? "Sending reply..." : "Send to author"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab 2: Internal Staff Notes (Authors NEVER see these) */}
          {activeTab === "notes" && (
            <div>
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "var(--surface-alt)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  fontSize: "12.5px",
                  color: "var(--text-muted)",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Lock size={14} color="var(--accent)" />
                <span>Internal notes are private to BookLeaf staff. Authors never see this log.</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                {internalNotes.length === 0 ? (
                  <div className="surface-card" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13.5px" }}>
                    No internal notes yet. Add one below to track backend operations (e.g. printer batch, bank NEFT).
                  </div>
                ) : (
                  internalNotes.map((note) => (
                    <div
                      key={note._id}
                      className="surface-card"
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "var(--surface)",
                        borderLeft: "3px solid var(--accent)"
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontWeight: 600, fontSize: "12.5px" }}>
                          {note.author?.name || "BookLeaf Ops"}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          {formatDateTime(note.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: "13.5px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {note.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Composer */}
              <div className="surface-card" style={{ padding: "18px" }}>
                <form onSubmit={handleAddInternalNote}>
                  <div className="form-group" style={{ marginBottom: "10px" }}>
                    <label className="form-label">Add Staff Note</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="e.g. Escalated to Repro India plant manager; waiting for batch #309 reprint..."
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      className="btn btn-outline"
                      disabled={savingNote || !internalNoteText.trim()}
                    >
                      <Lock size={13} />
                      <span>{savingNote ? "Saving..." : "Add internal note"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Ops Controls & Author Financial Context */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Status & Lifecycle Actions */}
          <div className="surface-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
              Ticket Status
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px" }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`btn btn-sm ${ticket.status === s ? "btn-secondary font-semibold" : "btn-outline"}`}
                  style={{
                    borderColor: ticket.status === s ? "var(--primary)" : "var(--border)",
                    color: ticket.status === s ? "var(--primary)" : "var(--text)"
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Assignment */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                Assigned Staff
              </div>
              <div style={{ fontSize: "13px", marginBottom: "8px" }}>
                {ticket.assignedTo ? (
                  <span style={{ fontWeight: 600 }}>{ticket.assignedTo.name}</span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Currently unassigned</span>
                )}
              </div>
              {!isAssignedToMe && (
                <button
                  onClick={handleSelfAssign}
                  className="btn btn-outline btn-sm"
                  style={{ width: "100%", fontSize: "12px" }}
                >
                  <UserCheck size={13} />
                  <span>Assign to me</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Triage & Override Controls */}
          <div className="surface-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
              AI Triage & Overrides
            </div>

            {/* AI Reasoning */}
            {ticket.aiClassification?.reasoning && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.4, backgroundColor: "var(--surface-alt)", padding: "8px 10px", borderRadius: "var(--radius)" }}>
                <strong>AI Reasoning:</strong> {ticket.aiClassification.reasoning}
              </div>
            )}

            {/* Category Override */}
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label className="form-label" style={{ fontSize: "12px" }}>
                Category (Admin can override)
              </label>
              <select
                className="form-select"
                style={{ fontSize: "13px" }}
                value={ticket.category}
                onChange={(e) => handleOverride("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Override */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "12px" }}>
                Priority Score (Admin can override)
              </label>
              <select
                className="form-select"
                style={{ fontSize: "13px" }}
                value={ticket.priority}
                onChange={(e) => handleOverride("priority", e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Author & Book Knowledge Base Context */}
          <div className="surface-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
              Author & Catalog Context
            </div>

            {ticket.book ? (
              <div style={{ fontSize: "12.5px", lineHeight: 1.6 }}>
                <div><strong style={{ color: "var(--text)" }}>Title:</strong> {ticket.book.title}</div>
                <div><strong style={{ color: "var(--text)" }}>ISBN:</strong> <span className="isbn-font">{ticket.book.isbn}</span></div>
                <div><strong style={{ color: "var(--text)" }}>Status:</strong> {ticket.book.status}</div>
                <div><strong style={{ color: "var(--text)" }}>Production Stage:</strong> {ticket.book.productionStage}</div>
                <div><strong style={{ color: "var(--text)" }}>MRP:</strong> {formatINR(ticket.book.mrp)}</div>
                <div><strong style={{ color: "var(--text)" }}>Copies Sold:</strong> {ticket.book.copiesSold?.toLocaleString("en-IN")}</div>
                <div><strong style={{ color: "var(--text)" }}>Royalty Pending:</strong> {formatINR(ticket.book.royaltyPending)}</div>
              </div>
            ) : (
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                This is an account-level inquiry not attached to an individual book.
              </div>
            )}

            {ticket.author?.bankDetails && (
              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
                <div><strong style={{ color: "var(--text)" }}>Bank Verified:</strong> {ticket.author.bankDetails.verified ? "Yes" : "No"}</div>
                {ticket.author.bankDetails.bankName && (
                  <div><strong style={{ color: "var(--text)" }}>Bank:</strong> {ticket.author.bankDetails.bankName} (IFSC: {ticket.author.bankDetails.ifsc})</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
