"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Category, Scope } from "@/types";
import { maxAllocationFor } from "@/lib/budget";
import { formatMoney } from "@/lib/format";

interface CategoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: Scope;
  /** Provide to edit an existing category; omit to add a new one. */
  category?: Category;
  onSubmit: (values: { name: string; allocated: number }) => void;
  onDelete?: () => void;
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  scope,
  category,
  onSubmit,
  onDelete,
}: CategoryFormSheetProps) {
  const editing = Boolean(category);
  const [name, setName] = useState("");
  const [allocated, setAllocated] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const maxAllocation = maxAllocationFor(scope, category?.id);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setAllocated(category?.allocated ? String(category.allocated) : "");
    }
  }, [open, category]);

  const allocatedNum = parseFloat(allocated) || 0;
  const exceeds = allocatedNum > maxAllocation + 1e-9;
  const valid = name.trim().length > 0 && allocatedNum > 0 && !exceeds;

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit({ name: name.trim(), allocated: allocatedNum });
    onOpenChange(false);
  };

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={editing ? "Edit bucket" : "New bucket"}
        description={`${formatMoney(maxAllocation, scope.currency)} left to allocate`}
      >
        <div className="space-y-5 pb-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Bucket name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus={!editing}
              maxLength={32}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-amount">Allocation</Label>
            <MoneyInput
              id="cat-amount"
              value={allocated}
              onValueChange={setAllocated}
              currency={scope.currency}
              placeholder="0.00"
            />
            {exceeds ? (
              <p className="text-xs font-medium text-rose-400">
                Exceeds remaining budget. Max{" "}
                {formatMoney(maxAllocation, scope.currency)}.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setAllocated(String(maxAllocation))}
                className="text-xs font-medium text-primary"
                disabled={maxAllocation <= 0}
              >
                Use all remaining ({formatMoney(maxAllocation, scope.currency)})
              </button>
            )}
          </div>

          <Button className="w-full" size="lg" disabled={!valid} onClick={handleSubmit}>
            {editing ? "Save bucket" : "Add bucket"}
          </Button>

          {editing && onDelete && (
            <Button
              variant="ghost"
              className="w-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete bucket
            </Button>
          )}
        </div>
      </BottomSheet>

      {editing && onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete “${category?.name}”?`}
          description="This removes the bucket and any transactions recorded against it. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            onDelete();
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
}
