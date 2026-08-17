import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InventoryListScreen } from "../features/inventory/screens/InventoryListScreen";
import { InventoryDetailScreen } from "../features/inventory/screens/InventoryDetailScreen";
import { NewInventoryItemScreen } from "../features/inventory/screens/NewInventoryItemScreen";
import type { InventoryStackParamList } from "../features/inventory/screens/InventoryListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export function InventoryStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="InventoryList" component={InventoryListScreen} options={{ title: "Inventory" }} />
      <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} options={{ title: "Item" }} />
      <Stack.Screen name="NewInventoryItem" component={NewInventoryItemScreen} options={{ title: "New Item", presentation: "modal" }} />
      <Stack.Screen name="EditInventoryItem" component={NewInventoryItemScreen} options={{ title: "Edit Item", presentation: "modal" }} />
    </Stack.Navigator>
  );
}
