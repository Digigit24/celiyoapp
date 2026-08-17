import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, EmptyState, SearchHeader, FilterBar } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  PRESCRIPTION_STATUS_CHIP_VARIANT,
  PRESCRIPTION_STATUS_LABELS,
  PHARMACY_FILTER_OPTIONS,
  describeEncounter,
  formatDateTime,
} from "../constants";
import { usePrescriptionsList } from "../hooks";
import type { Prescription, PrescriptionStatus } from "../../../types/pharmacy";

/** Param list for the Pharmacy stack — the orchestrator (PharmacyStack.tsx) owns registration. */
export type PharmacyStackParamList = {
  PharmacyList: undefined;
  PharmacyDetail: { prescriptionId: number };
  NewPrescription: undefined;
};

type Props = NativeStackScreenProps<PharmacyStackParamList, "PharmacyList">;

function PrescriptionRow({
  prescription,
  onPress,
}: {
  prescription: Prescription;
  onPress: () => void;
}) {
  const itemCount = prescription.items.length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open prescription for ${prescription.patient_name}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="medical-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground flex-1"
              numberOfLines={1}
            >
              {prescription.patient_name}
            </Text>
            <Chip
              label={PRESCRIPTION_STATUS_LABELS[prescription.status]}
              variant={PRESCRIPTION_STATUS_CHIP_VARIANT[prescription.status]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {formatDateTime(prescription.created_at)} ·{" "}
            {describeEncounter(prescription.encounter_type_label, prescription.encounter_id_value)}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function PharmacyListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PrescriptionStatus>("all");

  const { data, isLoading, isError, refetch, isRefetching } = usePrescriptionsList({
    search: query || undefined,
    status: status === "all" ? undefined : status,
  });

  const results = data?.results ?? [];

  const headerSubtitle = useMemo(() => {
    if (!data) return "";
    return `${results.length} of ${data.count} prescription${data.count === 1 ? "" : "s"}`;
  }, [data, results.length]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search patient name or mobile"
        right={
          can("hms.pharmacy.create") ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New prescription"
              onPress={() => navigation.navigate("NewPrescription")}
              className="h-9 w-9 items-center justify-center rounded-full bg-primary active:opacity-80"
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </Pressable>
          ) : undefined
        }
      />
      <FilterBar
        options={PHARMACY_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | PrescriptionStatus)}
      />

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
            gap: 10,
          }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Prescriptions
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground/70">
                {headerSubtitle}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PrescriptionRow
              prescription={item}
              onPress={() => navigation.navigate("PharmacyDetail", { prescriptionId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Couldn't load prescriptions"
                message="Check your connection and try again."
                action={
                  <Pressable onPress={() => refetch()}>
                    <Text className="text-sm font-semibold text-primary">Retry</Text>
                  </Pressable>
                }
              />
            ) : (
              <EmptyState
                icon="medical-outline"
                title="No prescriptions found"
                message={
                  query.length > 0
                    ? "Try a different search or status filter."
                    : "Prescriptions sent to pharmacy will appear here."
                }
              />
            )
          }
        />
      )}
    </View>
  );
}
