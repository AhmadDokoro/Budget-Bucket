"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import type { Scope } from "@/types";

const CURRENCY_PRESETS = ["RM", "₦", "$", "£", "€", "₹", "¥"];

export interface ScopeFormValues {
  name: string;
  currency: string;
  budget: number;
}

interface ScopeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provide to edit an existing scope; omit to create a new one. */
  initial?: Scope;
  onSubmit: (values: ScopeFormValues) => void;
}

export function ScopeFormSheet({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: ScopeFormSheetProps) {
  const editing = Boolean(initial);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("RM");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCurrency(initial?.currency ?? "RM");
      setBudget(initial?.budget ? String(initial.budget) : "");
    }
  }, [open, initial]);

  const budgetNum = parseFloat(budget) || 0;
  const valid = name.trim().length > 0 && currency.trim().length > 0 && budgetNum > 0;

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit({ name: name.trim(), currency: currency.trim(), budget: budgetNum });
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit scope" : "New budget scope"}
      description={
        editing
          ? "Update the name, currency, or total budget."
          : "Create a spending area, then split it into buckets."
      }
    >
      <div className="space-y-5 pb-2">
        <div className="space-y-2">
          <Label htmlFor="scope-name">Scope name</Label>
          <Input
            id="scope-name"
            placeholder="e.g. Malaysia Living"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!editing}
            maxLength={40}
          />
        </div>

        <div className="space-y-2">
          <Label>Currency symbol</Label>
          <div className="flex flex-wrap gap-2">
            {CURRENCY_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`h-11 min-w-11 rounded-xl border px-3 text-base font-semibold transition-colors ${
                  currency === c
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
            <Input
              aria-label="Custom currency symbol"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.slice(0, 3))}
              className="h-11 w-20 text-center"
              placeholder="Other"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scope-budget">Total budget</Label>
          <MoneyInput
            id="scope-budget"
            value={budget}
            onValueChange={setBudget}
            currency={currency}
            placeholder="0.00"
          />
        </div>

        <Button className="w-full" size="lg" disabled={!valid} onClick={handleSubmit}>
          {editing ? "Save changes" : "Create scope"}
        </Button>
      </div>
    </BottomSheet>
  );
}
