import React from "react";

/** Renders children only when `show` is true — keeps permission checks a one-liner in role dashboards. */
export function Gate({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <>{children}</>;
}
