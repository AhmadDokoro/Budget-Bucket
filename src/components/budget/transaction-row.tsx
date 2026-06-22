"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { formatMoney, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransactionRowProps {
  transaction: Transaction;
  categoryName: string;
  currency: string;
  onDelete: () => void;
}

export function TransactionRow({
  transaction,
  categoryName,
  currency,
  onDelete,
}: TransactionRowProps) {
  const isExpense = transaction.type === "expense";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isExpense ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
        )}
      >
        {isExpense ? (
          <ArrowUpRight className="h-5 w-5" />
        ) : (
          <ArrowDownLeft className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{categoryName}</p>
          <p
            className={cn(
              "tabular shrink-0 text-sm font-bold",
              isExpense ? "text-rose-400" : "text-emerald-400"
            )}
          >
            {isExpense ? "-" : "+"}
            {formatMoney(transaction.amount, currency)}
          </p>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {transaction.note ? transaction.note + " · " : ""}
          {formatRelative(transaction.createdAt)}
        </p>
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete transaction"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-secondary"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
