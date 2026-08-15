import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, InlineError, Select, useToast } from "../../../components/ui";
import { useBeds, useWards } from "../../../hooks/masters";
import { useBedTransfers, useCreateBedTransfer } from "../hooks";

interface BedTransferModalProps {
  visible: boolean;
  onClose: () => void;
  admissionId: number;
  currentBedId: string | null;
}

export function BedTransferModal({ visible, onClose, admissionId, currentBedId }: BedTransferModalProps) {
  const toast = useToast();
  const [wardId, setWardId] = useState<string | null>(null);
  const [bedId, setBedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wards = useWards();
  const beds = useBeds(wardId ?? undefined);
  const transfers = useBedTransfers(admissionId);
  const createTransfer = useCreateBedTransfer();

  const wardOptions = (wards.data ?? []).map((w) => ({ label: `${w.name} (${w.available_beds_count} free)`, value: w.id }));
  const bedOptions = (beds.data ?? [])
    .filter((b) => !b.is_occupied && b.id !== currentBedId)
    .map((b) => ({ label: `Bed ${b.bed_number}`, value: b.id }));

  function reset() {
    setWardId(null);
    setBedId(null);
    setReason("");
    setError(null);
  }

  function handleSubmit() {
    if (!currentBedId) {
      setError("This admission has no bed assigned yet — use Registration to allot one first.");
      return;
    }
    if (!bedId) {
      setError("Select a target bed");
      return;
    }
    setError(null);
    createTransfer.mutate(
      { admission: admissionId, from_bed: currentBedId, to_bed: bedId, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.show("Bed transferred", "success");
          reset();
        },
        onError: () => toast.show("Couldn't transfer the bed", "error"),
      }
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-popover rounded-t-2xl max-h-[85%] pb-6" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-base font-semibold text-popover-foreground">Bed Transfer</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {!currentBedId ? (
              <Text className="text-sm text-muted-foreground">
                No bed assigned to this admission yet.
              </Text>
            ) : (
              <>
                <Select
                  label="Target ward"
                  placeholder="Select ward"
                  options={wardOptions}
                  value={wardId}
                  onChange={(v) => {
                    setWardId(v);
                    setBedId(null);
                  }}
                  loading={wards.isLoading}
                />
                <Select
                  label="Target bed"
                  placeholder={wardId ? "Select bed" : "Select a ward first"}
                  options={bedOptions}
                  value={bedId}
                  onChange={setBedId}
                  loading={beds.isLoading}
                  disabled={!wardId}
                />
                <Input label="Reason" value={reason} onChangeText={setReason} />
                <InlineError message={error} />
                <Button title="Transfer bed" onPress={handleSubmit} loading={createTransfer.isPending} />
              </>
            )}

            <View className="mt-2">
              <Text className="text-sm font-semibold text-foreground mb-2">Transfer history</Text>
              {transfers.isLoading ? (
                <ActivityIndicator />
              ) : (transfers.data ?? []).length === 0 ? (
                <Text className="text-sm text-muted-foreground">No transfers yet.</Text>
              ) : (
                (transfers.data ?? []).map((t) => (
                  <View key={t.id} className="py-2 border-b border-border">
                    <Text className="text-sm text-foreground">
                      {t.from_bed_info} → {t.to_bed_info}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {new Date(t.transfer_date).toLocaleString()}
                      {t.reason ? ` · ${t.reason}` : ""}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
