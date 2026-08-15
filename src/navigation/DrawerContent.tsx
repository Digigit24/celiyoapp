import React, { useMemo, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../components/ui";
import {
  filterModules,
  groupModules,
  MODULES,
  splitNavSurfaces,
  type ModuleDef,
} from "../constants/modules";
import { tapFeedback } from "../lib/haptics";
import { useAuth } from "../store/AuthContext";
import { darkColors, lightColors, type Palette } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";
import type { ThemeMode } from "../theme/types";
import { isModuleActive, moduleTarget } from "./routes";

const SPRING = { damping: 18, stiffness: 190, mass: 0.55 } as const;
/** Per-row entrance delay, so the list cascades instead of popping in. */
const ROW_STAGGER_MS = 32;

/**
 * Drawer body: identity card on top, permission-filtered modules grouped by
 * domain, utilities pinned to the footer. Modules already promoted to the tab
 * bar are excluded here — `splitNavSurfaces` owns that split.
 */
export function DrawerContent(props: DrawerContentComponentProps) {
  const { session, primaryRole, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const sections = useMemo(() => {
    const visible = filterModules(
      MODULES,
      session?.permissions,
      session?.isSuperAdmin,
      primaryRole
    );
    return groupModules(splitNavSurfaces(visible).drawer);
  }, [session?.permissions, session?.isSuperAdmin, primaryRole]);

  const focused = props.state.routes[props.state.index];
  const focusedParams = focused?.params as { moduleId?: string } | undefined;

  const email = session?.email ?? "";
  const initial = (email[0] ?? "?").toUpperCase();
  const displayName = email ? email.split("@")[0] : "Signed in";

  let rowIndex = 0;

  return (
    <View className="flex-1 bg-sidebar">
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card — floating, tappable, mirrors the reference header. */}
        <View className="px-3" style={{ paddingTop: insets.top + 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account"
            onPress={() => {
              tapFeedback();
              toast.show("Account settings — coming soon", "info");
            }}
            className="flex-row items-center gap-3 rounded-2xl bg-card px-3 py-3 active:opacity-80"
            style={{
              shadowColor: "#0f172a",
              shadowOpacity: isDark ? 0.4 : 0.07,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
              <Text className="text-base font-bold text-primary-foreground">
                {initial}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-[15px] font-semibold capitalize text-card-foreground"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {session?.tenantName ?? email}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors["muted-foreground"]}
            />
          </Pressable>

          {primaryRole ? (
            <View className="mt-2 flex-row">
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-[11px] font-semibold capitalize text-primary">
                  {primaryRole.replace(/_/g, " ")}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="mt-4">
          {sections.map((section) => (
            <View key={section.group} className="mb-1">
              <Text className="px-5 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </Text>
              {section.modules.map((mod) => (
                <DrawerRow
                  key={mod.id}
                  mod={mod}
                  index={rowIndex++}
                  active={isModuleActive(mod, focused?.name ?? "", focusedParams)}
                  colors={colors}
                  onPress={() => {
                    tapFeedback();
                    const target = moduleTarget(mod);
                    // navigate() is typed per-route; the union needs the cast.
                    (props.navigation.navigate as (
                      route: string,
                      params?: object
                    ) => void)(target.route, target.params);
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </DrawerContentScrollView>

      <View
        className="border-t border-sidebar-border px-3 pt-3"
        style={{ paddingBottom: insets.bottom + 10 }}
      >
        <View className="mb-2 flex-row items-center justify-between px-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Appearance
          </Text>
        </View>
        <AppearancePicker />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tapFeedback();
            void signOut();
          }}
          className="mt-2 flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:bg-destructive/10"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text className="text-[15px] font-medium text-destructive">
            Sign out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface DrawerRowProps {
  mod: ModuleDef;
  index: number;
  active: boolean;
  colors: Palette;
  onPress: () => void;
}

function DrawerRow({ mod, index, active, colors, onPress }: DrawerRowProps) {
  const [pressed, setPressed] = useState(false);

  const progress = useDerivedValue(
    () => withSpring(active ? 1 : 0, SPRING),
    [active]
  );

  /** Active rows morph into a filled pill; inactive stay flat. */
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.96 + progress.value * 0.04 }],
  }));

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed ? 0.975 : 1, SPRING) }],
  }), [pressed]);

  const labelStyle = useAnimatedStyle(() => ({
    color: withTiming(
      active ? colors["primary-foreground"] : colors["sidebar-foreground"],
      { duration: 160 }
    ),
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * ROW_STAGGER_MS).duration(220)}
      style={rowStyle}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        className="mx-2 my-0.5 flex-row items-center gap-3 rounded-2xl px-3 py-3"
      >
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 rounded-2xl bg-primary"
          style={pillStyle}
        />
        <Ionicons
          name={(active ? mod.activeIcon ?? mod.icon : mod.icon) as never}
          size={20}
          color={active ? colors["primary-foreground"] : colors["muted-foreground"]}
        />
        <Animated.Text
          className="flex-1 text-[15px] font-medium"
          style={labelStyle}
          numberOfLines={1}
        >
          {mod.label}
        </Animated.Text>
        {mod.phase ? (
          <View
            className={[
              "rounded-full px-2 py-0.5",
              active ? "bg-white/20" : "bg-muted",
            ].join(" ")}
          >
            <Text
              className={[
                "text-[10px] font-semibold",
                active ? "text-primary-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              Soon
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Three-way appearance picker (light / dark / system). A single sliding pill
 * marks the active segment with a spring, so the change reads as physical
 * rather than a discrete state flip. `system` follows the OS via the theme
 * provider, so a phone that flips between day and night also flips the app.
 */
const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: "light", label: "Light", icon: "sunny-outline" },
  { mode: "system", label: "Auto", icon: "phone-portrait-outline" },
  { mode: "dark", label: "Dark", icon: "moon-outline" },
];

const APPEARANCE_PADDING = 4;
const APPEARANCE_GAP = 8; // 2 * APPEARANCE_PADDING

function AppearancePicker() {
  const { mode, setMode, isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  // Drawer is 78% of screen, then minus the outer mx-3 (12 each side) and
  // inner p-1 (4 each side). Approximating — pixel-perfect isn't critical
  // here because the spring smooths any small rounding error.
  const drawerInset = width * 0.78;
  const trackWidth = drawerInset - 12 * 2 - APPEARANCE_GAP;
  const segmentWidth = trackWidth / APPEARANCE_OPTIONS.length;

  const activeIndex = APPEARANCE_OPTIONS.findIndex((opt) => opt.mode === mode);
  const safeIndex = activeIndex < 0 ? 1 : activeIndex;

  return (
    <View
      accessibilityRole="radiogroup"
      className="mx-3 flex-row rounded-full bg-secondary p-1"
    >
      <Animated.View
        pointerEvents="none"
        className="absolute rounded-full bg-card"
        style={[
          {
            top: APPEARANCE_PADDING,
            bottom: APPEARANCE_PADDING,
            left: APPEARANCE_PADDING,
            width: segmentWidth,
            shadowColor: "#0f172a",
            shadowOpacity: isDark ? 0 : 0.08,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: isDark ? 0 : 1,
          },
          useActiveSegmentStyle(safeIndex, segmentWidth),
        ]}
      />
      {APPEARANCE_OPTIONS.map((opt, i) => {
        const selected = i === safeIndex;
        return (
          <Pressable
            key={opt.mode}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            onPress={() => {
              tapFeedback();
              setMode(opt.mode);
            }}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2"
            style={{ opacity: selected ? 1 : 0.7 }}
          >
            <Ionicons
              name={opt.icon as never}
              size={14}
              color={selected ? colors.foreground : colors["muted-foreground"]}
            />
            <Text
              className={[
                "text-[13px]",
                selected
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground",
              ].join(" ")}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Sliding highlight under the segments. Spring-translates to the active
 * segment's left edge in pixels (reanimated v4 doesn't accept "%" for
 * translateX, so we resolve the width up front in JS).
 */
function useActiveSegmentStyle(index: number, segmentWidth: number) {
  return useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(index * segmentWidth, SPRING) }],
  }), [index, segmentWidth]);
}
