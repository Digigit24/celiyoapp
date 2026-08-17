import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PharmacyListScreen } from "../features/pharmacy/screens/PharmacyListScreen";
import { PharmacyDetailScreen } from "../features/pharmacy/screens/PharmacyDetailScreen";
import { NewPrescriptionScreen } from "../features/pharmacy/screens/NewPrescriptionScreen";
import type { PharmacyStackParamList } from "../features/pharmacy/screens/PharmacyListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<PharmacyStackParamList>();

export function PharmacyStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="PharmacyList" component={PharmacyListScreen} options={{ title: "Pharmacy" }} />
      <Stack.Screen name="PharmacyDetail" component={PharmacyDetailScreen} options={{ title: "Prescription" }} />
      <Stack.Screen name="NewPrescription" component={NewPrescriptionScreen} options={{ title: "New Prescription", presentation: "modal" }} />
    </Stack.Navigator>
  );
}
