import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DaycareListScreen } from "../features/daycare/screens/DaycareListScreen";
import { DaycareDetailScreen } from "../features/daycare/screens/DaycareDetailScreen";
import type { DaycareStackParamList } from "../features/daycare/screens/DaycareListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<DaycareStackParamList>();

export function DaycareStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="DaycareList" component={DaycareListScreen} options={{ title: "Daycare" }} />
      <Stack.Screen name="DaycareDetail" component={DaycareDetailScreen} options={{ title: "Session" }} />
    </Stack.Navigator>
  );
}
