import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { formatINR, formatDate } from "../../utils/formatters";
import { Badge } from "../../components/Badge";
import { BookOpen, PlusCircle, AlertCircle } from "lucide-react";

export function BooksPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        const res = await apiRequest("/books/my-books");
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ padding: "40px 0", color: "var(--text-muted)" }}>Loading your books...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="surface-card" style={{ borderLeft: "3px solid var(--accent)", color: "var(--accent)" }}>
          {error}
        </div>
      </div>
    );
  }

  const { books, summary } = data;

  return (
    <div className="app-container">
      {/* Page Title & Action */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="serif-heading">Your books</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Overview of your published catalog, production milestones, and accrued royalties.
          </p>
        </div>
        <Link to="/author/raise-query" className="btn btn-accent">
          <PlusCircle size={15} />
          <span>Raise a query</span>
        </Link>
      </div>

      {/* Financial Summary Ribbon */}
      <div
        className="surface-card mb-6"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          padding: "16px 20px"
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Total Copies Sold
          </div>
          <div className="tabular-nums" style={{ fontSize: "1.45rem", fontWeight: 600, marginTop: "4px" }}>
            {summary.totalCopiesSold.toLocaleString("en-IN")}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Royalty Earned
          </div>
          <div className="tabular-nums" style={{ fontSize: "1.45rem", fontWeight: 600, marginTop: "4px" }}>
            {formatINR(summary.totalRoyaltyEarned)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Royalty Paid
          </div>
          <div className="tabular-nums" style={{ fontSize: "1.45rem", fontWeight: 600, marginTop: "4px" }}>
            {formatINR(summary.totalRoyaltyPaid)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Royalty Pending
          </div>
          <div
            className="tabular-nums"
            style={{
              fontSize: "1.45rem",
              fontWeight: 600,
              marginTop: "4px",
              color: summary.totalRoyaltyPending > 0 ? "var(--primary)" : "var(--text)"
            }}
          >
            {formatINR(summary.totalRoyaltyPending)}
          </div>
          {summary.totalRoyaltyPending > 0 && summary.totalRoyaltyPending < 1000 && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Below ₹1,000 threshold (rolls over to next quarter)
            </div>
          )}
        </div>
      </div>

      {/* Books Table */}
      {books.length === 0 ? (
        <div className="surface-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "var(--text-muted)" }}>No books found in your author account.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Title & ISBN</th>
                <th>Genre</th>
                <th>Status / Stage</th>
                <th>MRP</th>
                <th>Royalty / Copy</th>
                <th>Copies Sold</th>
                <th>Earned</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const isLive = (b.status || "").toLowerCase().includes("live");
                return (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{b.title}</div>
                      <div className="isbn-font" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                        {b.isbn}
                      </div>
                      {b.printPartner && b.printPartner !== "null" && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Print Partner: {b.printPartner}
                        </div>
                      )}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{b.genre}</td>
                    <td>
                      <Badge type={isLive ? "resolved" : "in-progress"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="tabular-nums">
                      {b.mrp ? formatINR(b.mrp) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {b.authorRoyaltyPerCopy ? formatINR(b.authorRoyaltyPerCopy) : "—"}
                    </td>
                    <td className="tabular-nums font-semibold">
                      {b.copiesSold ? b.copiesSold.toLocaleString("en-IN") : "0"}
                    </td>
                    <td className="tabular-nums">{formatINR(b.royaltyEarned)}</td>
                    <td className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {formatINR(b.royaltyPaid)}
                    </td>
                    <td
                      className="tabular-nums font-semibold"
                      style={{ color: b.royaltyPending > 0 ? "var(--primary)" : "inherit" }}
                    >
                      {formatINR(b.royaltyPending)}
                    </td>
                    <td>
                      <Link
                        to={`/author/raise-query?bookId=${b._id}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        Raise Query
                      </Link>
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
