/**
 * Ported from celiyohms/src/features/clinical/hooks/useAutosave.ts — the
 * debounce/max-wait/single-flight/backoff/flushNow scheduler is pure logic
 * with no DOM dependency beyond a couple of event listeners. Web's `online`
 * event → NetInfo; web's `visibilitychange`/`pagehide` (tab hide/navigate
 * away) → AppState background/inactive (app backgrounding is RN's closest
 * analogue). Everything else ports unchanged.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { AUTOSAVE_CONFIG } from "./autosaveConfig";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "offline";
export type PerformSaveResult = "ok" | "error";

export interface UseAutosaveOptions {
  /** False when read-only/locked/completed or there's no structure to save against. */
  enabled: boolean;
  hasPendingChanges: () => boolean;
  performSave: () => Promise<PerformSaveResult>;
  onPersistentFailure?: () => void;
  debounceMs?: number;
  maxWaitMs?: number;
  backoffMs?: readonly number[];
  persistentFailureAfter?: number;
  savedLabelLingerMs?: number;
}

export interface UseAutosaveResult {
  status: SaveStatus;
  lastSavedAt: Date | null;
  /** Debounced trigger — call from onChange. Coalesces bursts into one save. */
  scheduleSave: () => void;
  /** Immediate save, bypassing the debounce. Awaits the in-flight/next attempt. */
  flushNow: () => Promise<void>;
}

let lastKnownConnected = true;

export function useAutosave({
  enabled,
  hasPendingChanges,
  performSave,
  onPersistentFailure,
  debounceMs = AUTOSAVE_CONFIG.DEBOUNCE_MS,
  maxWaitMs = AUTOSAVE_CONFIG.MAX_WAIT_MS,
  backoffMs = AUTOSAVE_CONFIG.RETRY_BACKOFF_MS,
  persistentFailureAfter = AUTOSAVE_CONFIG.PERSISTENT_FAILURE_TOAST_AFTER,
  savedLabelLingerMs = AUTOSAVE_CONFIG.SAVED_LABEL_LINGER_MS,
}: UseAutosaveOptions): UseAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const hasPendingRef = useRef(hasPendingChanges);
  hasPendingRef.current = hasPendingChanges;
  const performSaveRef = useRef(performSave);
  performSaveRef.current = performSave;
  const onPersistentFailureRef = useRef(onPersistentFailure);
  onPersistentFailureRef.current = onPersistentFailure;

  const savingRef = useRef(false);
  const unmountedRef = useRef(false);
  const pendingAfterSaveRef = useRef(false);
  const retryCountRef = useRef(0);
  const persistentFailureFiredRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedLingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitersRef = useRef<Array<() => void>>([]);

  const clearScheduleTimers = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    debounceTimerRef.current = null;
    maxWaitTimerRef.current = null;
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }, []);

  const runSaveRef = useRef<() => Promise<void>>(async () => {});

  const scheduleRetry = useCallback(() => {
    clearRetryTimer();
    const idx = Math.min(retryCountRef.current - 1, backoffMs.length - 1);
    const delay = backoffMs[Math.max(0, idx)] ?? backoffMs[backoffMs.length - 1] ?? 30_000;
    retryTimerRef.current = setTimeout(() => {
      void runSaveRef.current();
    }, delay);
  }, [backoffMs, clearRetryTimer]);

  const resolveWaiters = useCallback(() => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  const runSave = useCallback(async () => {
    if (!enabledRef.current) {
      resolveWaiters();
      return;
    }
    if (savingRef.current) {
      pendingAfterSaveRef.current = true;
      return;
    }
    if (!hasPendingRef.current()) {
      resolveWaiters();
      return;
    }

    savingRef.current = true;
    clearScheduleTimers();
    clearRetryTimer();
    setStatus("saving");

    let result: PerformSaveResult = "ok";
    try {
      result = await performSaveRef.current();
    } catch {
      result = "error";
    }

    savingRef.current = false;

    if (result === "error") {
      retryCountRef.current += 1;
      setStatus(lastKnownConnected ? "error" : "offline");
      if (
        retryCountRef.current >= persistentFailureAfter &&
        !persistentFailureFiredRef.current &&
        !unmountedRef.current
      ) {
        persistentFailureFiredRef.current = true;
        onPersistentFailureRef.current?.();
      }
      if (!unmountedRef.current) scheduleRetry();
      resolveWaiters();
      return;
    }

    retryCountRef.current = 0;
    persistentFailureFiredRef.current = false;
    clearRetryTimer();

    const mustRunAgain = pendingAfterSaveRef.current || hasPendingRef.current();
    pendingAfterSaveRef.current = false;

    if (mustRunAgain && !unmountedRef.current) {
      setStatus("dirty");
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (waitersRef.current.length > 0) {
        debounceTimerRef.current = setTimeout(() => {
          void runSaveRef.current();
        }, 0);
      } else {
        debounceTimerRef.current = setTimeout(() => {
          void runSaveRef.current();
        }, debounceMs);
      }
      return;
    }

    setLastSavedAt(new Date());
    setStatus("saved");
    if (savedLingerTimerRef.current) clearTimeout(savedLingerTimerRef.current);
    savedLingerTimerRef.current = setTimeout(() => {
      setStatus((s) => (s === "saved" ? "idle" : s));
    }, savedLabelLingerMs);

    resolveWaiters();
  }, [
    clearScheduleTimers,
    clearRetryTimer,
    debounceMs,
    persistentFailureAfter,
    resolveWaiters,
    savedLabelLingerMs,
    scheduleRetry,
  ]);

  runSaveRef.current = runSave;

  const scheduleSave = useCallback(() => {
    if (!enabledRef.current) return;
    setStatus((s) => (s === "saving" ? s : "dirty"));
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void runSaveRef.current();
    }, debounceMs);
    if (!maxWaitTimerRef.current) {
      maxWaitTimerRef.current = setTimeout(() => {
        void runSaveRef.current();
      }, maxWaitMs);
    }
  }, [debounceMs, maxWaitMs]);

  const flushNow = useCallback(async () => {
    if (!enabledRef.current) return;
    if (!hasPendingRef.current() && !savingRef.current) return;
    await new Promise<void>((resolve) => {
      waitersRef.current.push(resolve);
      void runSaveRef.current();
    });
  }, []);

  // Reconnect handling: retry immediately once back online.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected !== false;
      const wasOffline = !lastKnownConnected;
      lastKnownConnected = connected;
      if (connected && wasOffline && enabledRef.current && hasPendingRef.current()) {
        void runSaveRef.current();
      }
    });
    return unsubscribe;
  }, []);

  // Best-effort final flush on app backgrounding — RN's analogue of tab
  // hide/navigation away. The AsyncStorage draft buffer (owned by the
  // caller) is the real no-data-loss guarantee since the request can be
  // killed mid-flight while backgrounding.
  useEffect(() => {
    function handleAppStateChange(next: AppStateStatus) {
      if ((next === "background" || next === "inactive") && hasPendingRef.current()) {
        void runSaveRef.current();
      }
    }
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearScheduleTimers();
      clearRetryTimer();
      if (savedLingerTimerRef.current) clearTimeout(savedLingerTimerRef.current);
      if (enabledRef.current && !savingRef.current && hasPendingRef.current()) {
        void runSaveRef.current();
      }
    };
  }, [clearScheduleTimers, clearRetryTimer]);

  return { status, lastSavedAt, scheduleSave, flushNow };
}
