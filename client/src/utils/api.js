const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? "/api" : "http://localhost:5002/api");

function notifyWarmup(state) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("render-server-warmup", { detail: { state } }));
  }
}

/**
 * Robust fetch wrapper with Render Cold-Start Detection & Auto-Retry
 * Handles Render free-tier sleep cycles gracefully without dropping user requests.
 */
export async function apiRequest(endpoint, options = {}, retriesLeft = 6) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set a 2.5s timer to trigger the "Waking up Server" fallback if request is delayed by cold start
  const warmupTimer = setTimeout(() => {
    notifyWarmup("waking");
  }, 2200);

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    clearTimeout(warmupTimer);
  } catch (err) {
    clearTimeout(warmupTimer);

    // Network error or connection refused during container boot: Retry if attempts remain
    if (retriesLeft > 0) {
      notifyWarmup("waking");
      await new Promise((resolve) => setTimeout(resolve, 3500));
      return apiRequest(endpoint, options, retriesLeft - 1);
    }
    throw new Error("Unable to connect to BookLeaf server. It may still be starting up on Render — please wait a few seconds and try again.");
  }

  // Handle Render 502/503/504 Bad Gateway / Gateway Timeout during wake up
  if ([502, 503, 504].includes(response.status)) {
    if (retriesLeft > 0) {
      notifyWarmup("waking");
      await new Promise((resolve) => setTimeout(resolve, 3500));
      return apiRequest(endpoint, options, retriesLeft - 1);
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.details ? data.details.join(", ") : "Request failed");
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  // Request succeeded: notify that the server is ready
  notifyWarmup("ready");
  return data;
}
