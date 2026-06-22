/**
 * Domain types for Budget Buckets.
 *
 * Money is stored as a plain number in the scope's currency units
 * (e.g. ringgit, naira). All persistence happens through the storage layer.
 */

export type TransactionType = "expense" | "adjustment";

export interface Category {
  id: string;
  name: string;
  /** The original amount allocated to this category from the scope budget. */
  allocated: number;
}

export interface Transaction {
  id: string;
  categoryId: string;
  type: TransactionType;
  /** Always a positive magnitude. The `type` decides the direction. */
  amount: number;
  note?: string;
  /** Epoch milliseconds. */
  createdAt: number;
}

export interface Scope {
  id: string;
  name: string;
  /** Currency symbol, e.g. "RM", "₦", "$". */
  currency: string;
  /** Total budget for the scope. Category allocations should sum to this. */
  budget: number;
  categories: Category[];
  transactions: Transaction[];
  createdAt: number;
  updatedAt: number;
}

export interface BudgetState {
  version: number;
  scopes: Scope[];
}

/* ------------------------------------------------------------------ */
/* Derived (computed) view models                                     */
/* ------------------------------------------------------------------ */

export type CategoryHealth = "healthy" | "warning" | "critical";

export interface CategorySummary {
  category: Category;
  /** Net amount spent: expenses minus adjustments (can be negative). */
  spent: number;
  /** allocated - spent. */
  remaining: number;
  /** Fraction of allocation consumed, clamped to [0, 1] for display. */
  usedRatio: number;
  /** Fraction of allocation remaining, clamped to [0, 1] for display. */
  remainingRatio: number;
  health: CategoryHealth;
}

export interface ScopeSummary {
  scope: Scope;
  /** Sum of all category allocations. */
  totalAllocated: number;
  /** budget - totalAllocated. Positive means budget left to assign. */
  unallocated: number;
  /** Net spend across all transactions. */
  totalSpent: number;
  /** budget - totalSpent. The headline "Remaining Balance". */
  remaining: number;
  /** Fraction of budget consumed, clamped to [0, 1]. */
  usedRatio: number;
  categories: CategorySummary[];
}
