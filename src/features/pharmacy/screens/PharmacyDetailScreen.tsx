import React, { useLayoutEffect } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  KeyValueRow,
  SectionHeader,
  StatTile,
  useToast,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  PRESCRIPTION_STATUS_CHIP_VARIANT,
  PRESCRIPTION_STATUS_LABELS,
  describeEncounter,
  formatDateTime,
} from "../constants";
import { useDeletePrescription, useDispensePrescription, usePrescription } from "../hooks";
import { PrescriptionItemsSection } from "../components/PrescriptionItemsSection";
import type { PharmacyStackParamList } from "./PharmacyListScreen";

function extractErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { message?: string; detail?: string } } };
  return anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? fallback;
}

type Props = NativeStackScreenProps<PharmacyStackParamList, "PharmacyDetail">;

export function PharmacyDetailScreen({ route, navigation }: Props) {
  const { prescriptionId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can } = useAuth();
  const { data: prescription, isLoading, isError, refetch } = usePrescription(prescriptionId);
  const dispenseAll = useDispensePrescription(prescriptionId);
  const deletePrescription = useDeletePrescription();

  const canEdit = can("hms.pharmacy.edit");
  const canDelete = can("hms.pharmacy.delete");
  const canCreate = can("hms.pharmacy.create");
  const canDispense = can("hms.pharmacy.sell");

  useLayoutEffect(() => {
    if (prescription) {
      navigation.setOptions({
        title: `Rx #${prescription.id}`,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={PRESCRIPTION_STATUS_LABELS[prescription.status]}
              variant={PRESCRIPTION_STATUS_CHIP_VARIANT[prescription.status]}
            />
          </View>
        ),
      });
    }
  }, [navigation, prescription]);

  function handleDispenseAll() {
    dispenseAll.mutate(undefined, {
      onSuccess: (result) => {
        if (result.data.errors.length > 0) {
          toast.show(
            `${result.data.dispensed.length} dispensed, ${result.data.errors.length} failed: ${result.data.errors[0].message}`,
            "error"
          );
        } else {
          toast.show("All pending items dispensed", "success");
        }
      },
      onError: (err) => toast.show(extractErrorMessage(err, "Couldn't dispense items"), "error"),
    });
  }

  function handleDelete() {
    Alert.alert(
      "Delete prescription?",
      "This can't be undone, even if items have already been dispensed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deletePrescription.mutate(prescriptionId, {
              onSuccess: () => {
                toast.show("Prescription deleted", "success");
                navigation.goBack();
              },
              onError: (err) => toast.show(extractErrorMessage(err, "Couldn't delete the prescription"), "error"),
            }),
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !prescription) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this prescription"
          message="It may have been removed, or your connection dropped."
          action={<Button title="Retry" onPress={() => refetch()} fullWidth={false} />}
        />
      </View>
    );
  }

  const itemCount = prescription.items.length;
  const totalQuantity = prescription.items.reduce((sum, i) => sum + i.quantity, 0);
  const hasPendingItems = prescription.status === "pending" || prescription.status === "partially_dispensed";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Identity header */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={prescription.patient_name} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {prescription.patient_name}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {describeEncounter(prescription.encounter_type_label, prescription.encounter_id_value)}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip
                  label={PRESCRIPTION_STATUS_LABELS[prescription.status]}
                  variant={PRESCRIPTION_STATUS_CHIP_VARIANT[prescription.status]}
                />
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
                {itemCount}
              </Text>
              <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                items
              </Text>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Prescribed by" value={prescription.doctor_user_id} />
            <KeyValueRow label="Created" value={formatDateTime(prescription.created_at)} />
          </View>
        </Card>
      </View>

      {/* Quick stats */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile icon="cube-outline" label="Line items" value={itemCount} tint="blue" />
          </View>
          <View className="flex-1">
            <StatTile icon="layers-outline" label="Total quantity" value={totalQuantity} tint="emerald" />
          </View>
        </View>
      </View>

      {prescription.notes ? (
        <View className="px-4">
          <Card>
            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Notes</Text>
            <Text className="text-sm text-foreground">{prescription.notes}</Text>
          </Card>
        </View>
      ) : null}

      {/* Drug lines */}
      <View>
        <SectionHeader title="Prescribed items" count={`${itemCount} line${itemCount === 1 ? "" : "s"}`} />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-3">
              <PrescriptionItemsSection
                prescription={prescription}
                canEdit={canEdit}
                canDelete={canDelete}
                canCreate={canCreate}
                canDispense={canDispense}
              />
            </View>
          </Card>
        </View>
      </View>

      {canDispense && hasPendingItems && itemCount > 0 ? (
        <View className="px-4">
          <Button
            title="Dispense all pending items"
            icon={<Ionicons name="medkit-outline" size={18} color="#ffffff" />}
            onPress={handleDispenseAll}
            loading={dispenseAll.isPending}
          />
        </View>
      ) : null}

      {canDelete ? (
        <View className="px-4">
          <Button
            title="Delete prescription"
            variant="destructive"
            onPress={handleDelete}
            loading={deletePrescription.isPending}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
