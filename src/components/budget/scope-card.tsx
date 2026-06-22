"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Wallet } from "lucide-react";
import type { ScopeSummary } from "@/types";
import { Progress } from "@/components/ui/progress";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ScopeCard({ summary, index = 0 }: { summary: ScopeSummary; index?: number }) {
  const { scope, remaining, totalSpent, usedRatio } = summary;
  const over = remaining < 0;
  const barColor =
    usedRatio >= 0.8 ? "bg-rose-500" : usedRatio >= 0.5 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 28 }}
    >
      <Link
        href={`/scope/${scope.id}`}
        className="block rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition-colors active:bg-secondary/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight">{scope.name}</h3>
              <p className="text-xs text-muted-foreground">
                {scope.categories.length}{" "}
                {scope.categories.length === 1 ? "bucket" : "buckets"} ·{" "}
                {formatMoney(scope.budget, scope.currency)} budget
              </p>
            </div>
          </div>
          <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Remaining balance
          </p>
          <p
            className={cn(
              "tabular mt-1 text-3xl font-bold tracking-tight",
              over ? "text-rose-400" : "text-foreground"
            )}
          >
            {formatMoney(remaining, scope.currency)}
          </p>
        </div>

        <div className="mt-4">
          <Progress value={usedRatio} indicatorClassName={barColor} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular">
              {formatMoney(totalSpent, scope.currency)} spent
            </span>
            <span className="tabular font-medium">{formatPercent(usedRatio)} used</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
