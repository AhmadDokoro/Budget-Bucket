"use client";

import * as React from "react";
import { ThemeProvider, useTheme } from "next-themes";

/** Keeps the PWA <meta name="theme-color"> in sync with the active theme so the
 *  Android status bar / browser chrome matches even when the user overrides the
 *  system preference. */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const color = resolvedTheme === "light" ? "#f7f7fb" : "#0a0a0c";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      enableColorScheme
      storageKey="budget-buckets:theme"
    >
      {children}
      <ThemeColorSync />
    </ThemeProvider>
  );
}
