import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MrdListScreen } from "../features/mrd/screens/MrdListScreen";
import { MrdDetailScreen } from "../features/mrd/screens/MrdDetailScreen";
import type { MrdStackParamList } from "../features/mrd/screens/MrdListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<MrdStackParamList>();

export function MrdStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="MrdList" component={MrdListScreen} options={{ title: "MRD" }} />
      <Stack.Screen name="MrdDetail" component={MrdDetailScreen} options={{ title: "File" }} />
    </Stack.Navigator>
  );
}
