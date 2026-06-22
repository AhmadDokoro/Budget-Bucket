"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Receipt,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomSheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryCard } from "@/components/budget/category-card";
import { CategoryFormSheet } from "@/components/budget/category-form-sheet";
import { TransactionSheet } from "@/components/budget/transaction-sheet";
import { TransactionRow } from "@/components/budget/transaction-row";
import { ScopeFormSheet } from "@/components/budget/scope-form-sheet";
import { useScopeSummary } from "@/hooks/use-budget";
import { useMounted } from "@/hooks/use-mounted";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

export default function ScopeDetailPage() {
  const params = useParams<{ id: string }>();
  const scopeId = params.id;
  const router = useRouter();
  const mounted = useMounted();
  const { summary, actions } = useScopeSummary(scopeId);

  const [txOpen, setTxOpen] = useState(false);
  const [txCategoryId, setTxCategoryId] = useState<string | undefined>(undefined);
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editScopeOpen, setEditScopeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false);

  const categoryNames = useMemo(() => {
    const map = new Map<string, string>();
    summary?.scope.categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [summary?.scope.categories]);

  if (!mounted) {
    return <div className="min-h-[100dvh]" />;
  }

  if (!summary) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Scope not found</p>
        <p className="text-sm text-muted-foreground">
          It may have been deleted on this device.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </main>
    );
  }

  const { scope, remaining, totalSpent, totalAllocated, unallocated, usedRatio, categories } =
    summary;
  const over = remaining < 0;

  const openNewCategory = () => {
    setEditingCategory(undefined);
    setCatSheetOpen(true);
  };
  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCatSheetOpen(true);
  };
  const openTransactionFor = (categoryId?: string) => {
    setTxCategoryId(categoryId);
    setTxOpen(true);
  };

  return (
    <main className="relative flex min-h-[100dvh] flex-col pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 px-2 text-center">
            <h1 className="truncate text-base font-semibold">{scope.name}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Scope options"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="space-y-7 px-5 pt-2">
        {/* Hero — remaining balance */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/60 bg-gradient-to-b from-card to-secondary/20 p-6"
        >
          <p className="text-sm font-medium text-muted-foreground">Remaining balance</p>
          <p
            className={cn(
              "tabular mt-1 text-5xl font-bold tracking-tight",
              over ? "text-rose-400" : "text-foreground"
            )}
          >
            {formatMoney(remaining, scope.currency)}
          </p>

          <div className="mt-5">
            <Progress
              value={usedRatio}
              indicatorClassName={
                usedRatio >= 0.8
                  ? "bg-rose-500"
                  : usedRatio >= 0.5
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular">
                {formatMoney(totalSpent, scope.currency)} of{" "}
                {formatMoney(scope.budget, scope.currency)}
              </span>
              <span className="tabular font-medium">{formatPercent(usedRatio)} used</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Allocated" value={formatMoney(totalAllocated, scope.currency)} />
            <Stat
              label={unallocated < 0 ? "Over-allocated" : "Unallocated"}
              value={formatMoney(Math.abs(unallocated), scope.currency)}
              accent={unallocated < 0 ? "text-rose-400" : undefined}
            />
          </div>
        </motion.section>

        {/* Buckets */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <LayoutGrid className="h-4 w-4" />
              Buckets
            </h2>
            <button
              type="button"
              onClick={openNewCategory}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {categories.length === 0 ? (
            <button
              type="button"
              onClick={openNewCategory}
              className="flex w-full flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card/40 px-6 py-10 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold">Create your first bucket</p>
              <p className="text-xs text-muted-foreground">
                Split {formatMoney(scope.budget, scope.currency)} into spending buckets
              </p>
            </button>
          ) : (
            <motion.div layout className="space-y-3">
              {categories.map((c, i) => (
                <CategoryCard
                  key={c.category.id}
                  summary={c}
                  currency={scope.currency}
                  index={i}
                  onEdit={() => openEditCategory(c.category)}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* Transactions */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Receipt className="h-4 w-4" />
            Activity
          </h2>
          {scope.transactions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
              No transactions yet. Tap the + button to add one.
            </p>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {scope.transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    categoryName={categoryNames.get(tx.categoryId) ?? "Deleted bucket"}
                    currency={scope.currency}
                    onDelete={() => actions.deleteTransaction(scope.id, tx.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* Floating action button */}
      <motion.button
        type="button"
        onClick={() => openTransactionFor(undefined)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.15 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Add transaction"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-[max(1.25rem,calc(50%-240px+1.25rem))] z-30 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40"
      >
        <Plus className="h-7 w-7" />
      </motion.button>

      {/* Sheets & dialogs */}
      <TransactionSheet
        open={txOpen}
        onOpenChange={setTxOpen}
        summary={summary}
        defaultCategoryId={txCategoryId}
        onSubmit={(values) => actions.addTransaction(scope.id, values)}
      />

      <CategoryFormSheet
        open={catSheetOpen}
        onOpenChange={setCatSheetOpen}
        scope={scope}
        category={editingCategory}
        onSubmit={(values) => {
          if (editingCategory) {
            actions.updateCategory(scope.id, editingCategory.id, values);
          } else {
            actions.addCategory(scope.id, values);
          }
        }}
        onDelete={
          editingCategory
            ? () => actions.deleteCategory(scope.id, editingCategory.id)
            : undefined
        }
      />

      <ScopeFormSheet
        open={editScopeOpen}
        onOpenChange={setEditScopeOpen}
        initial={scope}
        onSubmit={(values) => actions.updateScope(scope.id, values)}
      />

      <ScopeActionsSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onEdit={() => {
          setMenuOpen(false);
          setEditScopeOpen(true);
        }}
        onReset={() => {
          setMenuOpen(false);
          setResetOpen(true);
        }}
        onDelete={() => {
          setMenuOpen(false);
          setDeleteScopeOpen(true);
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset this scope?"
        description="Clears all transactions and restores every bucket to its original allocated balance. Buckets are kept."
        confirmLabel="Reset"
        onConfirm={() => actions.resetScope(scope.id)}
      />

      <ConfirmDialog
        open={deleteScopeOpen}
        onOpenChange={setDeleteScopeOpen}
        title={`Delete “${scope.name}”?`}
        description="Permanently removes this scope, its buckets, and all transactions. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          actions.deleteScope(scope.id);
          router.push("/");
        }}
      />
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-0.5 text-lg font-bold tracking-tight", accent)}>
        {value}
      </p>
    </div>
  );
}

function ScopeActionsSheet({
  open,
  onOpenChange,
  onEdit,
  onReset,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Scope options" hideHeader>
      <div className="space-y-2 pb-2">
        <ActionItem icon={<Pencil className="h-5 w-5" />} label="Edit scope" onClick={onEdit} />
        <ActionItem
          icon={<RotateCcw className="h-5 w-5" />}
          label="Reset scope"
          description="Clear transactions, keep buckets"
          onClick={onReset}
        />
        <ActionItem
          icon={<Trash2 className="h-5 w-5" />}
          label="Delete scope"
          destructive
          onClick={onDelete}
        />
      </div>
    </BottomSheet>
  );
}

function ActionItem({
  icon,
  label,
  description,
  destructive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-secondary/40 px-4 py-3.5 text-left transition-colors active:bg-secondary",
        destructive && "text-rose-400"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          destructive ? "bg-rose-500/10" : "bg-background"
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && (
          <span className="block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </button>
  );
}
