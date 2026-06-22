import type { CategoryHealth } from "@/types";

interface HealthStyle {
  /** Progress bar fill. */
  bar: string;
  /** Text accent. */
  text: string;
  /** Soft background chip. */
  chip: string;
  label: string;
}

export const HEALTH_STYLES: Record<CategoryHealth, HealthStyle> = {
  healthy: {
    bar: "bg-emerald-500",
    text: "text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-400",
    label: "On track",
  },
  warning: {
    bar: "bg-amber-500",
    text: "text-amber-400",
    chip: "bg-amber-500/10 text-amber-400",
    label: "Getting low",
  },
  critical: {
    bar: "bg-rose-500",
    text: "text-rose-400",
    chip: "bg-rose-500/10 text-rose-400",
    label: "Almost gone",
  },
};

export function healthStyle(health: CategoryHealth): HealthStyle {
  return HEALTH_STYLES[health];
}
