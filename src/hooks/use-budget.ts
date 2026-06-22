"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Category, Scope, Transaction, TransactionType } from "@/types";
import { store, subscribe } from "@/lib/storage";
import { summarizeScope } from "@/lib/budget";
import { round2, uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Subscriptions                                                      */
/* ------------------------------------------------------------------ */

// Stable empty reference for SSR / first hydration render. Returning a fresh
// array here would make getSnapshot/getServerSnapshot unstable and loop.
const SERVER_SCOPES: Scope[] = [];

function useScopes(): Scope[] {
  return useSyncExternalStore(
    subscribe,
    store.getScopes,
    () => SERVER_SCOPES
  );
}

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export interface CreateScopeInput {
  name: string;
  currency: string;
  budget: number;
}

export interface CategoryInput {
  name: string;
  allocated: number;
}

export interface TransactionInput {
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
}

export function createScope(input: CreateScopeInput): Scope {
  const now = Date.now();
  const scope: Scope = {
    id: uid("scope"),
    name: input.name.trim(),
    currency: input.currency.trim(),
    budget: round2(input.budget),
    categories: [],
    transactions: [],
    createdAt: now,
    updatedAt: now,
  };
  store.upsertScope(scope);
  return scope;
}

function withScope(scopeId: string, fn: (scope: Scope) => Scope): void {
  const scope = store.getScope(scopeId);
  if (!scope) return;
  store.upsertScope(fn(scope));
}

export const budgetActions = {
  createScope,

  updateScope(
    scopeId: string,
    patch: Partial<Pick<Scope, "name" | "currency" | "budget">>
  ) {
    withScope(scopeId, (scope) => ({
      ...scope,
      ...patch,
      name: patch.name !== undefined ? patch.name.trim() : scope.name,
      currency: patch.currency !== undefined ? patch.currency.trim() : scope.currency,
      budget: patch.budget !== undefined ? round2(patch.budget) : scope.budget,
    }));
  },

  deleteScope(scopeId: string) {
    store.deleteScope(scopeId);
  },

  addCategory(scopeId: string, input: CategoryInput): Category {
    const category: Category = {
      id: uid("cat"),
      name: input.name.trim(),
      allocated: round2(input.allocated),
    };
    withScope(scopeId, (scope) => ({
      ...scope,
      categories: [...scope.categories, category],
    }));
    return category;
  },

  updateCategory(scopeId: string, categoryId: string, input: CategoryInput) {
    withScope(scopeId, (scope) => ({
      ...scope,
      categories: scope.categories.map((c) =>
        c.id === categoryId
          ? { ...c, name: input.name.trim(), allocated: round2(input.allocated) }
          : c
      ),
    }));
  },

  deleteCategory(scopeId: string, categoryId: string) {
    withScope(scopeId, (scope) => ({
      ...scope,
      categories: scope.categories.filter((c) => c.id !== categoryId),
      // Drop transactions tied to the removed category so balances stay sane.
      transactions: scope.transactions.filter((t) => t.categoryId !== categoryId),
    }));
  },

  addTransaction(scopeId: string, input: TransactionInput): Transaction {
    const tx: Transaction = {
      id: uid("tx"),
      categoryId: input.categoryId,
      type: input.type,
      amount: round2(Math.abs(input.amount)),
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
    };
    withScope(scopeId, (scope) => ({
      ...scope,
      transactions: [tx, ...scope.transactions],
    }));
    return tx;
  },

  deleteTransaction(scopeId: string, transactionId: string) {
    // Removing the transaction automatically reverses its effect, because
    // category balances are always derived from the transaction list.
    withScope(scopeId, (scope) => ({
      ...scope,
      transactions: scope.transactions.filter((t) => t.id !== transactionId),
    }));
  },

  resetScope(scopeId: string) {
    // Clear transactions only — categories and allocations are preserved,
    // which restores every category to its original allocated balance.
    withScope(scopeId, (scope) => ({ ...scope, transactions: [] }));
  },
};

/* ------------------------------------------------------------------ */
/* Public hooks                                                       */
/* ------------------------------------------------------------------ */

/** All scopes plus their derived summaries, kept in sync with storage. */
export function useBudget() {
  const scopes = useScopes();
  const summaries = scopes.map(summarizeScope);
  return { scopes, summaries, actions: budgetActions } as const;
}

/** A single scope summary by id, or null if it does not exist. */
export function useScopeSummary(scopeId: string) {
  const scopes = useScopes();
  const scope = scopes.find((s) => s.id === scopeId);
  const summary = scope ? summarizeScope(scope) : null;
  const actions = useCallback(() => budgetActions, [])();
  return { summary, actions } as const;
}
