import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OpdVisitListScreen } from "../features/opd/screens/OpdVisitListScreen";
import { OpdVisitDetailScreen } from "../features/opd/screens/OpdVisitDetailScreen";
import { NewOpdVisitScreen } from "../features/opd/screens/NewOpdVisitScreen";
import { PrintPreviewScreen, type PrintPreviewRouteParams } from "../features/clinical/screens/PrintPreviewScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

export type OpdStackParamList = {
  OpdVisitList: undefined;
  OpdVisitDetail: { visitId: number; initialTab?: string };
  NewOpdVisit: undefined;
  PrintPreview: PrintPreviewRouteParams;
};

const Stack = createNativeStackNavigator<OpdStackParamList>();

export function OpdStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="OpdVisitList" component={OpdVisitListScreen} options={{ title: "OPD" }} />
      <Stack.Screen name="OpdVisitDetail" component={OpdVisitDetailScreen} options={{ title: "Visit" }} />
      <Stack.Screen name="NewOpdVisit" component={NewOpdVisitScreen} options={{ title: "New Visit", presentation: "modal" }} />
      <Stack.Screen name="PrintPreview" component={PrintPreviewScreen} options={{ headerShown: false, presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}
