import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../store/AuthContext";
import { AppDrawer } from "./AppDrawer";
import { LoginScreen } from "../screens/LoginScreen";

/**
 * Root switch: restoring session → splash; signed out → login; in → drawer.
 * Kept as a conditional render (not separate navigators) so auth state alone
 * drives the tree.
 */
export function RootNavigator() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return status === "signedIn" ? <AppDrawer /> : <LoginScreen />;
}
