import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LabListScreen } from "../features/diagnostics/screens/LabListScreen";
import { LabDetailScreen } from "../features/diagnostics/screens/LabDetailScreen";
import type { LabStackParamList } from "../features/diagnostics/screens/LabListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<LabStackParamList>();

export function DiagnosticsStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="LabList" component={LabListScreen} options={{ title: "Lab" }} />
      <Stack.Screen name="LabDetail" component={LabDetailScreen} options={{ title: "Order" }} />
    </Stack.Navigator>
  );
}
