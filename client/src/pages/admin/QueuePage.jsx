import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { formatRelativeTime } from "../../utils/formatters";
import { Badge } from "../../components/Badge";
import { useSocket } from "../../context/SocketContext";
import { Search, Filter, RefreshCw, AlertTriangle, UserCheck } from "lucide-react";

export function QueuePage({ assignedOnly = false }) {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("oldest"); // SLA focus: oldest first default

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      if (priorityFilter !== "All") params.append("priority", priorityFilter);
      if (assignedOnly) params.append("assignedTo", "me");
      if (search.trim()) params.append("search", search.trim());
      if (sortBy) params.append("sortBy", sortBy);

      const [queueRes, statsRes] = await Promise.all([
        apiRequest(`/admin/queue?${params.toString()}`),
        apiRequest("/admin/stats")
      ]);

      if (queueRes.success) setTickets(queueRes.tickets || []);
      if (statsRes.success) setStats(statsRes.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, categoryFilter, priorityFilter, sortBy, assignedOnly]);

  // Real-time updates on socket events
  useEffect(() => {
    if (!socket) return;

    const handleTicketCreated = () => fetchQueue();
    const handleTicketUpdated = (updated) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t))
      );
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [socket]);

  const handleRowClick = (id) => {
    navigate(`/admin/tickets/${id}`);
  };

  return (
    <div className="app-container">
      {/* Header & Stats Ribbon */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="serif-heading">
            {assignedOnly ? "Tickets assigned to you" : "Author Support Queue"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Operational ticket triage, AI auto-classification, and publishing SLA tracking.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="btn btn-outline btn-sm"
          title="Refresh queue"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Operations Stats Ribbon */}
      {stats && (
        <div
          className="surface-card mb-6"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "12px",
            padding: "14px 18px"
          }}
        >
          <div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Total Active
            </div>
            <div className="tabular-nums" style={{ fontSize: "1.35rem", fontWeight: 600, marginTop: "2px" }}>
              {stats.open + stats.inProgress}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Critical Unresolved
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
                marginTop: "2px",
                color: stats.criticalUnresolved > 0 ? "var(--accent)" : "inherit"
              }}
            >
              {stats.criticalUnresolved}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Unassigned
            </div>
            <div className="tabular-nums" style={{ fontSize: "1.35rem", fontWeight: 600, marginTop: "2px" }}>
              {stats.unassigned}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Resolved / Closed
            </div>
            <div className="tabular-nums" style={{ fontSize: "1.35rem", fontWeight: 600, marginTop: "2px", color: "var(--primary)" }}>
              {stats.resolved}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="surface-card mb-4"
        style={{
          padding: "12px 16px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          backgroundColor: "var(--surface-alt)"
        }}
      >
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "1 1 200px" }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            style={{ padding: "5px 10px", fontSize: "13px" }}
            placeholder="Search ticket #, subject, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchQueue()}
          />
        </div>

        {/* Status Filter */}
        <select
          className="form-select"
          style={{ width: "auto", padding: "5px 10px", fontSize: "13px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        {/* Category Filter */}
        <select
          className="form-select"
          style={{ width: "auto", padding: "5px 10px", fontSize: "13px" }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Royalty & Payments">Royalty & Payments</option>
          <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
          <option value="Printing & Quality">Printing & Quality</option>
          <option value="Distribution & Availability">Distribution</option>
          <option value="Book Status & Production Updates">Production Updates</option>
          <option value="General Inquiry">General Inquiry</option>
        </select>

        {/* Priority Filter */}
        <select
          className="form-select"
          style={{ width: "auto", padding: "5px 10px", fontSize: "13px" }}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Sort */}
        <select
          className="form-select"
          style={{ width: "auto", padding: "5px 10px", fontSize: "13px" }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="oldest">Oldest First (SLA Priority)</option>
          <option value="newest">Newest First</option>
          <option value="priority">Priority Order</option>
        </select>
      </div>

      {/* Ticket Queue Dense Table */}
      {loading ? (
        <div style={{ padding: "40px 0", color: "var(--text-muted)" }}>Loading operations queue...</div>
      ) : error ? (
        <div className="surface-card" style={{ borderLeft: "3px solid var(--accent)", color: "var(--accent)" }}>
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="surface-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "var(--text-muted)" }}>No tickets matching your filter criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th style={{ width: "95px" }}>ID</th>
                <th>Author</th>
                <th>Subject & Book</th>
                <th>AI Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Age</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const isCritical = t.priority === "Critical" && (t.status === "Open" || t.status === "In Progress");
                const isHigh = t.priority === "High" && (t.status === "Open" || t.status === "In Progress");
                const rowClass = isCritical ? "row-critical" : isHigh ? "row-high" : "";

                return (
                  <tr
                    key={t._id}
                    className={rowClass}
                    onClick={() => handleRowClick(t._id)}
                  >
                    <td className="isbn-font" style={{ fontWeight: 600 }}>
                      {t.ticketNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.author?.name || "Unknown Author"}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        {t.author?.email}
                      </div>
                    </td>
                    <td style={{ maxWidth: "340px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {t.subject}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {t.book ? t.book.title : "General / Account Level"}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "12.5px" }}>{t.category}</span>
                      {t.aiClassification?.isOverridden && (
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>
                          (Overridden)
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge type={t.priority}>{t.priority}</Badge>
                    </td>
                    <td>
                      <Badge type={t.status}>{t.status}</Badge>
                    </td>
                    <td style={{ fontSize: "12.5px", whiteSpace: "nowrap", color: isCritical ? "var(--accent)" : "var(--text-muted)" }}>
                      {formatRelativeTime(t.createdAt)}
                    </td>
                    <td style={{ fontSize: "12.5px" }}>
                      {t.assignedTo ? (
                        <span>{t.assignedTo.name}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
