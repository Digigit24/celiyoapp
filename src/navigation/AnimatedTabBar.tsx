import React, { useMemo, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ModuleDef } from "../constants/modules";
import { tapFeedback } from "../lib/haptics";
import { darkColors, lightColors, type Palette } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";
import { QuickActionFab } from "./QuickActionFab";

/** Spring used for anything that should feel physical rather than timed. */
const SPRING = { damping: 18, stiffness: 190, mass: 0.55 } as const;

export const TAB_BAR_HEIGHT = 62;
const FAB_SLOT_WIDTH = 76;
const PILL_HEIGHT = 40;

interface AnimatedTabBarProps {
  tabs: ModuleDef[];
  /** Index into `tabs` of the focused module, or -1 when a drawer-only route is open. */
  activeIndex: number;
  onSelect: (mod: ModuleDef) => void;
  /** 0 = bar fully visible, 1 = fully hidden (driven by list scroll). */
  hidden: boolean;
}

/**
 * Custom bottom bar rendered as an overlay above the drawer's screens. It
 * doesn't own any routes — it navigates the same drawer routes the drawer does,
 * which is what keeps the two surfaces from duplicating each other.
 *
 * Layout: `floor(tabs/2)` on the left, centre FAB slot, `ceil(tabs/2)` on the
 * right. Every slot is the same width so the four tabs sit evenly distributed
 * around the FAB regardless of how many tabs a given role sees.
 *
 * Motion: one shared pill springs horizontally to the active slot (rather than
 * each tab fading independently), the active icon scale-bounces, and its label
 * rises into place. The whole bar translates off-screen on scroll-down.
 */
export function AnimatedTabBar({
  tabs,
  activeIndex,
  onSelect,
  hidden,
}: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  // The FAB reserves a fixed-width slot in the middle; the four tabs share
  // the remaining space with flex:1, so they always fill the bar edge-to-edge
  // no matter how many tabs a role sees.
  const slotWidth = (width - FAB_SLOT_WIDTH) / Math.max(tabs.length, 1);
  const leftCount = Math.floor(tabs.length / 2);
  const barHeight = TAB_BAR_HEIGHT + insets.bottom;

  /**
   * Resolve the pill's x-offset in JS, not inside the worklet — a captured
   * closure gets serialized to the UI runtime as a plain object, so calling it
   * there throws "<fn> is not a function". Worklets may only close over plain
   * values and shared values.
   *
   * Tabs on the left half occupy slots 0..leftCount-1 starting at x=0. Tabs
   * on the right half occupy slots leftCount..N-1 starting at x=FAB_SLOT_WIDTH
   * (because the FAB sits between them).
   */
  const pillX = useMemo(() => {
    if (activeIndex < 0) return 0;
    const baseX = activeIndex < leftCount ? 0 : FAB_SLOT_WIDTH;
    return baseX + activeIndex * slotWidth;
  }, [activeIndex, leftCount, slotWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeIndex >= 0 ? 1 : 0, { duration: 160 }),
    transform: [{ translateX: withSpring(pillX, SPRING) }],
  }), [activeIndex, pillX]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(hidden ? barHeight + 28 : 0, SPRING) }],
  }), [hidden, barHeight]);

  return (
    <Animated.View
      pointerEvents="box-none"
      className="absolute left-0 right-0 bottom-0"
      style={barStyle}
    >
      <View
        className="flex-row items-start border-t border-border bg-card"
        style={{
          height: barHeight,
          paddingBottom: insets.bottom,
          // Soft lift so the bar reads as floating above content.
          shadowColor: "#0f172a",
          shadowOpacity: isDark ? 0.5 : 0.09,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        }}
      >
        {/* The travelling pill — a single element for all tabs. */}
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-2xl bg-primary/10"
          style={[
            {
              top: (TAB_BAR_HEIGHT - PILL_HEIGHT) / 2,
              height: PILL_HEIGHT,
              width: slotWidth - 12,
              left: 6,
            },
            pillStyle,
          ]}
        />

        {tabs.slice(0, leftCount).map((mod, i) => (
          <TabSlot
            key={mod.id}
            mod={mod}
            active={activeIndex === i}
            colors={colors}
            onPress={() => onSelect(mod)}
          />
        ))}

        <View style={{ width: FAB_SLOT_WIDTH }} />

        {tabs.slice(leftCount).map((mod, i) => (
          <TabSlot
            key={mod.id}
            mod={mod}
            active={activeIndex === leftCount + i}
            colors={colors}
            onPress={() => onSelect(mod)}
          />
        ))}
      </View>

      <QuickActionFab bottomOffset={barHeight} />
    </Animated.View>
  );
}

interface TabSlotProps {
  mod: ModuleDef;
  active: boolean;
  colors: Palette;
  onPress: () => void;
}

function TabSlot({ mod, active, colors, onPress }: TabSlotProps) {
  const [pressed, setPressed] = useState(false);

  const progress = useDerivedValue(
    () => withSpring(active ? 1 : 0, SPRING),
    [active]
  );

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: (1 + progress.value * 0.15) * (pressed ? 0.92 : 1) },
      { translateY: -progress.value * 2 },
    ],
  }), [pressed]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 6 }],
  }));

  const iconColor = useAnimatedStyle(() => ({
    // Colour interpolation on the UI thread — no JS-driven re-render per frame.
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors["muted-foreground"], colors.primary]
    ),
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={mod.label}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className="items-center justify-center"
      style={{ flex: 1, height: TAB_BAR_HEIGHT }}
    >
      <Animated.View style={iconStyle}>
        <AnimatedIcon
          name={(active ? mod.activeIcon ?? mod.icon : mod.icon) as never}
          size={22}
          style={iconColor}
        />
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        className="mt-0.5 text-[10px] font-semibold text-primary"
        style={labelStyle}
      >
        {mod.label}
      </Animated.Text>
    </Pressable>
  );
}

/** Ionicons doesn't accept animated colour props directly — wrap it. */
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);
