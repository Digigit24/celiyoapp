import React from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Badge, ListItem, useToast } from "../../../components/ui";
import { useAuth } from "../../../store/AuthContext";
import type { AppDrawerParamList } from "../../../navigation/routes";
import { callNext, getQueue } from "../../../lib/api/opd";
import { useAdmissions } from "../../ipd/hooks";
import { useFollowUpVisits, useIpdDoctorStats, useOpdDoctorStats } from "../hooks";
import { useDashboardPalette } from "../palette";
import { goToIpdAdmission, goToOpdVisit } from "../navigate";
import { Gate, StatTile, WidgetCard } from "./widgets";

type Nav = DrawerNavigationProp<AppDrawerParamList>;

const TODAY = new Date().toISOString().slice(0, 10);

export function DoctorDashboard() {
  const navigation = useNavigation<Nav>();
  const { can } = useAuth();
  const palette = useDashboardPalette();
  const toast = useToast();
  const qc = useQueryClient();

  const canOpd = can("hms.opd.view");
  const canIpd = can("hms.ipd.view");

  const myOpdStats = useOpdDoctorStats(canOpd ? { doctor: "me", date_from: TODAY, date_to: TODAY } : undefined);
  const myIpdStats = useIpdDoctorStats(canIpd ? { doctor: "me" } : undefined);
  const myQueue = useQuery({
    queryKey: ["dashboard", "opd-queue", "me"],
    queryFn: () => getQueue("me"),
    enabled: canOpd,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const myAdmissions = useAdmissions(canIpd ? { status: "admitted", page_size: 50 } : undefined);
  const followUps = useFollowUpVisits();

  const callNextMutation = useMutation({
    mutationFn: () => callNext(),
    onSuccess: () => {
      toast.show("Next patient called", "success");
      qc.invalidateQueries({ queryKey: ["dashboard", "opd-queue"] });
    },
    onError: () => toast.show("Couldn't call the next patient", "error"),
  });

  const me = myOpdStats.data?.[0];
  const myIpd = myIpdStats.data?.[0];
  const waitingQueue = (myQueue.data?.waiting ?? []).concat(myQueue.data?.called ?? []);
  const inConsultation = myQueue.data?.in_consultation ?? [];

  return (
    <View className="gap-4">
      <Gate show={canOpd}>
        <View className="flex-row flex-wrap gap-3">
          <StatTile icon="medkit" tint={palette.primary} label="My visits today" value={me?.visits_today ?? 0} loading={myOpdStats.isLoading} className="w-[47%]" />
          <StatTile icon="checkmark-done" tint={palette.success} label="Completed" value={me?.completed ?? 0} loading={myOpdStats.isLoading} className="w-[47%]" />
          <StatTile
            icon="time"
            tint={palette.info}
            label="Avg consult time"
            value={me?.avg_consultation_mins ?? 0}
            format={(n) => `${Math.round(n)}m`}
            loading={myOpdStats.isLoading}
            className="w-[47%]"
          />
          <Gate show={canIpd}>
            <StatTile icon="bed" tint={palette.ipd} label="My IPD patients" value={myIpd?.active ?? 0} loading={myIpdStats.isLoading} className="w-[47%]" />
          </Gate>
        </View>
      </Gate>

      <Gate show={canOpd}>
        <WidgetCard
          title="My queue"
          actionLabel="Call next"
          onAction={() => callNextMutation.mutate()}
          loading={myQueue.isLoading}
          error={myQueue.isError}
          onRetry={() => myQueue.refetch()}
          empty={waitingQueue.length === 0}
          emptyMessage="No one waiting"
        >
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {waitingQueue.slice(0, 6).map((v) => (
              <ListItem
                key={v.id}
                title={v.patient_name}
                subtitle={`${v.visit_type.replace("_", " ")}${v.waiting_time ? ` · waiting ${v.waiting_time}m` : ""}`}
                leftIcon="person-outline"
                right={<Badge label={v.status === "called" ? "Called" : "Waiting"} variant={v.status === "called" ? "warning" : "secondary"} />}
                onPress={() => goToOpdVisit(navigation, v.id)}
              />
            ))}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={canOpd && inConsultation.length > 0}>
        <WidgetCard title="Now consulting">
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {inConsultation.map((v) => (
              <ListItem
                key={v.id}
                title={v.patient_name}
                subtitle={v.visit_type.replace("_", " ")}
                leftIcon="pulse-outline"
                right={<Badge label="In consultation" variant="success" />}
                onPress={() => goToOpdVisit(navigation, v.id)}
              />
            ))}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={canIpd}>
        <WidgetCard
          title="My IPD patients"
          loading={myAdmissions.isLoading}
          error={myAdmissions.isError}
          onRetry={() => myAdmissions.refetch()}
          empty={(myAdmissions.data?.results.length ?? 0) === 0}
        >
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {(myAdmissions.data?.results ?? []).slice(0, 6).map((a) => (
              <ListItem
                key={a.id}
                title={a.patient_name}
                subtitle={`${a.ward_name}${a.bed_number ? ` · Bed ${a.bed_number}` : ""}`}
                leftIcon="bed-outline"
                right={<Badge label={`${a.los_days}d`} variant="secondary" />}
                onPress={() => goToIpdAdmission(navigation, a.id)}
              />
            ))}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={canOpd && (followUps.data?.length ?? 0) > 0}>
        <WidgetCard
          title="Follow-ups due"
          subtitle="Across OPD"
          loading={followUps.isLoading}
          empty={(followUps.data?.length ?? 0) === 0}
          emptyMessage="No follow-ups pending"
        >
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {(followUps.data ?? []).slice(0, 6).map((v) => {
              const due = v.follow_up_date ? new Date(v.follow_up_date) <= new Date() : false;
              return (
                <ListItem
                  key={v.id}
                  title={v.patient_name}
                  subtitle={v.follow_up_date ? `Due ${new Date(v.follow_up_date).toLocaleDateString()}` : undefined}
                  leftIcon="calendar-outline"
                  right={due ? <Badge label="Due" variant="warning" /> : undefined}
                  onPress={() => goToOpdVisit(navigation, v.id)}
                />
              );
            })}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={!canOpd && !canIpd}>
        <Text className="px-1 text-sm text-muted-foreground">
          You don't have access to OPD or IPD yet — check with your admin.
        </Text>
      </Gate>
    </View>
  );
}
