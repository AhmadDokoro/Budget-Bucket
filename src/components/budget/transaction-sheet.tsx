"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/ui/money-input";
import type { ScopeSummary, TransactionType } from "@/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: ScopeSummary;
  /** Preselect a category (e.g. opened from a category card). */
  defaultCategoryId?: string;
  onSubmit: (values: {
    categoryId: string;
    type: TransactionType;
    amount: number;
    note?: string;
  }) => void;
}

export function TransactionSheet({
  open,
  onOpenChange,
  summary,
  defaultCategoryId,
  onSubmit,
}: TransactionSheetProps) {
  const { scope, categories } = summary;
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setType("expense");
      setCategoryId(defaultCategoryId ?? categories[0]?.category.id ?? "");
      setAmount("");
      setNote("");
    }
  }, [open, defaultCategoryId, categories]);

  const amountNum = parseFloat(amount) || 0;
  const valid = categoryId !== "" && amountNum > 0;
  const selected = categories.find((c) => c.category.id === categoryId);

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit({ categoryId, type, amount: amountNum, note: note.trim() || undefined });
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add transaction"
      description="Record an expense or put money back into a bucket."
    >
      <div className="space-y-5 pb-2">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/40 p-1.5">
          <TypeButton
            active={type === "expense"}
            onClick={() => setType("expense")}
            icon={<ArrowUpRight className="h-4 w-4" />}
            label="Expense"
            activeClass="bg-rose-500/15 text-rose-400"
          />
          <TypeButton
            active={type === "adjustment"}
            onClick={() => setType("adjustment")}
            icon={<ArrowDownLeft className="h-4 w-4" />}
            label="Adjustment"
            activeClass="bg-emerald-500/15 text-emerald-400"
          />
        </div>

        {/* Category picker */}
        <div className="space-y-2">
          <Label>Bucket</Label>
          {categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
              Add a bucket first to record transactions.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((c) => (
                <button
                  key={c.category.id}
                  type="button"
                  onClick={() => setCategoryId(c.category.id)}
                  className={cn(
                    "shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                    categoryId === c.category.id
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground"
                  )}
                >
                  {c.category.name}
                </button>
              ))}
            </div>
          )}
          {selected && (
            <p className="tabular text-xs text-muted-foreground">
              {formatMoney(selected.remaining, scope.currency)} remaining in{" "}
              {selected.category.name}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="tx-amount">Amount</Label>
          <MoneyInput
            id="tx-amount"
            value={amount}
            onValueChange={setAmount}
            currency={scope.currency}
            placeholder="0.00"
            autoFocus
          />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="tx-note">Note (optional)</Label>
          <Textarea
            id="tx-note"
            placeholder="e.g. Eggs and bread"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={120}
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          variant={type === "expense" ? "default" : "default"}
          disabled={!valid}
          onClick={handleSubmit}
        >
          {type === "expense" ? "Record expense" : "Record adjustment"}
        </Button>
      </div>
    </BottomSheet>
  );
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
        active ? activeClass : "text-muted-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
