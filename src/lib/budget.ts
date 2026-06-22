import type {
  Category,
  CategoryHealth,
  CategorySummary,
  Scope,
  ScopeSummary,
} from "@/types";
import { clamp, round2 } from "@/lib/utils";

/** Signed contribution of a transaction to "spent": expenses add, adjustments subtract. */
export function signedSpend(type: "expense" | "adjustment", amount: number): number {
  return type === "expense" ? amount : -amount;
}

export function categoryHealth(remainingRatio: number): CategoryHealth {
  if (remainingRatio > 0.5) return "healthy";
  if (remainingRatio >= 0.2) return "warning";
  return "critical";
}

export function summarizeCategory(scope: Scope, category: Category): CategorySummary {
  const spent = round2(
    scope.transactions
      .filter((t) => t.categoryId === category.id)
      .reduce((sum, t) => sum + signedSpend(t.type, t.amount), 0)
  );
  const remaining = round2(category.allocated - spent);
  const usedRatio =
    category.allocated > 0 ? clamp(spent / category.allocated, 0, 1) : spent > 0 ? 1 : 0;
  const remainingRatio =
    category.allocated > 0 ? clamp(remaining / category.allocated, 0, 1) : remaining > 0 ? 1 : 0;

  return {
    category,
    spent,
    remaining,
    usedRatio,
    remainingRatio,
    health: categoryHealth(category.allocated > 0 ? remaining / category.allocated : 1),
  };
}

export function summarizeScope(scope: Scope): ScopeSummary {
  const categories = scope.categories.map((c) => summarizeCategory(scope, c));
  const totalAllocated = round2(
    scope.categories.reduce((sum, c) => sum + c.allocated, 0)
  );
  const totalSpent = round2(
    scope.transactions.reduce((sum, t) => sum + signedSpend(t.type, t.amount), 0)
  );
  const remaining = round2(scope.budget - totalSpent);
  const unallocated = round2(scope.budget - totalAllocated);
  const usedRatio = scope.budget > 0 ? clamp(totalSpent / scope.budget, 0, 1) : 0;

  return {
    scope,
    totalAllocated,
    unallocated,
    totalSpent,
    remaining,
    usedRatio,
    categories,
  };
}

/**
 * The maximum amount a category can be (re)allocated without the sum of all
 * allocations exceeding the scope budget. Used to guard the category editor.
 */
export function maxAllocationFor(scope: Scope, excludeCategoryId?: string): number {
  const otherAllocations = scope.categories
    .filter((c) => c.id !== excludeCategoryId)
    .reduce((sum, c) => sum + c.allocated, 0);
  return round2(Math.max(0, scope.budget - otherAllocations));
}
