import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../store/AuthContext";
import { HeroHeader } from "../features/dashboard/components/widgets";
// Import the raw constant from its source (AnimatedTabBar), not from
// AppDrawer.tsx — AppDrawer imports this screen to register the drawer
// route, so importing back from AppDrawer created a require cycle that
// intermittently left Fast Refresh with a broken navigation context.
import { TAB_BAR_HEIGHT } from "../navigation/AnimatedTabBar";
import { useTabBarScrollHandler } from "../navigation/tabBarVisibility";
import {
  AdminDashboard,
  CashierDashboard,
  DashboardErrorBoundary,
  DoctorDashboard,
  LabTechnicianDashboard,
  NurseDashboard,
  PharmacistDashboard,
  ReceptionistDashboard,
  StaffDashboard,
} from "../features/dashboard/components";

/**
 * Home surface. Deliberately NOT a module launcher — navigation lives in the
 * bottom bar and drawer, so duplicating the module list here would give every
 * route two entry points. This screen answers "what needs me today", with a
 * role-specific set of live KPIs, charts and worklists.
 */
export function DashboardScreen() {
  const { session, primaryRole } = useAuth();
  const scrollProps = useTabBarScrollHandler();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const name = session?.email ? session.email.split("@")[0] : "there";
  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
    []
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["opd", "visits", "queue"] }),
        qc.invalidateQueries({ queryKey: ["ipd", "admissions"] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [qc]);

  return (
    <ScrollView
      // Faint page tint in light mode (surface) so white cards get natural
      // contrast without a border; dark mode falls back to the plain
      // background since surface/surface-elevated are the same tone there —
      // contrast comes from card bg being one step lighter (surface-elevated).
      className="flex-1 bg-surface dark:bg-background"
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      {...scrollProps}
    >
      <View className="gap-5 px-4 py-6">
        <HeroHeader name={name} tenantName={session?.tenantName} role={primaryRole} dateLabel={dateLabel} />

        {/* key=role resets the boundary's error state on a role switch instead of getting stuck on a stale crash. */}
        <DashboardErrorBoundary key={primaryRole ?? "none"}>
          <RoleDashboard role={primaryRole} />
        </DashboardErrorBoundary>
      </View>
    </ScrollView>
  );
}

function RoleDashboard({ role }: { role: ReturnType<typeof useAuth>["primaryRole"] }) {
  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "doctor":
      return <DoctorDashboard />;
    case "nurse":
      return <NurseDashboard />;
    case "receptionist":
      return <ReceptionistDashboard />;
    case "cashier":
      return <CashierDashboard />;
    case "pharmacist":
      return <PharmacistDashboard />;
    case "lab_technician":
      return <LabTechnicianDashboard />;
    case "staff":
    default:
      return <StaffDashboard />;
  }
}
