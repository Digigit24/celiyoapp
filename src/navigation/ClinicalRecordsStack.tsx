import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClinicalRecordsListScreen } from "../features/clinicalRecords/screens/ClinicalRecordsListScreen";
import { ClinicalRecordsDetailScreen } from "../features/clinicalRecords/screens/ClinicalRecordsDetailScreen";
import type { ClinicalRecordsStackParamList } from "../features/clinicalRecords/screens/ClinicalRecordsListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<ClinicalRecordsStackParamList>();

export function ClinicalRecordsStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="ClinicalRecordsList" component={ClinicalRecordsListScreen} options={{ title: "Clinical Records" }} />
      <Stack.Screen name="ClinicalRecordsDetail" component={ClinicalRecordsDetailScreen} options={{ title: "Record" }} />
    </Stack.Navigator>
  );
}
