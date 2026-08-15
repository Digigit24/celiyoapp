import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PatientListScreen } from "../features/patients/screens/PatientListScreen";
import { PatientDetailScreen } from "../features/patients/screens/PatientDetailScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

export type PatientsStackParamList = {
  PatientList: undefined;
  PatientDetail: { patientId: number };
};

const Stack = createNativeStackNavigator<PatientsStackParamList>();

export function PatientsStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: "Patients" }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: "Patient" }} />
    </Stack.Navigator>
  );
}
