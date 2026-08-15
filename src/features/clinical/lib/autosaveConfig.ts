/** Ported verbatim from celiyohms/src/features/clinical/lib/autosave-config.ts. */
export const AUTOSAVE_CONFIG = {
  /** Trailing debounce after the last edit before a save fires. */
  DEBOUNCE_MS: 1000,
  /** Never wait longer than this between checkpoints while edits keep coming. */
  MAX_WAIT_MS: 5000,
  /** How often the local durable buffer (AsyncStorage) is rewritten. */
  BUFFER_THROTTLE_MS: 500,
  /** How long the "Autosaved" label lingers before fading to just the dot. */
  SAVED_LABEL_LINGER_MS: 1500,
  /** Exponential backoff schedule (ms) for retrying a failed autosave. */
  RETRY_BACKOFF_MS: [2000, 5000, 15000, 30000],
  /** Number of consecutive failed retries before a single toast is surfaced. */
  PERSISTENT_FAILURE_TOAST_AFTER: 3,
} as const;
