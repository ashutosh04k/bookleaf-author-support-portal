import React from "react";

export function Badge({ type, children }) {
  const norm = (type || "").toLowerCase().replace(/\s+/g, "-");

  let badgeClass = "badge-low";
  if (norm === "critical") badgeClass = "badge-critical";
  else if (norm === "high") badgeClass = "badge-high";
  else if (norm === "medium") badgeClass = "badge-medium";
  else if (norm === "low") badgeClass = "badge-low";
  else if (norm === "open") badgeClass = "badge-open";
  else if (norm === "in-progress") badgeClass = "badge-in-progress";
  else if (norm === "resolved") badgeClass = "badge-resolved";
  else if (norm === "closed") badgeClass = "badge-closed";

  return <span className={`badge ${badgeClass}`}>{children || type}</span>;
}
