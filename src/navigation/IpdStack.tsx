import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { IpdAdmissionListScreen } from "../features/ipd/screens/IpdAdmissionListScreen";
import { IpdAdmissionDetailScreen } from "../features/ipd/screens/IpdAdmissionDetailScreen";
import { NewIpdAdmissionScreen } from "../features/ipd/screens/NewIpdAdmissionScreen";
import { PrintPreviewScreen, type PrintPreviewRouteParams } from "../features/clinical/screens/PrintPreviewScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

export type IpdStackParamList = {
  IpdAdmissionList: undefined;
  IpdAdmissionDetail: { admissionId: number; initialTab?: string };
  NewIpdAdmission: undefined;
  PrintPreview: PrintPreviewRouteParams;
};

const Stack = createNativeStackNavigator<IpdStackParamList>();

export function IpdStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="IpdAdmissionList" component={IpdAdmissionListScreen} options={{ title: "IPD" }} />
      <Stack.Screen name="IpdAdmissionDetail" component={IpdAdmissionDetailScreen} options={{ title: "Admission" }} />
      <Stack.Screen name="NewIpdAdmission" component={NewIpdAdmissionScreen} options={{ title: "New Admission", presentation: "modal" }} />
      <Stack.Screen name="PrintPreview" component={PrintPreviewScreen} options={{ headerShown: false, presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}
