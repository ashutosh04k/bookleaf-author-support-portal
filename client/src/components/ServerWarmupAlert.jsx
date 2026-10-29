import React, { useState, useEffect } from "react";
import { Server, RefreshCw, CheckCircle2, X } from "lucide-react";

export function ServerWarmupAlert() {
  const [isWaking, setIsWaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let timer = null;

    const handleServerStatus = (e) => {
      const { state } = e.detail || {};
      if (state === "waking") {
        setIsWaking(true);
        setIsReady(false);
        setDismissed(false);
      } else if (state === "ready") {
        if (isWaking) {
          setIsReady(true);
          setTimeout(() => {
            setIsWaking(false);
            setIsReady(false);
            setElapsed(0);
          }, 3200);
        } else {
          setIsWaking(false);
        }
      }
    };

    window.addEventListener("render-server-warmup", handleServerStatus);

    return () => {
      window.removeEventListener("render-server-warmup", handleServerStatus);
    };
  }, [isWaking]);

  useEffect(() => {
    let interval = null;
    if (isWaking && !isReady) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWaking, isReady]);

  // Initial fast health check on load to detect cold start immediately
  useEffect(() => {
    let active = true;
    const checkTimeout = setTimeout(() => {
      // If health check hasn't finished in 2.2 seconds, server is likely sleeping on Render
      if (active) {
        window.dispatchEvent(new CustomEvent("render-server-warmup", { detail: { state: "waking" } }));
      }
    }, 2200);

    const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? "/api" : "http://localhost:5002/api");
    const healthUrl = API_BASE.replace(/\/api$/, "/health");

    fetch(healthUrl, { method: "GET", cache: "no-store" })
      .then((res) => {
        if (active) {
          clearTimeout(checkTimeout);
          if (res.ok) {
            window.dispatchEvent(new CustomEvent("render-server-warmup", { detail: { state: "ready" } }));
          } else {
            window.dispatchEvent(new CustomEvent("render-server-warmup", { detail: { state: "waking" } }));
          }
        }
      })
      .catch(() => {
        if (active) {
          clearTimeout(checkTimeout);
          window.dispatchEvent(new CustomEvent("render-server-warmup", { detail: { state: "waking" } }));
        }
      });

    return () => {
      active = false;
      clearTimeout(checkTimeout);
    };
  }, []);

  if ((!isWaking && !isReady) || dismissed) {
    return null;
  }

  // Estimated Render cold start ~35 seconds
  const progressPercent = Math.min(95, Math.round((elapsed / 40) * 100));

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "92%",
        maxWidth: "580px",
        backgroundColor: "var(--card-bg, #FFFFFF)",
        border: isReady ? "1px solid #2F5D50" : "1px solid var(--border, #E6DEC9)",
        boxShadow: "0 10px 30px rgba(47, 93, 80, 0.12), 0 2px 8px rgba(0,0,0,0.06)",
        borderRadius: "8px",
        padding: "16px 20px",
        fontFamily: "var(--font-sans, 'IBM Plex Sans', sans-serif)",
        color: "var(--text, #1F2421)",
        animation: "slideDown 0.3s ease-out"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              backgroundColor: isReady ? "#E8F3EE" : "#FFF7ED",
              color: isReady ? "#2F5D50" : "#B5562F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px"
            }}
          >
            {isReady ? (
              <CheckCircle2 size={20} />
            ) : (
              <RefreshCw size={18} style={{ animation: "spin 2s linear infinite" }} />
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h4
                style={{
                  margin: 0,
                  fontFamily: "var(--font-serif, 'Newsreader', Georgia, serif)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: isReady ? "#2F5D50" : "var(--text, #1F2421)"
                }}
              >
                {isReady ? "BookLeaf Server is Live & Ready" : "Waking up Server (Hosted on Render Free Tier)"}
              </h4>
              {!isReady && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#F4EBE1",
                    color: "#B5562F"
                  }}
                >
                  {elapsed}s
                </span>
              )}
            </div>

            <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, color: "var(--text-muted, #6B7280)" }}>
              {isReady
                ? "The backend container is awake. All ticket operations, real-time messaging, and AI triage are now operational."
                : "Render automatically puts free instances to sleep after periods of inactivity. The backend is spinning up now (typically takes 30–50s). Requests are retrying automatically."}
            </p>

            {!isReady && (
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    height: "4px",
                    width: "100%",
                    backgroundColor: "#F1EBE1",
                    borderRadius: "2px",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      backgroundColor: "#2F5D50",
                      transition: "width 0.8s ease"
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "var(--text-muted, #8B8B8B)",
                    marginTop: "4px"
                  }}
                >
                  <span>Connecting to MongoDB & AI Engine...</span>
                  <span>~35s avg wake-up</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          title="Dismiss notice"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted, #9CA3AF)",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -15px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
