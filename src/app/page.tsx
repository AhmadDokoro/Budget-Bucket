"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, PiggyBank, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/theme-toggle";
import { ScopeCard } from "@/components/budget/scope-card";
import { ScopeFormSheet, type ScopeFormValues } from "@/components/budget/scope-form-sheet";
import { useBudget } from "@/hooks/use-budget";
import { useMounted } from "@/hooks/use-mounted";
import { formatMoney } from "@/lib/format";

export default function DashboardPage() {
  const mounted = useMounted();
  const { summaries, actions } = useBudget();
  const [createOpen, setCreateOpen] = useState(false);

  const headline = useMemo(() => {
    // Sum remaining across scopes that share the same currency symbol; if mixed,
    // just show the scope count instead of a misleading total.
    const currencies = new Set(summaries.map((s) => s.scope.currency));
    if (summaries.length === 0) return null;
    if (currencies.size === 1) {
      const currency = summaries[0].scope.currency;
      const total = summaries.reduce((sum, s) => sum + s.remaining, 0);
      return { label: "Total remaining", value: formatMoney(total, currency) };
    }
    return { label: "Active scopes", value: String(summaries.length) };
  }, [summaries]);

  const handleCreate = (values: ScopeFormValues) => {
    const scope = actions.createScope(values);
    void scope;
  };

  return (
    <main className="relative flex min-h-[100dvh] flex-col px-5 pb-28 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PiggyBank className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-muted-foreground">
              Budget Buckets
            </span>
          </div>
          <div className="-mr-2 flex items-center">
            <ThemeToggleButton />
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {mounted && headline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <p className="text-sm font-medium text-muted-foreground">{headline.label}</p>
            <p className="tabular mt-1 text-4xl font-bold tracking-tight">
              {headline.value}
            </p>
          </motion.div>
        )}
      </header>

      {mounted ? (
        summaries.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <section className="space-y-4">
            {summaries.map((summary, i) => (
              <ScopeCard key={summary.scope.id} summary={summary} index={i} />
            ))}
          </section>
        )
      ) : (
        <DashboardSkeleton />
      )}

      {mounted && summaries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          <Button
            size="lg"
            className="w-full shadow-xl shadow-primary/30"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-5 w-5" />
            New scope
          </Button>
        </motion.div>
      )}

      <ScopeFormSheet open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
    </main>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center justify-center text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <PiggyBank className="h-10 w-10" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">Start budgeting</h2>
      <p className="mt-2 max-w-xs text-balance text-sm text-muted-foreground">
        Create your first budget scope — like “Malaysia Living” — and split it
        into spending buckets.
      </p>
      <Button size="lg" className="mt-8 px-8" onClick={onCreate}>
        <Plus className="h-5 w-5" />
        Create your first scope
      </Button>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-3xl border border-border/60 bg-card"
        />
      ))}
    </div>
  );
}
