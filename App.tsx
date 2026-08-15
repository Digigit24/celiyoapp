import "./global.css";
import "react-native-gesture-handler";

import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/store/AuthContext";
import { ToastProvider } from "./src/components/ui";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { ThemeModeSync } from "./src/theme/ThemeModeSync";
import { buildNavTheme } from "./src/theme/navTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

/**
 * Inner shell — must live inside <ThemeProvider> so it can read the resolved
 * scheme to build the React Navigation Theme object.
 */
function ThemedShell() {
  const { isDark } = useTheme();
  return (
    <>
      <ThemeModeSync />
      <NavigationContainer theme={buildNavTheme(isDark)}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <ThemedShell />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
