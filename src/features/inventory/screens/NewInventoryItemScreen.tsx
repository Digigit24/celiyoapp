/**
 * Create/edit form for an InventoryItem. Reused for both the "NewInventoryItem"
 * and "EditInventoryItem" routes — `route.params?.itemId` decides the mode.
 *
 * `current_stock` is always server-derived (never shown/settable here — stock
 * only changes via Receive/Issue/Adjust on the detail screen). No categories
 * list endpoint is in the verified contract, so category assignment is left
 * out of this form rather than inventing one; editing an item that already
 * has a category leaves it untouched since the field is simply omitted from
 * the PATCH payload.
 */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, FormField, Input, InlineError, useToast } from "../../../components/ui";
import { INVENTORY_TAGS, type InventoryTag } from "../../../types/inventory";
import { TAG_LABELS } from "../constants";
import { useCreateItem, useInventoryItem, useUpdateItem } from "../hooks";
import type { InventoryStackParamList } from "./InventoryListScreen";

type Props = NativeStackScreenProps<InventoryStackParamList, "NewInventoryItem" | "EditInventoryItem">;

function extractErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { message?: string; detail?: string } } };
  return anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? fallback;
}

export function NewInventoryItemScreen({ route, navigation }: Props) {
  const itemId = route.params && "itemId" in route.params ? route.params.itemId : undefined;
  const isEdit = Boolean(itemId);
  const toast = useToast();

  const { data: existing, isLoading } = useInventoryItem(itemId);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [maxStockLevel, setMaxStockLevel] = useState("");
  const [expiryAlertDays, setExpiryAlertDays] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<InventoryTag[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCode(existing.code ?? "");
      setBarcode(existing.barcode ?? "");
      setUnit(existing.unit_of_measure || "pcs");
      setPurchasePrice(existing.purchase_price ?? "");
      setSellingPrice(existing.selling_price ?? "");
      setReorderLevel(String(existing.reorder_level ?? ""));
      setMaxStockLevel(existing.max_stock_level ? String(existing.max_stock_level) : "");
      setExpiryAlertDays(String(existing.expiry_alert_days ?? ""));
      setTaxRate(existing.tax_rate ?? "");
      setHsnCode(existing.hsn_code ?? "");
      setDescription(existing.description ?? "");
      setTags(existing.tags ?? []);
    }
  }, [existing]);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Edit Item" : "New Item" });
  }, [navigation, isEdit]);

  function toggleTag(tag: InventoryTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError("Item name is required");
      return;
    }
    setError(null);

    const payload = {
      name: name.trim(),
      code: code.trim() || undefined,
      barcode: barcode.trim() || undefined,
      unit_of_measure: unit.trim() || "pcs",
      purchase_price: purchasePrice || undefined,
      selling_price: sellingPrice || undefined,
      reorder_level: reorderLevel ? Number(reorderLevel) : undefined,
      max_stock_level: maxStockLevel ? Number(maxStockLevel) : undefined,
      expiry_alert_days: expiryAlertDays ? Number(expiryAlertDays) : undefined,
      tax_rate: taxRate || undefined,
      hsn_code: hsnCode.trim() || undefined,
      description: description.trim() || undefined,
      tags,
    };

    if (isEdit && itemId) {
      updateItem.mutate(
        { id: itemId, payload },
        {
          onSuccess: () => {
            toast.show("Item updated", "success");
            navigation.goBack();
          },
          onError: (err) => toast.show(extractErrorMessage(err, "Couldn't update the item"), "error"),
        }
      );
    } else {
      createItem.mutate(payload, {
        onSuccess: (item) => {
          toast.show("Item created", "success");
          navigation.replace("InventoryDetail", { itemId: item.id });
        },
        onError: (err) => toast.show(extractErrorMessage(err, "Couldn't create the item"), "error"),
      });
    }
  }

  if (isEdit && isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const saving = createItem.isPending || updateItem.isPending;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <FormField label="Item name" required>
        <Input value={name} onChangeText={setName} placeholder="e.g. Amoxicillin 500mg" />
      </FormField>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Code">
            <Input value={code} onChangeText={setCode} placeholder="Optional" autoCapitalize="characters" />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Barcode">
            <Input value={barcode} onChangeText={setBarcode} placeholder="Optional" />
          </FormField>
        </View>
      </View>

      <FormField label="Unit of measure" helper="Defaults to pcs">
        <Input value={unit} onChangeText={setUnit} placeholder="pcs, tablets, vials…" />
      </FormField>

      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-foreground">Tags</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {INVENTORY_TAGS.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleTag(tag)}
                className={["px-3 py-1.5 rounded-full", selected ? "bg-primary" : "bg-secondary"].join(" ")}
              >
                <Text className={["text-xs font-medium", selected ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
                  {TAG_LABELS[tag]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Purchase price ₹">
            <Input value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" placeholder="0.00" />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Selling price ₹">
            <Input value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" placeholder="0.00" />
          </FormField>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Reorder level">
            <Input value={reorderLevel} onChangeText={setReorderLevel} keyboardType="numeric" placeholder="0" />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Max stock level" helper="Optional">
            <Input value={maxStockLevel} onChangeText={setMaxStockLevel} keyboardType="numeric" placeholder="Optional" />
          </FormField>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Expiry alert (days)" helper="Optional">
            <Input value={expiryAlertDays} onChangeText={setExpiryAlertDays} keyboardType="numeric" placeholder="Optional" />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Tax rate %">
            <Input value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" placeholder="0" />
          </FormField>
        </View>
      </View>

      <FormField label="HSN code" helper="Optional">
        <Input value={hsnCode} onChangeText={setHsnCode} placeholder="Optional" />
      </FormField>

      <FormField label="Description" helper="Optional">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="min-h-[80px] rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground"
        />
      </FormField>

      <InlineError message={error} />

      <View>
        <Button title={isEdit ? "Save changes" : "Create item"} onPress={handleSubmit} loading={saving} />
      </View>
    </ScrollView>
  );
}
