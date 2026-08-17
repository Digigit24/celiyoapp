import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useDrawerProgress } from "react-native-drawer-layout";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { filterModules, MODULES, splitNavSurfaces } from "../constants/modules";
import { useAuth } from "../store/AuthContext";
import { tapFeedback } from "../lib/haptics";
import { darkColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ModulePlaceholderScreen } from "../screens/ModulePlaceholderScreen";
import { PatientsStack } from "./PatientsStack";
import { OpdStack } from "./OpdStack";
import { IpdStack } from "./IpdStack";
import { DaycareStack } from "./DaycareStack";
import { ClinicalRecordsStack } from "./ClinicalRecordsStack";
import { MrdStack } from "./MrdStack";
import { PaymentsStack } from "./PaymentsStack";
import { PharmacyStack } from "./PharmacyStack";
import { DiagnosticsStack } from "./DiagnosticsStack";
import { InventoryStack } from "./InventoryStack";
import { AdminStack } from "./AdminStack";
import { AssistantScreen } from "../features/assistant/screens/AssistantScreen";
import { ReputationScreen } from "../features/reputation/screens/ReputationScreen";
import { SettingsScreen } from "../features/settings/screens/SettingsScreen";
import { AnimatedTabBar, TAB_BAR_HEIGHT } from "./AnimatedTabBar";
import { DrawerContent } from "./DrawerContent";
import {
  TabBarVisibilityProvider,
  useTabBarVisibility,
} from "./tabBarVisibility";
import { isModuleActive, moduleTarget, type AppDrawerParamList } from "./routes";

export type { AppDrawerParamList } from "./routes";

const Drawer = createDrawerNavigator<AppDrawerParamList>();

/**
 * Wraps every drawer screen. Two jobs:
 *  1. push-back transform — the screen scales down, slides right and rounds off
 *     as the drawer opens, giving the layered depth of the reference design;
 *  2. hosts the bottom bar overlay so it sits above all screens without
 *     needing a separate tab navigator (which would duplicate the routes).
 */
function ScreenShell({ children }: { children: React.ReactNode }) {
  const progress = useDrawerProgress();
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();
  const { session, primaryRole } = useAuth();
  const { hidden } = useTabBarVisibility();

  const tabs = useMemo(() => {
    const visible = filterModules(
      MODULES,
      session?.permissions,
      session?.isSuperAdmin,
      primaryRole
    );
    return splitNavSurfaces(visible).tabs;
  }, [session?.permissions, session?.isSuperAdmin, primaryRole]);

  // Read the focused route from the drawer state so the bar tracks navigation
  // triggered anywhere — bar, drawer, or a deep link.
  const focused = useNavigationState((state) => {
    const route = state.routes[state.index];
    return {
      name: route?.name ?? "",
      params: route?.params as { moduleId?: string } | undefined,
    };
  });

  const activeIndex = tabs.findIndex((mod) =>
    isModuleActive(mod, focused.name, focused.params)
  );

  const shellStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 0.88]) },
      { translateX: interpolate(progress.value, [0, 1], [0, 12]) },
    ],
    borderRadius: interpolate(progress.value, [0, 1], [0, 24]),
  }));

  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.28]),
  }));

  return (
    <Animated.View
      className="flex-1 overflow-hidden bg-background"
      style={shellStyle}
    >
      {children}

      {/* Dim the pushed-back screen instead of relying on the drawer overlay. */}
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 bg-foreground"
        style={dimStyle}
      />

      <AnimatedTabBar
        tabs={tabs}
        activeIndex={activeIndex}
        hidden={hidden}
        onSelect={(mod) => {
          const target = moduleTarget(mod);
          (navigation.navigate as (route: string, params?: object) => void)(
            target.route,
            target.params
          );
        }}
      />
    </Animated.View>
  );
}

/** Reserve room so screen content never sits under the floating bar. */
export const TAB_BAR_CONTENT_INSET = TAB_BAR_HEIGHT;

export function AppDrawer() {
  const { isDark } = useTheme();
  const headerColors = isDark ? darkColors : lightColors;

  return (
    <TabBarVisibilityProvider>
      {/* Dark backdrop behind the pushed-back screen sells the depth. */}
      <View className="flex-1 bg-sidebar">
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
          screenLayout={({ children }) => <ScreenShell>{children}</ScreenShell>}
          screenOptions={({ route }) => ({
            headerTintColor: headerColors.foreground,
            headerStyle: { backgroundColor: headerColors.card },
            headerShadowVisible: false,
            // Hamburger lives in the header so the bottom bar stays a pure
            // 4-tab + FAB surface with no menu slot.
            headerLeft: () => <MenuButton />,
            // "back" keeps the screen mounted underneath so the push-back
            // transform is visible while the drawer slides in.
            drawerType: "back",
            overlayColor: "transparent",
            drawerStyle: { width: "78%", backgroundColor: "transparent" },
            swipeEdgeWidth: 60,
            title:
              route.name === "Module"
                ? ((route.params as { title?: string } | undefined)?.title ?? "")
                : "Dashboard",
          })}
        >
          <Drawer.Screen name="Dashboard" component={DashboardScreen} />
          <Drawer.Screen
            name="Module"
            component={ModulePlaceholderScreen}
            options={({ route }) => ({
              title: route.params?.title ?? "",
            })}
          />
          <Drawer.Screen
            name="Patients"
            component={PatientsStack}
            options={{ headerShown: false, title: "Patients" }}
          />
          <Drawer.Screen
            name="Opd"
            component={OpdStack}
            options={{ headerShown: false, title: "OPD" }}
          />
          <Drawer.Screen
            name="Ipd"
            component={IpdStack}
            options={{ headerShown: false, title: "IPD" }}
          />
          <Drawer.Screen
            name="Daycare"
            component={DaycareStack}
            options={{ headerShown: false, title: "Daycare" }}
          />
          <Drawer.Screen
            name="ClinicalRecords"
            component={ClinicalRecordsStack}
            options={{ headerShown: false, title: "Clinical Records" }}
          />
          <Drawer.Screen
            name="Mrd"
            component={MrdStack}
            options={{ headerShown: false, title: "MRD" }}
          />
          <Drawer.Screen
            name="Payments"
            component={PaymentsStack}
            options={{ headerShown: false, title: "Payments" }}
          />
          <Drawer.Screen
            name="Pharmacy"
            component={PharmacyStack}
            options={{ headerShown: false, title: "Pharmacy" }}
          />
          <Drawer.Screen
            name="Diagnostics"
            component={DiagnosticsStack}
            options={{ headerShown: false, title: "Lab" }}
          />
          <Drawer.Screen
            name="Inventory"
            component={InventoryStack}
            options={{ headerShown: false, title: "Inventory" }}
          />
          <Drawer.Screen
            name="Admin"
            component={AdminStack}
            options={{ headerShown: false, title: "Admin" }}
          />
          <Drawer.Screen
            name="Assistant"
            component={AssistantScreen}
            options={{ headerShown: false, title: "Assistant" }}
          />
          <Drawer.Screen
            name="Reputation"
            component={ReputationScreen}
            options={{ title: "Reputation" }}
          />
          <Drawer.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: "Settings" }}
          />
        </Drawer.Navigator>
      </View>
    </TabBarVisibilityProvider>
  );
}

/**
 * Header-mounted hamburger. Lives here (not in DrawerContent) so it appears
 * inside the React Navigation header and inherits the platform-native
 * back-stack inset — stacks that disable their own header still see this
 * because it's the drawer's header, not a child screen's.
 */
function MenuButton() {
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();
  const { isDark } = useTheme();
  const tint = isDark ? darkColors.foreground : lightColors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      onPress={() => {
        tapFeedback();
        navigation.openDrawer();
      }}
      hitSlop={10}
      className="ml-2 h-9 w-9 items-center justify-center rounded-full active:bg-muted"
    >
      <Ionicons name="menu-outline" size={22} color={tint} />
    </Pressable>
  );
}
