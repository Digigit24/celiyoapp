import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Badge, ListItem } from "../../../components/ui";
import { useAuth } from "../../../store/AuthContext";
import type { AppDrawerParamList } from "../../../navigation/routes";
import { useQueue } from "../../opd/hooks";
import { useAppointmentsToday, useDashboardOverview, useFollowUpVisits, usePatientStatistics } from "../hooks";
import { useDashboardPalette } from "../palette";
import { goToOpd, goToOpdVisit, goToPatients } from "../navigate";
import { Gate, StatTile, WidgetCard } from "./widgets";
import { tapFeedback } from "../../../lib/haptics";

type Nav = DrawerNavigationProp<AppDrawerParamList>;
const TODAY = new Date().toISOString().slice(0, 10);

export function ReceptionistDashboard() {
  const navigation = useNavigation<Nav>();
  const { can } = useAuth();
  const palette = useDashboardPalette();
  const canAppointments = can("hms.appointments.view");

  const overview = useDashboardOverview({ date_from: TODAY, date_to: TODAY });
  const queue = useQueue();
  const appointments = useAppointmentsToday();
  const patientStats = usePatientStatistics();
  const followUps = useFollowUpVisits();

  const waiting = queue.data?.waiting ?? [];

  return (
    <View className="gap-4">
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          tapFeedback();
          goToPatients(navigation);
        }}
        className="flex-row items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 active:opacity-70"
      >
        <Ionicons name="search" size={18} color="#64748b" />
        <Text className="flex-1 text-sm text-muted-foreground">Search patients…</Text>
      </Pressable>

      <View className="flex-row flex-wrap gap-3">
        <StatTile
          icon="medkit"
          tint={palette.primary}
          label="Visits today"
          value={overview.data?.opd_statistics?.total_visits ?? 0}
          loading={overview.isLoading}
          onPress={() => goToOpd(navigation)}
          className="w-[47%]"
        />
        <StatTile icon="hourglass" tint={palette.warning} label="Waiting now" value={waiting.length} loading={queue.isLoading} className="w-[47%]" />
        <Gate show={canAppointments}>
          <StatTile icon="calendar" tint={palette.info} label="Appointments" value={appointments.data?.count ?? 0} loading={appointments.isLoading} className="w-[47%]" />
        </Gate>
        <StatTile icon="person-add" tint={palette.success} label="New registrations" value={patientStats.data?.registrations_today ?? 0} loading={patientStats.isLoading} className="w-[47%]" />
      </View>

      <WidgetCard
        title="OPD queue"
        loading={queue.isLoading}
        error={queue.isError}
        onRetry={() => queue.refetch()}
        empty={waiting.length === 0}
        emptyMessage="No one waiting"
      >
        <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
          {waiting.slice(0, 8).map((v) => (
            <ListItem
              key={v.id}
              title={v.patient_name}
              subtitle={`${v.doctor_name ?? "Unassigned"} · ${v.visit_type.replace("_", " ")}`}
              leftIcon="person-outline"
              right={v.waiting_time ? <Badge label={`${v.waiting_time}m`} variant="secondary" /> : undefined}
              onPress={() => goToOpdVisit(navigation, v.id)}
            />
          ))}
        </View>
      </WidgetCard>

      <Gate show={canAppointments}>
        <WidgetCard
          title="Today's appointments"
          loading={appointments.isLoading}
          empty={(appointments.data?.data.length ?? 0) === 0}
        >
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {(appointments.data?.data ?? []).slice(0, 8).map((a) => (
              <ListItem
                key={a.id}
                title={a.patient_name}
                subtitle={`${a.doctor_name} · ${new Date(a.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                leftIcon="calendar-outline"
                right={<Badge label={a.status_label} variant={a.status === "checked_in" ? "success" : "secondary"} />}
              />
            ))}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={(followUps.data?.length ?? 0) > 0}>
        <WidgetCard title="Follow-ups due today">
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {(followUps.data ?? []).slice(0, 8).map((v) => (
              <ListItem
                key={v.id}
                title={v.patient_name}
                subtitle={v.patient_mobile}
                leftIcon="calendar-outline"
                onPress={() => goToOpdVisit(navigation, v.id)}
              />
            ))}
          </View>
        </WidgetCard>
      </Gate>
    </View>
  );
}
