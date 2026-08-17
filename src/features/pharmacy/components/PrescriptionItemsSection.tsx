import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "../../../components/ui";
import {
  useAddPrescriptionItem,
  useDispensePrescription,
  useRemovePrescriptionItem,
  useUpdatePrescriptionItem,
} from "../hooks";
import { DrugSearchField } from "./DrugSearchField";
import type { Prescription, PrescriptionItem } from "../../../types/pharmacy";
import type { InventoryItem } from "../../../types/inventory";

function extractErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { message?: string; detail?: string } } };
  return anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? fallback;
}

function DispensePrompt({
  item,
  prescriptionId,
  onDone,
}: {
  item: PrescriptionItem;
  prescriptionId: number;
  onDone: () => void;
}) {
  const toast = useToast();
  const dispense = useDispensePrescription(prescriptionId);
  const [quantity, setQuantity] = useState(String(item.quantity));

  function submit() {
    const qty = quantity.trim() ? Number(quantity) : undefined;
    dispense.mutate(
      { item_id: item.id, ...(qty ? { quantity: qty } : {}) },
      {
        onSuccess: (result) => {
          if (result.data.errors.length > 0) {
            toast.show(result.data.errors[0].message, "error");
          } else {
            toast.show("Item dispensed", "success");
          }
          onDone();
        },
        onError: (err) => toast.show(extractErrorMessage(err, "Couldn't dispense this item"), "error"),
      }
    );
  }

  return (
    <View className="mt-2 gap-2 rounded-lg border border-border bg-card p-3">
      <Text className="text-xs font-medium text-muted-foreground">Quantity to dispense</Text>
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
      />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button title="Cancel" variant="outline" size="sm" onPress={onDone} />
        </View>
        <View className="flex-1">
          <Button title="Dispense" size="sm" onPress={submit} loading={dispense.isPending} />
        </View>
      </View>
    </View>
  );
}

function PrescriptionItemRow({
  item,
  prescriptionId,
  canEdit,
  canDelete,
  canDispense,
  locked,
}: {
  item: PrescriptionItem;
  prescriptionId: number;
  canEdit: boolean;
  canDelete: boolean;
  canDispense: boolean;
  locked: boolean;
}) {
  const toast = useToast();
  const updateItem = useUpdatePrescriptionItem(prescriptionId);
  const removeItem = useRemovePrescriptionItem(prescriptionId);
  const [editing, setEditing] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [dosage, setDosage] = useState(item.dosage);
  const [frequency, setFrequency] = useState(item.frequency);
  const [duration, setDuration] = useState(item.duration);
  const [quantity, setQuantity] = useState(String(item.quantity));

  function saveEdit() {
    updateItem.mutate(
      {
        item_id: item.id,
        dosage,
        frequency,
        duration,
        quantity: Number(quantity) || item.quantity,
      },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => toast.show(extractErrorMessage(err, "Couldn't update the item"), "error"),
      }
    );
  }

  function handleRemove() {
    removeItem.mutate(item.id, {
      onError: (err) => toast.show(extractErrorMessage(err, "Couldn't remove the item"), "error"),
    });
  }

  const detailLine = [item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ");

  return (
    <View className="py-2.5 border-b border-border">
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
            {item.drug_name || item.inventory_item_name || "Unnamed drug"}
          </Text>
          {detailLine ? (
            <Text className="text-xs text-muted-foreground" numberOfLines={2}>
              {detailLine}
            </Text>
          ) : null}
          <Text className="text-xs text-muted-foreground">Qty {item.quantity}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          {canDispense ? (
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Dispense ${item.drug_name}`}
              onPress={() => setDispensing((v) => !v)}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-muted"
            >
              <Ionicons name="medkit-outline" size={16} color="#059669" />
            </Pressable>
          ) : null}
          {canEdit && !locked ? (
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.drug_name}`}
              onPress={() => setEditing((v) => !v)}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-muted"
            >
              <Ionicons name="create-outline" size={16} color="#2563eb" />
            </Pressable>
          ) : null}
          {canDelete && !locked ? (
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.drug_name}`}
              onPress={handleRemove}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-muted"
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {dispensing ? (
        <DispensePrompt item={item} prescriptionId={prescriptionId} onDone={() => setDispensing(false)} />
      ) : null}

      {editing ? (
        <View className="mt-2 gap-2 rounded-lg border border-border bg-card p-3">
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="Dosage"
            placeholderTextColor="#94a3b8"
            className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
          />
          <TextInput
            value={frequency}
            onChangeText={setFrequency}
            placeholder="Frequency"
            placeholderTextColor="#94a3b8"
            className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
          />
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="Duration"
            placeholderTextColor="#94a3b8"
            className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
          />
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Quantity"
            placeholderTextColor="#94a3b8"
            className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button title="Cancel" variant="outline" size="sm" onPress={() => setEditing(false)} />
            </View>
            <View className="flex-1">
              <Button title="Save" size="sm" onPress={saveEdit} loading={updateItem.isPending} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function AddItemForm({
  prescriptionId,
  onDone,
}: {
  prescriptionId: number;
  onDone: () => void;
}) {
  const toast = useToast();
  const addItem = useAddPrescriptionItem(prescriptionId);
  const [mode, setMode] = useState<"inventory" | "custom">("inventory");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [quantity, setQuantity] = useState("1");

  function submit() {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.show("Enter a valid quantity", "error");
      return;
    }
    if (mode === "inventory" && !selected) {
      toast.show("Search and select a drug first", "error");
      return;
    }
    if (mode === "custom" && !drugName.trim()) {
      toast.show("Enter a drug name", "error");
      return;
    }

    addItem.mutate(
      {
        ...(mode === "inventory" ? { inventory_item: selected!.id } : { drug_name: drugName.trim() }),
        dosage: dosage || undefined,
        frequency: frequency || undefined,
        duration: duration || undefined,
        quantity: qty,
      },
      {
        onSuccess: onDone,
        onError: (err) => toast.show(extractErrorMessage(err, "Couldn't add the item"), "error"),
      }
    );
  }

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-3 mt-2">
      <View className="flex-row gap-1.5">
        {(["inventory", "custom"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              setMode(m);
              setSelected(null);
              setDrugName("");
            }}
            className={["px-2.5 py-1.5 rounded-full", mode === m ? "bg-primary" : "bg-secondary"].join(" ")}
          >
            <Text
              className={["text-xs font-medium", mode === m ? "text-primary-foreground" : "text-secondary-foreground"].join(
                " "
              )}
            >
              {m === "inventory" ? "From inventory" : "Custom drug"}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === "inventory" ? (
        <DrugSearchField onPick={setSelected} />
      ) : (
        <TextInput
          value={drugName}
          onChangeText={setDrugName}
          placeholder="Drug name"
          placeholderTextColor="#94a3b8"
          className="h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground"
        />
      )}

      {selected ? (
        <Text className="text-sm text-foreground" numberOfLines={1}>
          Selected: {selected.name}
        </Text>
      ) : null}

      <TextInput
        value={dosage}
        onChangeText={setDosage}
        placeholder="Dosage (optional, e.g. 500mg)"
        placeholderTextColor="#94a3b8"
        className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
      />
      <TextInput
        value={frequency}
        onChangeText={setFrequency}
        placeholder="Frequency (optional, e.g. twice daily)"
        placeholderTextColor="#94a3b8"
        className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
      />
      <TextInput
        value={duration}
        onChangeText={setDuration}
        placeholder="Duration (optional, e.g. 5 days)"
        placeholderTextColor="#94a3b8"
        className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
      />
      <View className="flex-1">
        <Text className="text-xs font-medium text-muted-foreground mb-1">Quantity</Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          className="h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
        />
      </View>

      <Button title="Add item" size="sm" onPress={submit} loading={addItem.isPending} />
    </View>
  );
}

export function PrescriptionItemsSection({
  prescription,
  canEdit,
  canDelete,
  canCreate,
  canDispense,
}: {
  prescription: Prescription;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canDispense: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const locked = prescription.status === "cancelled";

  return (
    <View>
      {prescription.items.map((item) => (
        <PrescriptionItemRow
          key={item.id}
          item={item}
          prescriptionId={prescription.id}
          canEdit={canEdit}
          canDelete={canDelete}
          canDispense={canDispense && !locked}
          locked={locked}
        />
      ))}
      {prescription.items.length === 0 ? (
        <Text className="text-sm text-muted-foreground py-3">No items yet.</Text>
      ) : null}

      {canCreate && !locked ? (
        adding ? (
          <AddItemForm prescriptionId={prescription.id} onDone={() => setAdding(false)} />
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            className="flex-row items-center justify-center gap-1.5 rounded-lg border border-dashed border-input py-2.5 mt-2"
          >
            <Ionicons name="add" size={16} color="#2563eb" />
            <Text className="text-sm font-medium text-primary">Add item</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}
