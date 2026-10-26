import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { formatDateTime, formatINR } from "../../utils/formatters";
import { Badge } from "../../components/Badge";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Send, Paperclip, CheckCircle } from "lucide-react";

export function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchTicket = async () => {
    try {
      const res = await apiRequest(`/tickets/${id}`);
      if (res.success) {
        setTicket(res.ticket);
        setMessages(res.messages || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Real-time socket events for this ticket
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("joinTicket", id);

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        // avoid duplicate if already added
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    };

    const handleTicketUpdated = (updatedTicket) => {
      if (updatedTicket._id === id) {
        setTicket(updatedTicket);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socket.emit("leaveTicket", id);
      socket.off("message:new", handleNewMessage);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSending(true);
      const res = await apiRequest(`/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: replyText.trim() })
      });

      if (res.success) {
        setReplyText("");
        // Socket listener will add message; also optimistically ensure it
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
      }
    } catch (err) {
      alert("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ padding: "40px 0", color: "var(--text-muted)" }}>Loading ticket conversation...</div>
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

  return (
    <div className="app-container" style={{ maxWidth: "880px" }}>
      <button
        onClick={() => navigate("/author/tickets")}
        className="btn btn-outline btn-sm mb-4"
        style={{ border: "none", paddingLeft: 0, color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        <span>Back to all tickets</span>
      </button>

      {/* Ticket Header Card */}
      <div className="surface-card mb-4" style={{ padding: "20px" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="isbn-font" style={{ fontSize: "14px", fontWeight: 600 }}>
              {ticket.ticketNumber}
            </span>
            <Badge type={ticket.status}>{ticket.status}</Badge>
            <Badge type={ticket.priority}>{ticket.priority}</Badge>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Created {formatDateTime(ticket.createdAt)}
          </span>
        </div>

        <h2 className="serif-heading" style={{ fontSize: "1.35rem", marginBottom: "8px" }}>
          {ticket.subject}
        </h2>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "12px" }}>
          <div>
            <strong style={{ color: "var(--text)" }}>Category:</strong> {ticket.category}
          </div>
          <div>
            <strong style={{ color: "var(--text)" }}>Associated Book:</strong>{" "}
            {ticket.book ? `${ticket.book.title} (${ticket.book.isbn})` : "General Account"}
          </div>
          <div>
            <strong style={{ color: "var(--text)" }}>Assigned Desk:</strong>{" "}
            {ticket.assignedTo ? ticket.assignedTo.name : "Publishing Operations Desk"}
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
        {messages.map((msg) => {
          const isMe = msg.role === "author";
          return (
            <div
              key={msg._id}
              className="surface-card"
              style={{
                backgroundColor: isMe ? "var(--surface)" : "var(--surface-alt)",
                borderLeft: isMe ? "1px solid var(--border)" : "3px solid var(--primary)",
                padding: "16px 18px"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 600, fontSize: "13.5px" }}>
                    {msg.sender?.name || (isMe ? "You" : "BookLeaf Operations")}
                  </span>
                  <span
                    className={`badge ${isMe ? "badge-low" : "badge-open"}`}
                    style={{ fontSize: "11px" }}
                  >
                    {isMe ? "Author" : "BookLeaf Publishing"}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {formatDateTime(msg.createdAt)}
                </span>
              </div>

              <div
                style={{
                  fontSize: "14.5px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  color: "var(--text)"
                }}
              >
                {msg.content}
              </div>

              {msg.attachments && msg.attachments.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {msg.attachments.map((att, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "12px",
                        padding: "3px 8px",
                        backgroundColor: "var(--border)",
                        borderRadius: "3px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Paperclip size={12} />
                      <span>{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input Box */}
      <div className="surface-card" style={{ padding: "18px" }}>
        <form onSubmit={handleSendReply}>
          <div className="form-group" style={{ marginBottom: "12px" }}>
            <label className="form-label">Add a response</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Type your message or further questions here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Replies appear in real-time on the BookLeaf operations desk.
            </div>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={sending || !replyText.trim()}
            >
              <Send size={14} />
              <span>{sending ? "Sending..." : "Send response"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
