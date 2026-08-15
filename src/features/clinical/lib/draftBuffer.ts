/**
 * AsyncStorage-backed local draft buffer — the RN analogue of
 * celiyohms/src/features/clinical/components/EmrWorkspace.tsx's localStorage
 * draft buffer (belt-and-suspenders: survives a crash/kill between a
 * keystroke and the server confirming the save). Same key scheme and same
 * "restore if newer than record.updated_at" rule — see EmrWorkspace.tsx.
 *
 * Unlike localStorage, AsyncStorage isn't synchronous — callers must await
 * the read on mount before deciding whether to overlay the buffer onto
 * server values (a small UX difference from web, not a behavior change).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DraftBuffer {
  values: Record<string, unknown>;
  dirtyKeys: string[];
  savedAt: string;
}

export function draftBufferKey(
  encounterType: string,
  encounterId: number,
  formCode: string,
  occurrence: string
): string {
  return `celiyoapp:emr-draft:${encounterType}:${encounterId}:${formCode}:${occurrence}`;
}

export async function readDraftBuffer(key: string): Promise<DraftBuffer | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftBuffer>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.dirtyKeys) ||
      typeof parsed.savedAt !== "string"
    ) {
      return null;
    }
    return { values: parsed.values ?? {}, dirtyKeys: parsed.dirtyKeys, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export async function writeDraftBuffer(key: string, buffer: DraftBuffer): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(buffer));
  } catch {
    // Best-effort belt-and-suspenders layer, not the primary save path.
  }
}

export async function clearDraftBuffer(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}
