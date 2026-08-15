import React from "react";
import { View } from "react-native";
import { EmptyState } from "../components/ui";
import { MODULES } from "../constants/modules";

interface ModulePlaceholderScreenProps {
  route: { params: { moduleId: string } };
}

/** Placeholder for modules that land in Phase 2/3. */
export function ModulePlaceholderScreen({ route }: ModulePlaceholderScreenProps) {
  const mod = MODULES.find((m) => m.id === route.params.moduleId);

  return (
    <View className="flex-1 bg-background justify-center">
      <EmptyState
        icon={(mod?.icon as never) ?? "construct-outline"}
        title={mod?.label ?? "Module"}
        message={
          mod?.phase
            ? `This module ships in Phase ${mod.phase}. The shell, auth, and permissions are already live.`
            : "Coming soon."
        }
      />
    </View>
  );
}
