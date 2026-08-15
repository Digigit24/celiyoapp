import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Badge, ListItem, TabStrip } from "../../../components/ui";
import { useAuth } from "../../../store/AuthContext";
import type { AppDrawerParamList } from "../../../navigation/routes";
import { useQueue } from "../../opd/hooks";
import {
  useActiveAdmissions,
  useBillPaymentsStats,
  useDashboardClinical,
  useDashboardFinancial,
  useDashboardInventory,
  useDashboardOverview,
  useDoctorStatistics,
  usePatientStatistics,
  useRecentBillPayments,
} from "../hooks";
import { buildRange, computeDelta, formatCurrency, priorRange, type RangeKey } from "../utils";
import { useDashboardPalette } from "../palette";
import { goToIpd, goToIpdAdmission, goToModule, goToOpd, goToOpdVisit } from "../navigate";
import { Gate, MiniBarChart, ProgressMeter, RangePicker, SegmentedBar, StatTile, WidgetCard } from "./widgets";

type Nav = DrawerNavigationProp<AppDrawerParamList>;

export function AdminDashboard() {
  const navigation = useNavigation<Nav>();
  const { can } = useAuth();
  const palette = useDashboardPalette();
  const [rangeKey, setRangeKey] = useState<RangeKey>("today");
  const [liveTab, setLiveTab] = useState<"queue" | "ipd" | "payments">("queue");

  const range = useMemo(() => buildRange(rangeKey), [rangeKey]);
  const prior = useMemo(() => priorRange(range), [range]);

  const canOpd = can("hms.opd.view");
  const canIpd = can("hms.ipd.view");
  const canPayments = can("hms.payments.view");
  const canInventory = can("hms.inventory.view");
  const canPharmacy = can("hms.pharmacy.view");
  const canDoctors = can("hms.doctors.view");
  const canPatients = can("hms.patients.view");

  const overview = useDashboardOverview({ date_from: range.date_from, date_to: range.date_to });
  const overviewPrior = useDashboardOverview({ date_from: prior.date_from, date_to: prior.date_to });
  const financial = useDashboardFinancial({ date_from: range.date_from, date_to: range.date_to });
  const clinical = useDashboardClinical({ date_from: range.date_from, date_to: range.date_to });
  const inventory = useDashboardInventory();
  const billPayments = useBillPaymentsStats({ date_from: range.date_from, date_to: range.date_to });
  const patientStats = usePatientStatistics();
  const doctorStats = useDoctorStatistics();

  const queue = useQueue();
  const activeAdmissions = useActiveAdmissions();
  const recentPayments = useRecentBillPayments({ date_from: range.date_from, date_to: range.date_to });

  const opd = overview.data?.opd_statistics;
  const ipd = overview.data?.ipd_statistics;
  const opdPrior = overviewPrior.data?.opd_statistics;
  const opdVisitsDelta = opdPrior ? computeDelta(opd?.total_visits ?? 0, opdPrior.total_visits) : null;

  const revenueTrend = billPayments.data?.daily_trend ?? [];
  const revenueDelta =
    revenueTrend.length >= 2
      ? computeDelta(revenueTrend[revenueTrend.length - 1].total, revenueTrend[revenueTrend.length - 2].total)
      : null;

  const pendingDues =
    (parseFloat(financial.data?.opd_bill_stats?.pending_amount ?? "0") || 0) +
    (financial.data?.ipd_billing_stats?.pending_amount ?? 0);

  const stockAlerts = inventory.data?.inventory_alerts?.unacknowledged ?? 0;

  const queueRows = [
    ...(queue.data?.waiting ?? []),
    ...(queue.data?.called ?? []),
    ...(queue.data?.in_consultation ?? []),
  ].slice(0, 6);

  const doctorLeaderboard = useMemo(() => {
    const opdRows = clinical.data?.opd_doctor_stats ?? [];
    const ipdRows = clinical.data?.ipd_doctor_stats ?? [];
    const byName = new Map<string, { name: string; visits: number; admissions: number; avgMins: number | null }>();
    for (const row of opdRows) {
      byName.set(row.doctor_name, {
        name: row.doctor_name,
        visits: row.visits_count,
        admissions: 0,
        avgMins: row.avg_consultation_mins,
      });
    }
    for (const row of ipdRows) {
      const existing = byName.get(row.doctor_name);
      if (existing) existing.admissions = row.admissions_count;
      else byName.set(row.doctor_name, { name: row.doctor_name, visits: 0, admissions: row.admissions_count, avgMins: null });
    }
    return Array.from(byName.values())
      .sort((a, b) => b.visits + b.admissions - (a.visits + a.admissions))
      .slice(0, 5);
  }, [clinical.data]);

  const liveTabs: Array<{ key: typeof liveTab; label: string }> = [
    ...(canOpd ? [{ key: "queue" as const, label: `Queue (${queueRows.length})` }] : []),
    ...(canIpd ? [{ key: "ipd" as const, label: `Active IPD (${activeAdmissions.data?.length ?? 0})` }] : []),
    ...(canPayments ? [{ key: "payments" as const, label: `Payments (${recentPayments.data?.length ?? 0})` }] : []),
  ];

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-foreground">Hospital overview</Text>
        <RangePicker value={rangeKey} onChange={setRangeKey} />
      </View>

      {/* KPI grid */}
      <View className="flex-row flex-wrap gap-3">
        <Gate show={canOpd}>
          <StatTile
            icon="medkit"
            tint={palette.primary}
            label="OPD visits"
            value={opd?.total_visits ?? 0}
            delta={opdVisitsDelta}
            loading={overview.isLoading}
            onPress={() => goToOpd(navigation)}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canPayments}>
          <StatTile
            icon="cash"
            tint={palette.success}
            label="Revenue collected"
            value={billPayments.data?.collected_today ?? 0}
            format={formatCurrency}
            delta={revenueDelta}
            loading={billPayments.isLoading}
            onPress={() => goToModule(navigation, "payments", "Payments")}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canIpd}>
          <StatTile
            icon="bed"
            tint={palette.ipd}
            label="Bed occupancy"
            value={ipd?.occupancy_rate ?? 0}
            format={(n) => `${Math.round(n)}%`}
            loading={overview.isLoading}
            onPress={() => goToIpd(navigation)}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canIpd}>
          <StatTile
            icon="pulse"
            tint={palette.info}
            label="Active admissions"
            value={ipd?.currently_admitted ?? 0}
            loading={overview.isLoading}
            onPress={() => goToIpd(navigation)}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canPayments}>
          <StatTile
            icon="alert-circle"
            tint={palette.warning}
            label="Pending dues"
            value={pendingDues}
            format={formatCurrency}
            loading={financial.isLoading}
            onPress={() => goToModule(navigation, "payments", "Payments")}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canInventory}>
          <StatTile
            icon="cube"
            tint={palette.danger}
            label="Stock alerts"
            value={stockAlerts}
            loading={inventory.isLoading}
            onPress={() => goToModule(navigation, "inventory", "Inventory")}
            className="w-[47%]"
          />
        </Gate>
      </View>

      <Gate show={canPayments}>
        <WidgetCard
          title="Revenue trend"
          subtitle={range.label}
          loading={billPayments.isLoading}
          error={billPayments.isError}
          onRetry={() => billPayments.refetch()}
          empty={revenueTrend.length === 0}
        >
          <MiniBarChart
            points={revenueTrend.map((p) => ({ label: p.date.slice(5), value: p.total }))}
            color={palette.success}
            format={formatCurrency}
          />
        </WidgetCard>
      </Gate>

      <Gate show={canPayments}>
        <WidgetCard
          title="Collections by mode"
          loading={billPayments.isLoading}
          error={billPayments.isError}
          onRetry={() => billPayments.refetch()}
          empty={(billPayments.data?.by_mode?.length ?? 0) === 0}
        >
          <SegmentedBar
            segments={(billPayments.data?.by_mode ?? []).map((m) => ({ label: m.payment_mode, value: m.total }))}
            format={formatCurrency}
            summary={formatCurrency(billPayments.data?.total_collected)}
            summaryLabel={`Total collected · ${range.label}`}
          />
        </WidgetCard>
      </Gate>

      <Gate show={canOpd}>
        <WidgetCard
          title="OPD patient flow"
          loading={overview.isLoading}
          error={overview.isError}
          onRetry={() => overview.refetch()}
          empty={!opd || opd.total_visits === 0}
        >
          <SegmentedBar
            segments={[
              { label: "Waiting", value: opd?.by_status.waiting ?? 0, color: palette.warning },
              { label: "In consultation", value: opd?.by_status.in_consultation ?? 0, color: palette.info },
              { label: "Completed", value: opd?.by_status.completed ?? 0, color: palette.success },
              { label: "Cancelled", value: opd?.by_status.cancelled ?? 0, color: palette.danger },
            ]}
          />
        </WidgetCard>
      </Gate>

      <Gate show={canIpd}>
        <WidgetCard title="Bed occupancy" loading={overview.isLoading} error={overview.isError} onRetry={() => overview.refetch()}>
          <ProgressMeter
            label="Occupied beds"
            value={`${ipd?.occupied_beds ?? 0}/${ipd?.total_beds ?? 0}`}
            percent={ipd?.occupancy_rate ?? 0}
            footnote={
              ipd?.avg_length_of_stay_days != null
                ? `${ipd.total_beds} total beds · avg stay ${ipd.avg_length_of_stay_days.toFixed(1)}d`
                : `${ipd?.total_beds ?? 0} total beds`
            }
          />
        </WidgetCard>
      </Gate>

      <Gate show={canIpd && (ipd?.mediclaim ?? 0) > 0}>
        <WidgetCard title="Insurance claims pipeline" subtitle={`${ipd?.mediclaim ?? 0} mediclaim admissions`} loading={overview.isLoading}>
          <View className="flex-row flex-wrap gap-2.5">
            {[
              { label: "Not started", value: ipd?.claim_not_started ?? 0 },
              { label: "Docs pending", value: ipd?.claim_documents_pending ?? 0 },
              { label: "Submitted", value: ipd?.claim_submitted ?? 0 },
              { label: "Under review", value: ipd?.claim_under_review ?? 0 },
              { label: "Approved", value: ipd?.claim_approved ?? 0 },
              { label: "Settled", value: ipd?.claim_settled ?? 0 },
            ].map((stage, i) => {
              const chipColor = palette.series[i % palette.series.length];
              return (
                <View
                  key={stage.label}
                  className="w-[31%] gap-1 rounded-2xl p-3"
                  style={{ backgroundColor: `${chipColor}14` }}
                >
                  <Text className="text-lg font-extrabold" style={{ color: chipColor }}>
                    {stage.value}
                  </Text>
                  <Text className="text-[10.5px] font-medium leading-3 text-muted-foreground">
                    {stage.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={liveTabs.length > 0}>
        <WidgetCard title="Live operations">
          <View className="-mx-4 -mt-1 mb-3">
            <TabStrip tabs={liveTabs} activeKey={liveTab} onChange={setLiveTab} scrollable />
          </View>
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {liveTab === "queue" &&
              (queueRows.length === 0 ? (
                <EmptyRow text="No one in the queue right now" />
              ) : (
                queueRows.map((v) => (
                  <ListItem
                    key={v.id}
                    title={v.patient_name}
                    subtitle={`${v.doctor_name ?? "Unassigned"} · ${v.visit_type.replace("_", " ")}`}
                    leftIcon="medkit-outline"
                    right={<Badge label={v.status.replace("_", " ")} variant={v.status === "in_consultation" ? "success" : "secondary"} />}
                    onPress={() => goToOpdVisit(navigation, v.id)}
                  />
                ))
              ))}
            {liveTab === "ipd" &&
              (!activeAdmissions.data || activeAdmissions.data.length === 0 ? (
                <EmptyRow text="No active admissions" />
              ) : (
                activeAdmissions.data.slice(0, 6).map((a) => (
                  <ListItem
                    key={a.id}
                    title={a.patient_name}
                    subtitle={`${a.ward_name}${a.bed_number ? ` · Bed ${a.bed_number}` : ""}`}
                    leftIcon="bed-outline"
                    right={<Badge label={`${a.los_days}d`} variant="secondary" />}
                    onPress={() => goToIpdAdmission(navigation, a.id)}
                  />
                ))
              ))}
            {liveTab === "payments" &&
              (!recentPayments.data || recentPayments.data.length === 0 ? (
                <EmptyRow text="No payments recorded yet" />
              ) : (
                recentPayments.data.slice(0, 6).map((p) => (
                  <ListItem
                    key={p.id}
                    title={formatCurrency(p.amount)}
                    subtitle={`${p.payment_mode} · ${new Date(p.payment_date).toLocaleDateString()}`}
                    leftIcon="cash-outline"
                    chevron={false}
                    onPress={() => goToModule(navigation, "payments", "Payments")}
                  />
                ))
              ))}
          </View>
        </WidgetCard>
      </Gate>

      <Gate show={canDoctors && doctorLeaderboard.length > 0}>
        <WidgetCard title="Doctor leaderboard" subtitle={range.label} loading={clinical.isLoading}>
          <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
            {doctorLeaderboard.map((d, i) => (
              <ListItem
                key={d.name}
                title={d.name}
                subtitle={d.avgMins != null ? `avg ${Math.round(d.avgMins)} min/consult` : undefined}
                leftIcon={i === 0 ? "trophy-outline" : "person-outline"}
                right={<Text className="text-sm font-bold text-card-foreground">{d.visits + d.admissions}</Text>}
                chevron={false}
              />
            ))}
          </View>
        </WidgetCard>
      </Gate>

      <View className="flex-row flex-wrap gap-3">
        <Gate show={canPatients}>
          <StatTile
            icon="people"
            tint={palette.primary}
            label="Active patients"
            value={patientStats.data?.active_patients ?? 0}
            loading={patientStats.isLoading}
            onPress={() => goToModule(navigation, "patients", "Patients")}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canDoctors}>
          <StatTile
            icon="medkit"
            tint={palette.info}
            label="Doctors on duty"
            value={doctorStats.data?.active_doctors ?? 0}
            loading={doctorStats.isLoading}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canInventory}>
          <StatTile
            icon="cube"
            tint={palette.warning}
            label="Low stock items"
            value={inventory.data?.inventory_dashboard?.low_stock_count ?? 0}
            loading={inventory.isLoading}
            onPress={() => goToModule(navigation, "inventory", "Inventory")}
            className="w-[47%]"
          />
        </Gate>
        <Gate show={canPharmacy}>
          <StatTile
            icon="medical"
            tint={palette.danger}
            label="Out of stock"
            value={inventory.data?.pharmacy_product_stats?.out_of_stock_products ?? 0}
            loading={inventory.isLoading}
            onPress={() => goToModule(navigation, "pharmacy", "Pharmacy")}
            className="w-[47%]"
          />
        </Gate>
      </View>
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View className="items-center bg-card px-4 py-6">
      <Text className="text-xs text-muted-foreground">{text}</Text>
    </View>
  );
}
