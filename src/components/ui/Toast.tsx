import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const kindStyles: Record<ToastKind, { container: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { container: "bg-emerald-600", icon: "checkmark-circle", color: "#ffffff" },
  error: { container: "bg-destructive", icon: "alert-circle", color: "#ffffff" },
  info: { container: "bg-primary", icon: "information-circle", color: "#ffffff" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ id: Date.now(), kind, message });
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 3500);
    },
    [opacity]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          className="absolute left-4 right-4"
          style={{ top: insets.top + 8, opacity }}
        >
          <Pressable
            onPress={() => setToast(null)}
            className={[
              "flex-row items-center gap-2 rounded-lg px-4 py-3 shadow-lg",
              kindStyles[toast.kind].container,
            ].join(" ")}
          >
            <Ionicons
              name={kindStyles[toast.kind].icon}
              size={18}
              color={kindStyles[toast.kind].color}
            />
            <Text className="flex-1 text-sm font-medium text-white">
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/** Inline form/screen error — use when the message belongs in the layout. */
export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View className="flex-row items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5">
      <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
      <Text className="flex-1 text-sm text-destructive">{message}</Text>
    </View>
  );
}
