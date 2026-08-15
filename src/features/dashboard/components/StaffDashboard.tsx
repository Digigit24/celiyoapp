import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { EmptyState, ListItem } from "../../../components/ui";
import { useAuth } from "../../../store/AuthContext";
import type { AppDrawerParamList } from "../../../navigation/routes";
import { useQueue } from "../../opd/hooks";
import { useAppointmentsToday, useDashboardOverview, useDashboardInventory, useBillPaymentsStats } from "../hooks";
import { useDashboardPalette } from "../palette";
import { goToIpd, goToModule, goToOpd, goToOpdVisit } from "../navigate";
import { Gate, StatTile, WidgetCard } from "./widgets";
import { formatCurrency } from "../utils";

type Nav = DrawerNavigationProp<AppDrawerParamList>;
const TODAY = new Date().toISOString().slice(0, 10);

export function StaffDashboard() {
  const navigation = useNavigation<Nav>();
  const { can } = useAuth();
  const palette = useDashboardPalette();

  const canOpd = can("hms.opd.view");
  const canIpd = can("hms.ipd.view");
  const canPayments = can("hms.payments.view");
  const canAppointments = can("hms.appointments.view");
  const canInventory = can("hms.inventory.view");
  const hasAnyModule = canOpd || canIpd || canPayments || canAppointments || canInventory;

  const overview = useDashboardOverview({ date_from: TODAY, date_to: TODAY });
  const queue = useQueue();
  const appointments = useAppointmentsToday();
  const inventory = useDashboardInventory();
  const billPayments = useBillPaymentsStats();

  if (!hasAnyModule) {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title="No modules assigned yet"
        message="Ask your admin to grant access to a module to see data here."
      />
    );
  }

  const waiting = queue.data?.waiting ?? [];

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        <Gate show={canOpd}>
          <StatTile icon="medkit" tint={palette.primary} label="OPD visits" value={overview.data?.opd_statistics?.total_visits ?? 0} loading={overview.isLoading} onPress={() => goToOpd(navigation)} className="w-[47%]" />
        </Gate>
        <Gate show={canIpd}>
          <StatTile
            icon="bed"
            tint={palette.ipd}
            label="Bed occupancy"
            value={overview.data?.ipd_statistics?.occupancy_rate ?? 0}
            format={(n) => `${Math.round(n)}%`}
            loading={overview.isLoading}
            onPress={() => goToIpd(navigation)}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canPayments}>
          <StatTile icon="cash" tint={palette.success} label="Revenue" value={billPayments.data?.total_collected ?? 0} format={formatCurrency} loading={billPayments.isLoading} className="w-[47%]" />
        </Gate>
        <Gate show={canAppointments}>
          <StatTile icon="calendar" tint={palette.info} label="Appointments" value={appointments.data?.count ?? 0} loading={appointments.isLoading} className="w-[47%]" />
        </Gate>
        <Gate show={canInventory}>
          <StatTile icon="cube" tint={palette.warning} label="Stock alerts" value={inventory.data?.inventory_alerts?.unacknowledged ?? 0} loading={inventory.isLoading} onPress={() => goToModule(navigation, "inventory", "Inventory")} className="w-[47%]" />
        </Gate>
      </View>

      <Gate show={canOpd}>
        <WidgetCard
          title="OPD queue"
          loading={queue.isLoading}
          error={queue.isError}
          onRetry={() => queue.refetch()}
          empty={waiting.length === 0}
        >
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {waiting.slice(0, 6).map((v) => (
              <ListItem
                key={v.id}
                title={v.patient_name}
                subtitle={v.doctor_name ?? "Unassigned"}
                leftIcon="person-outline"
                onPress={() => goToOpdVisit(navigation, v.id)}
              />
            ))}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={canAppointments}>
        <WidgetCard title="Today's appointments" loading={appointments.isLoading} empty={(appointments.data?.data.length ?? 0) === 0}>
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {(appointments.data?.data ?? []).slice(0, 6).map((a) => (
              <ListItem key={a.id} title={a.patient_name} subtitle={a.doctor_name} leftIcon="calendar-outline" chevron={false} />
            ))}
          </View>
        </WidgetCard>
      </Gate>
    </View>
  );
}
