import React from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { actionFeedback, tapFeedback } from "../../lib/haptics";
import { useTheme } from "../../theme/ThemeProvider";
import { darkColors, lightColors, type Palette } from "../../theme/colors";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Snap heights as a fraction of screen height. Defaults: [0.5]. */
  snapPoints?: number[];
}

const SPRING = { damping: 22, stiffness: 220, mass: 0.6 } as const;
const BACKDROP_FADE = 200;

/**
 * Bottom sheet with backdrop + drag-to-dismiss. Mounted via `Modal` (transparent)
 * so the underlying screen stays interactive until the sheet animates in.
 *
 * Rule from UI-CONSISTENCY-RULES #6: closes on backdrop tap, drag-down, and
 * the Android back button (handled by `Modal`'s onRequestClose).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoints = [0.5],
}: BottomSheetProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const maxSheetHeight = height * Math.max(...snapPoints);

  // Translate distance for the sheet (positive = off-screen down).
  const translateY = useSharedValue(maxSheetHeight);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      actionFeedback();
      translateY.value = withSpring(0, SPRING);
      backdropOpacity.value = withTiming(1, { duration: BACKDROP_FADE });
    } else {
      translateY.value = withSpring(maxSheetHeight, SPRING);
      backdropOpacity.value = withTiming(0, { duration: BACKDROP_FADE });
    }
  }, [visible, maxSheetHeight, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Drag-to-dismiss. Pan from inside the sheet pulls it down; releasing
  // past 30% of the way dismisses it.
  const pan = Gesture.Pan()
    .onChange((e) => {
      translateY.value = Math.max(0, translateY.value + e.changeY);
    })
    .onEnd(() => {
      if (translateY.value > maxSheetHeight * 0.3) {
        onClose();
      } else {
        translateY.value = withSpring(0, SPRING);
      }
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Animated.View
            pointerEvents={visible ? "auto" : "none"}
            className="absolute inset-0 bg-foreground/40"
            style={backdropStyle}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="flex-1"
              onPress={() => {
                tapFeedback();
                onClose();
              }}
            />
          </Animated.View>

          <Animated.View
            style={[
              sheetStyle,
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: insets.bottom + 16,
                width,
                maxHeight: maxSheetHeight,
                shadowColor: "#0f172a",
                shadowOpacity: isDark ? 0.4 : 0.18,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: -4 },
                elevation: 16,
              },
            ]}
          >
            <GestureDetector gesture={pan}>
              <View>
                <View className="items-center pt-2 pb-1">
                  <View className="h-1 w-10 rounded-full bg-border" />
                </View>
                <View className="flex-row items-center justify-between px-5 pb-2">
                  <Text
                    className="text-base font-semibold text-card-foreground"
                    numberOfLines={1}
                  >
                    {title ?? ""}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={10}
                    onPress={() => {
                      tapFeedback();
                      onClose();
                    }}
                    className="h-9 w-9 items-center justify-center rounded-full active:bg-muted"
                  >
                    <Ionicons name="close" size={20} color={colors["muted-foreground"]} />
                  </Pressable>
                </View>
                <View className="px-5">{children}</View>
              </View>
            </GestureDetector>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Re-export a tiny pre-styled handle row for use inside the sheet body.
export function SheetAction({
  icon,
  label,
  subtitle,
  destructive,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  destructive?: boolean;
  onPress: () => void;
  colors: Palette;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className="flex-row items-center gap-3 px-1 py-3 active:opacity-70"
    >
      <View
        className={[
          "h-9 w-9 items-center justify-center rounded-full",
          destructive ? "bg-rose-50" : "bg-secondary",
        ].join(" ")}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? "#9f1239" : colors.primary}
        />
      </View>
      <View className="flex-1">
        <Text
          className={[
            "text-[15px] font-medium",
            destructive ? "text-rose-600" : "text-card-foreground",
          ].join(" ")}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}