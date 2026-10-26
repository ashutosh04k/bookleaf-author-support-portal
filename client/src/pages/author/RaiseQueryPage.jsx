import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { Paperclip, Send, AlertCircle, ArrowLeft } from "lucide-react";

export function RaiseQueryPage() {
  const [searchParams] = useSearchParams();
  const preselectedBookId = searchParams.get("bookId") || "general";
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(preselectedBookId);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await apiRequest("/books/my-books");
        if (res.success) {
          setBooks(res.books || []);
        }
      } catch (err) {
        console.warn("Could not load books:", err.message);
      }
    }
    loadBooks();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachment({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError("Please enter a subject for your query.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a detailed description so our team can assist you.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        bookId: selectedBookId === "general" ? null : selectedBookId,
        subject: subject.trim(),
        description: description.trim(),
        attachments: attachment ? [attachment] : []
      };

      const res = await apiRequest("/tickets", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.success && res.ticket) {
        navigate(`/author/tickets/${res.ticket._id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to submit query. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: "780px" }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline btn-sm mb-4"
        style={{ border: "none", paddingLeft: 0, color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        <span>Back</span>
      </button>

      <div className="surface-card" style={{ padding: "28px" }}>
        <h1 className="serif-heading" style={{ marginBottom: "6px" }}>Raise a query</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
          Our author operations team will review your query and respond promptly.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--surface-alt)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "var(--radius)",
              color: "var(--accent)",
              fontSize: "13.5px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Associated Book Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="bookSelect">
              Associated book
            </label>
            <select
              id="bookSelect"
              className="form-select"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
            >
              <option value="general">General / Account Level (Not book-specific)</option>
              {books.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title} ({b.isbn}) — {b.status}
                </option>
              ))}
            </select>
            <div className="form-helper">
              Pick the specific book this query pertains to, or leave as General Account.
            </div>
          </div>

          {/* Subject Line */}
          <div className="form-group">
            <label className="form-label" htmlFor="subjectInput">
              Subject
            </label>
            <input
              id="subjectInput"
              type="text"
              className="form-input"
              placeholder="e.g. Haven't received royalty for Q2, or ISBN metadata mismatch on Amazon"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="descriptionInput">
              Detailed description
            </label>
            <textarea
              id="descriptionInput"
              className="form-textarea"
              rows={6}
              placeholder="Please provide complete context: dates, retail links, account details, or specific error descriptions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* File Attachment */}
          <div className="form-group">
            <label className="form-label">
              Attachment (Optional)
            </label>
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius)",
                padding: "16px",
                backgroundColor: "var(--surface-alt)",
                textAlign: "center"
              }}
            >
              <input
                type="file"
                id="fileUpload"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <label
                htmlFor="fileUpload"
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13.5px",
                  color: "var(--primary)",
                  fontWeight: 600
                }}
              >
                <Paperclip size={16} />
                <span>{attachment ? attachment.name : "Attach photo, screenshot, or document"}</span>
              </label>
              {attachment && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {(attachment.size / 1024).toFixed(1)} KB selected &bull;{" "}
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                </div>
              )}
              {!attachment && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  PNG, JPG, PDF up to 10MB (e.g. photos of damaged binding or retailer screenshots)
                </div>
              )}
            </div>
          </div>

          {/* Single Accent Rust Submit Button */}
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={submitting}
              style={{ padding: "9px 20px" }}
            >
              <Send size={15} />
              <span>{submitting ? "Submitting query..." : "Submit query"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
