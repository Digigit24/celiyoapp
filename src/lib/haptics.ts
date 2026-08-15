import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Haptics are cosmetic — never let a missing/failed native module break a tap.
 * Web has no impact API, so it's a no-op there.
 */
function safe(run: () => Promise<unknown>): void {
  if (Platform.OS === "web") return;
  void run().catch(() => {});
}

/** Tab change, row press — the lightest available tick. */
export function tapFeedback(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** FAB open/close, destructive confirm — a touch heavier. */
export function actionFeedback(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}
