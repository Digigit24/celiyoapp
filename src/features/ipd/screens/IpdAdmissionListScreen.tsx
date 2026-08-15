import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Badge, Card, EmptyState, Input, Select, TabStrip, useToast } from "../../../components/ui";
import type { IpdStackParamList } from "../../../navigation/IpdStack";
import { useAdmissions, useIpdStatistics } from "../hooks";
import { useDoctors, useWards } from "../../../hooks/masters";
import { ADMISSION_STATUS_ACCENT, ADMISSION_STATUS_VARIANT, CLAIM_STATUS_LABELS, formatStayDuration } from "../constants";
import { exportCsvAndShare } from "../../../lib/csv";
import type { AdmissionListItem, AdmissionStatus, ClaimStatus } from "../../../types/ipd";

type Props = NativeStackScreenProps<IpdStackParamList, "IpdAdmissionList">;

const STATUS_TABS: Array<{ key: AdmissionStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "admitted", label: "Admitted" },
  { key: "discharged", label: "Discharged" },
  { key: "transferred", label: "Transferred" },
];
const PAYMENT_STATUS_OPTIONS = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
];

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <Card className="flex-1 gap-1.5" padded>
      <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${tint}1f` }}>
        <Ionicons name={icon} size={14} color={tint} />
      </View>
      <Text className="text-lg font-bold text-foreground">{value}</Text>
      <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function IpdAdmissionListScreen({ navigation }: Props) {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<AdmissionStatus | "all">("admitted");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wardId, setWardId] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState<"from" | "to" | null>(null);
  const [exporting, setExporting] = useState(false);

  const wards = useWards();
  const doctors = useDoctors();
  const stats = useIpdStatistics();
  const admissions = useAdmissions({
    status: status === "all" ? undefined : status,
    search: query || undefined,
    ward: wardId ?? undefined,
    claim_status: claimStatus ?? undefined,
    payment_status: paymentStatus ?? undefined,
    doctor_id: doctorId ?? undefined,
    admission_date__gte: dateFrom ? toIsoDate(dateFrom) : undefined,
    admission_date__lte: dateTo ? toIsoDate(dateTo) : undefined,
    ordering: "-admission_date",
  });

  const doctorNameById = useMemo(() => {
    const map = new Map<string, string>();
    (doctors.data ?? []).forEach((d) => map.set(d.user_id, d.full_name));
    return map;
  }, [doctors.data]);

  const activeFilterCount = [wardId, claimStatus, paymentStatus, doctorId, dateFrom, dateTo].filter(Boolean).length;

  function clearFilters() {
    setWardId(null);
    setClaimStatus(null);
    setPaymentStatus(null);
    setDoctorId(null);
    setDateFrom(null);
    setDateTo(null);
  }

  async function handleExport() {
    const rows = admissions.data?.results ?? [];
    if (rows.length === 0) return;
    setExporting(true);
    try {
      await exportCsvAndShare(`ipd_admissions_${toIsoDate(new Date())}.csv`, rows, [
        { header: "Admission ID", value: (r) => r.admission_id },
        { header: "Patient Name", value: (r) => r.patient_name },
        { header: "Patient ID", value: (r) => r.patient_id_display },
        { header: "Ward", value: (r) => r.ward_name },
        { header: "Bed", value: (r) => r.bed_number },
        { header: "Admission Date", value: (r) => r.admission_date },
        { header: "Status", value: (r) => r.status },
        { header: "LOS (days)", value: (r) => r.los_days },
        { header: "Has Mediclaim", value: (r) => (r.has_mediclaim ? "Yes" : "No") },
      ]);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  const s = stats.data;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-2 px-4 pt-3">
        <View className="flex-1">
          <Input placeholder="Search patient or admission ID…" leftIcon="search-outline" value={query} onChangeText={setQuery} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={handleExport}
          disabled={exporting || (admissions.data?.results.length ?? 0) === 0}
          className="h-11 w-11 items-center justify-center rounded-full bg-secondary active:opacity-70"
        >
          <Ionicons name="share-outline" size={18} color="#0f172a" />
        </Pressable>
      </View>

      {s ? (
        <View className="flex-row gap-2.5 px-4 pt-3">
          <StatCard icon="bed" label="Admitted" value={String(s.currently_admitted)} tint="#3b82f6" />
          <StatCard icon="cube" label="Beds free" value={`${s.available_beds}/${s.total_beds}`} tint="#10b981" />
          <StatCard icon="log-out" label="Discharged today" value={String(s.discharged_today)} tint="#8b5cf6" />
          <StatCard
            icon="stats-chart"
            label="Occupancy"
            value={`${s.occupancy_rate}%`}
            tint={s.occupancy_rate > 80 ? "#ef4444" : "#f59e0b"}
          />
        </View>
      ) : null}

      <View className="py-3">
        <TabStrip tabs={STATUS_TABS} activeKey={status} onChange={setStatus} scrollable />
      </View>
      <View className="flex-row items-center justify-between px-4 pb-2">
        <Pressable onPress={() => setFiltersOpen((v) => !v)} className="flex-row items-center gap-1.5">
          <Ionicons name="filter-outline" size={16} color="#0f172a" />
          <Text className="text-sm font-medium text-foreground">Filters</Text>
          {activeFilterCount > 0 ? <Badge label={String(activeFilterCount)} variant="secondary" /> : null}
        </Pressable>
        {activeFilterCount > 0 ? (
          <Pressable onPress={clearFilters}>
            <Text className="text-xs font-medium text-primary">Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      {filtersOpen ? (
        <View className="gap-3 px-4 pb-3">
          <Select
            label="Ward"
            placeholder="Any ward"
            options={(wards.data ?? []).map((w) => ({ label: w.name, value: w.id }))}
            value={wardId}
            onChange={setWardId}
          />
          <Select
            label="Doctor"
            placeholder="Any doctor"
            options={(doctors.data ?? []).map((d) => ({ label: d.full_name, value: d.user_id }))}
            value={doctorId}
            onChange={setDoctorId}
          />
          <Select
            label="Claim status"
            placeholder="Any"
            options={Object.entries(CLAIM_STATUS_LABELS).map(([value, label]) => ({ label, value }))}
            value={claimStatus}
            onChange={(v) => setClaimStatus(v as ClaimStatus)}
          />
          <Select
            label="Payment status"
            placeholder="Any"
            options={PAYMENT_STATUS_OPTIONS}
            value={paymentStatus}
            onChange={setPaymentStatus}
          />
          <View className="flex-row gap-2">
            <Pressable onPress={() => setPickerOpen("from")} className="flex-1 h-11 justify-center rounded-lg border border-input bg-card px-3">
              <Text className={dateFrom ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                {dateFrom ? toIsoDate(dateFrom) : "Admitted from"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setPickerOpen("to")} className="flex-1 h-11 justify-center rounded-lg border border-input bg-card px-3">
              <Text className={dateTo ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                {dateTo ? toIsoDate(dateTo) : "To"}
              </Text>
            </Pressable>
          </View>
          {pickerOpen ? (
            <DateTimePicker
              value={(pickerOpen === "from" ? dateFrom : dateTo) ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setPickerOpen(null);
                if (event.type === "dismissed" || !date) return;
                if (pickerOpen === "from") setDateFrom(date);
                else setDateTo(date);
              }}
            />
          ) : null}
        </View>
      ) : null}

      {admissions.isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : (
        <FlatList
          data={admissions.data?.results ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10, paddingBottom: insets.bottom + 88 }}
          renderItem={({ item }) => (
            <AdmissionRow
              admission={item}
              doctorName={item.doctor_id ? doctorNameById.get(item.doctor_id) : undefined}
              onPress={() => navigation.navigate("IpdAdmissionDetail", { admissionId: item.id })}
            />
          )}
          ListEmptyComponent={<EmptyState icon="bed-outline" title="No admissions found" />}
        />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("NewIpdAdmission")}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-black/20 active:opacity-90"
        style={{ bottom: insets.bottom + 20 }}
      >
        <Ionicons name="add" size={26} color="#ffffff" />
      </Pressable>
    </View>
  );
}

function AdmissionRow({
  admission,
  doctorName,
  onPress,
}: {
  admission: AdmissionListItem;
  doctorName?: string;
  onPress: () => void;
}) {
  const accent = ADMISSION_STATUS_ACCENT[admission.status];
  const subtitleParts = [
    admission.admission_id,
    admission.ward_name,
    admission.bed_number ? `Bed ${admission.bed_number}` : null,
    doctorName ? `Dr. ${doctorName}` : null,
  ].filter(Boolean);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      <Card padded={false} className="flex-row overflow-hidden">
        <View style={{ backgroundColor: accent.bar, width: 4 }} />
        <View className="flex-1 flex-row items-center gap-3 p-3.5">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
            <Text className="text-sm font-bold text-secondary-foreground">{initials(admission.patient_name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {admission.patient_name}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
              {subtitleParts.join(" · ")}
            </Text>
          </View>
          <View className="items-end gap-1.5">
            <View className="flex-row items-center gap-1">
              <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent.dot }} />
              <Badge label={admission.status} variant={ADMISSION_STATUS_VARIANT[admission.status]} />
            </View>
            {admission.status === "admitted" ? (
              <Text className="text-xs text-muted-foreground">{formatStayDuration(admission.admission_date)}</Text>
            ) : null}
            {admission.has_mediclaim ? <Badge label="Mediclaim" variant="outline" /> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
