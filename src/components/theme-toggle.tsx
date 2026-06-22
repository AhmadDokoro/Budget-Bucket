"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** Premium 3-way segmented control for Light / Dark / System. */
export function ThemeSegmentedControl() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const active = mounted ? theme ?? "system" : "system";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-secondary/50 p-1.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
              selected ? "text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {selected && (
              <motion.span
                layoutId="theme-pill"
                className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Compact one-tap toggle (sun/moon) for headers. Flips between light & dark
 *  based on what is currently *resolved* on screen. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === "dark";

  // Until mounted the resolved theme is unknown, so keep aria-label / handler
  // stable to match the server render and avoid a hydration mismatch.
  const label = !mounted
    ? "Toggle theme"
    : isDark
      ? "Switch to light mode"
      : "Switch to dark mode";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary",
        className
      )}
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch. */}
      {!mounted ? (
        <Sun className="h-5 w-5 opacity-0" />
      ) : (
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </motion.span>
      )}
    </button>
  );
}
