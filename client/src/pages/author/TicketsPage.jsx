import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { formatRelativeTime } from "../../utils/formatters";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { useSocket } from "../../context/SocketContext";
import { PlusCircle, MessageSquare } from "lucide-react";

export function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const { socket } = useSocket();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== "All" ? `?status=${statusFilter}` : "";
      const res = await apiRequest(`/tickets/my-tickets${query}`);
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  // Real-time listener: refresh or update ticket list on socket events
  useEffect(() => {
    if (!socket) return;

    const handleTicketCreated = (newTicket) => {
      setTickets((prev) => [newTicket, ...prev]);
    };

    const handleTicketUpdated = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [socket]);

  return (
    <div className="app-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="serif-heading">Your tickets</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Track the status of your queries and view communication from the BookLeaf team.
          </p>
        </div>
        <Link to="/author/raise-query" className="btn btn-accent">
          <PlusCircle size={15} />
          <span>Raise a query</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["All", "Open", "In Progress", "Resolved", "Closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn btn-sm ${statusFilter === s ? "btn-secondary font-semibold" : "btn-outline"}`}
            style={{
              borderColor: statusFilter === s ? "var(--primary)" : "var(--border)",
              color: statusFilter === s ? "var(--primary)" : "var(--text-muted)"
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", color: "var(--text-muted)" }}>Loading your tickets...</div>
      ) : error ? (
        <div className="surface-card" style={{ borderLeft: "3px solid var(--accent)", color: "var(--accent)" }}>
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="No tickets yet – raise one if you need help with a book."
          actionText="Raise a query"
          actionTo="/author/raise-query"
        />
      ) : (
        <div className="table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject & Book</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td className="isbn-font" style={{ fontWeight: 600 }}>
                    {t.ticketNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{t.subject}</div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {t.book ? t.book.title : "General / Account Level"}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "13px" }}>{t.category}</span>
                  </td>
                  <td>
                    <Badge type={t.priority}>{t.priority}</Badge>
                  </td>
                  <td>
                    <Badge type={t.status}>{t.status}</Badge>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>
                    {formatRelativeTime(t.createdAt)}
                  </td>
                  <td>
                    <Link
                      to={`/author/tickets/${t._id}`}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: "12px", padding: "4px 8px" }}
                    >
                      <MessageSquare size={13} />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
