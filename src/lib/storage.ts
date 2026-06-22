import type { BudgetState, Scope } from "@/types";

const STORAGE_KEY = "budget-buckets:v1";
const CURRENT_VERSION = 1;
const EVENT = "budget-buckets:change";

const EMPTY_STATE: BudgetState = { version: CURRENT_VERSION, scopes: [] };

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Cached snapshot. `useSyncExternalStore` requires getSnapshot to return a
 * referentially stable value between changes, otherwise it loops forever.
 * We parse LocalStorage once, cache the result, and only invalidate it when
 * the data actually changes (this tab via writeState, other tabs via the
 * native `storage` event).
 */
let cache: BudgetState | null = null;

function loadFresh(): BudgetState {
  if (!isBrowser()) return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as BudgetState;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.scopes)) {
      return EMPTY_STATE;
    }
    return migrate(parsed);
  } catch {
    return EMPTY_STATE;
  }
}

/** Stable, cached read used by getSnapshot. */
export function readState(): BudgetState {
  if (cache === null) cache = loadFresh();
  return cache;
}

export function writeState(state: BudgetState): void {
  // Update the cache synchronously so subscribers reading getSnapshot right
  // after the change see the new reference.
  cache = state;
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage unavailable — fail silently, the in-memory
    // cache still reflects the change for this session.
  }
  // Notify subscribers in the same tab (the native `storage` event only
  // fires in *other* tabs).
  if (isBrowser()) window.dispatchEvent(new CustomEvent(EVENT));
}

function migrate(state: BudgetState): BudgetState {
  // Single version today. Future migrations branch on state.version here.
  return { ...state, version: CURRENT_VERSION };
}

/* ------------------------------------------------------------------ */
/* Subscription (for useSyncExternalStore)                            */
/* ------------------------------------------------------------------ */

export function subscribe(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  // Same-tab change: cache is already updated by writeState.
  const localHandler = () => callback();
  // Cross-tab change: another tab wrote LocalStorage, so drop our cache and
  // force a fresh parse on the next getSnapshot.
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cache = null;
      callback();
    }
  };
  window.addEventListener(EVENT, localHandler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EVENT, localHandler);
    window.removeEventListener("storage", storageHandler);
  };
}

/* ------------------------------------------------------------------ */
/* Mutations — all return the next state and persist it.              */
/* ------------------------------------------------------------------ */

function commit(mutator: (state: BudgetState) => BudgetState): BudgetState {
  const next = mutator(readState());
  writeState(next);
  return next;
}

function touch(scope: Scope): Scope {
  return { ...scope, updatedAt: Date.now() };
}

export const store = {
  getScopes(): Scope[] {
    return readState().scopes;
  },

  getScope(id: string): Scope | undefined {
    return readState().scopes.find((s) => s.id === id);
  },

  upsertScope(scope: Scope): void {
    commit((state) => {
      const exists = state.scopes.some((s) => s.id === scope.id);
      const scopes = exists
        ? state.scopes.map((s) => (s.id === scope.id ? touch(scope) : s))
        : [touch(scope), ...state.scopes];
      return { ...state, scopes };
    });
  },

  deleteScope(id: string): void {
    commit((state) => ({
      ...state,
      scopes: state.scopes.filter((s) => s.id !== id),
    }));
  },

  /** Replace the entire scope set (used for reordering / import). */
  replaceScopes(scopes: Scope[]): void {
    commit((state) => ({ ...state, scopes }));
  },

  /** Export the raw state for backup. */
  exportState(): BudgetState {
    return readState();
  },
};
