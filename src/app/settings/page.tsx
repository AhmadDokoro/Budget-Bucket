"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, Info } from "lucide-react";
import { ThemeSegmentedControl } from "@/components/theme-toggle";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-[100dvh] flex-col pb-16">
      <header className="sticky top-0 z-20 bg-background/80 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      <div className="space-y-8 px-5 pt-4">
        {/* Appearance */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <SectionLabel icon={<Palette className="h-4 w-4" />}>Appearance</SectionLabel>
          <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
            <p className="text-sm font-semibold">Theme</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose how Budget Buckets looks. System follows your device.
            </p>
            <div className="mt-4">
              <ThemeSegmentedControl />
            </div>
          </div>
        </motion.section>

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <SectionLabel icon={<Info className="h-4 w-4" />}>About</SectionLabel>
          <div className="divide-y divide-border/60 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
            <Row label="App" value="Budget Buckets" />
            <Row label="Version" value="1.0.0" />
            <Row label="Storage" value="On this device" />
          </div>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            All data is stored locally in your browser. Nothing is sent to a
            server. Installing the app to your home screen keeps everything
            available offline.
          </p>
        </motion.section>
      </div>
    </main>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {icon}
      {children}
    </h2>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
