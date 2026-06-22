"use client";

import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import type { CategorySummary } from "@/types";
import { Progress } from "@/components/ui/progress";
import { formatMoney, formatPercent } from "@/lib/format";
import { healthStyle } from "@/lib/health";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  summary: CategorySummary;
  currency: string;
  index?: number;
  onEdit: () => void;
}

export function CategoryCard({ summary, currency, index = 0, onEdit }: CategoryCardProps) {
  const { category, remaining, spent, usedRatio, health } = summary;
  const style = healthStyle(health);
  const over = remaining < 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 280, damping: 30 }}
      className="rounded-3xl border border-border/60 bg-card p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{category.name}</h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                style.chip
              )}
            >
              {style.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatMoney(category.allocated, currency)} allocated ·{" "}
            {formatMoney(spent, currency)} spent
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${category.name}`}
          className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-secondary"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Remaining
          </p>
          <p
            className={cn(
              "tabular text-2xl font-bold tracking-tight",
              over ? "text-rose-400" : style.text
            )}
          >
            {formatMoney(remaining, currency)}
          </p>
        </div>
        <span className="tabular text-sm font-medium text-muted-foreground">
          {formatPercent(usedRatio)} used
        </span>
      </div>

      <div className="mt-3">
        <Progress value={usedRatio} indicatorClassName={style.bar} />
      </div>
    </motion.div>
  );
}
