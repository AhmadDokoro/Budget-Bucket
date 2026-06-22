import { round2 } from "@/lib/utils";

/**
 * Format a money amount with its currency symbol.
 * Uses Intl for grouping but prepends the user's chosen symbol so we are not
 * tied to a fixed currency-code list (handles "RM", "₦", custom symbols, etc.).
 */
export function formatMoney(amount: number, currency = ""): string {
  const value = round2(amount);
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const hasFraction = Math.round(abs * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}${currency}${formatted}`;
}

/** Compact percentage label, e.g. "72%". */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function formatDate(epochMs: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(epochMs));
}

export function formatRelative(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "just now";
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return formatDate(epochMs);
}
