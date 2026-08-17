import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaymentsListScreen } from "../features/payments/screens/PaymentsListScreen";
import { PaymentsDetailScreen } from "../features/payments/screens/PaymentsDetailScreen";
import { PaymentFormScreen } from "../features/payments/screens/PaymentFormScreen";
import type { PaymentsStackParamList } from "../features/payments/screens/PaymentsListScreen";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator<PaymentsStackParamList>();

export function PaymentsStack() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: c.foreground, headerStyle: { backgroundColor: c.card }, headerShadowVisible: false }}>
      <Stack.Screen name="PaymentsList" component={PaymentsListScreen} options={{ title: "Payments" }} />
      <Stack.Screen name="PaymentsDetail" component={PaymentsDetailScreen} options={{ title: "Payment" }} />
      <Stack.Screen
        name="PaymentForm"
        component={PaymentFormScreen}
        options={({ route }) => ({
          title: route.params?.paymentId ? "Edit Payment" : "Record Payment",
          presentation: "modal",
        })}
      />
    </Stack.Navigator>
  );
}
