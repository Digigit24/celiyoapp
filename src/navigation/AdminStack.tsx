import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminListScreen } from "../features/admin/screens/AdminListScreen";
import { AdminDetailScreen } from "../features/admin/screens/AdminDetailScreen";
import { NewStaffScreen } from "../features/admin/screens/NewStaffScreen";
import type { AdminStackParamList } from "../features/admin/screens/AdminListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="AdminList" component={AdminListScreen} options={{ title: "Admin" }} />
      <Stack.Screen name="AdminDetail" component={AdminDetailScreen} options={{ title: "Staff" }} />
      <Stack.Screen name="NewStaff" component={NewStaffScreen} options={{ title: "Add staff", presentation: "modal" }} />
    </Stack.Navigator>
  );
}
