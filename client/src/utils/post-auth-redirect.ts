/**
 * Persists a post-auth redirect target across the register -> verify-email ->
 * login round trip. The verification link is opened from an email, so it
 * can't carry a `?redirect=` query param end to end — this bridges the gap
 * via localStorage, scoped to the current browser (the common case: the user
 * verifies from the same device/browser they registered on).
 */
import { isSafeInternalPath } from "./validation";

const STORAGE_KEY = "postAuthRedirect";

export function savePostAuthRedirect(path: string | null | undefined): void {
  if (typeof window === "undefined" || !isSafeInternalPath(path)) return;
  localStorage.setItem(STORAGE_KEY, path);
}

export function getPostAuthRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return isSafeInternalPath(stored) ? stored : null;
}

export function clearPostAuthRedirect(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
