import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../../components/ui";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Class component required — React has no hook equivalent for
 * getDerivedStateFromError/componentDidCatch yet.
 *
 * Wraps the role dashboard so a render-time throw in any one widget shows a
 * recoverable fallback instead of taking down the whole screen (and, since
 * Expo Go's on-device redbox often only shows/copies the top error line,
 * componentDidCatch logs the full error + component stack to the terminal
 * so the actual offending component is identifiable from the Metro logs).
 */
export class DashboardErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      "[Dashboard] render error:",
      error,
      "\n[Dashboard] component stack:",
      info.componentStack
    );
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View className="items-center gap-3 rounded-3xl border border-border/50 bg-card p-6">
          <Ionicons name="warning-outline" size={26} color="#ef4444" />
          <Text className="text-center text-sm font-semibold text-card-foreground">
            This section hit a snag
          </Text>
          <Text className="text-center text-xs text-muted-foreground" numberOfLines={4}>
            {this.state.error.message || "Unknown error"}
          </Text>
          <Button title="Try again" size="sm" variant="secondary" fullWidth={false} onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}
