/**
 * Format currency in Indian Rupees format (e.g. ₹6,720)
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

/**
 * Format relative date (e.g. "3 days ago", "4 hours ago", "Just now")
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

/**
 * Format human readable date (e.g. "15 Oct 2024")
 */
export function formatDate(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/**
 * Format human readable date and time (e.g. "15 Oct 2024, 02:45 PM")
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
