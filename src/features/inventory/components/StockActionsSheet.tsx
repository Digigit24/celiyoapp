/**
 * Receive / Issue / Adjust stock — a BottomSheet with a tab switcher, mirroring
 * the "pick from catalog, add line item" flow in IPD billing's BillItemsSection
 * (AddItemForm) but for stock movements instead of bill items.
 */
import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { BottomSheet, Button, Select, useToast } from "../../../components/ui";
import {
  STOCK_ADJUSTMENT_TYPES,
  STOCK_ISSUE_TYPES,
  STOCK_REFERENCE_TYPES,
  type InventoryBatch,
  type InventoryItemDetail,
  type StockAdjustmentType,
  type StockIssueType,
  type StockReferenceType,
} from "../../../types/inventory";
import { useAdjustStock, useIssueStock, useReceiveStock } from "../hooks";

function extractErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { message?: string; detail?: string } } };
  return anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? fallback;
}

const ADJUSTMENT_LABELS: Record<StockAdjustmentType, string> = {
  adjustment_add: "Add stock",
  adjustment_remove: "Remove stock",
  disposal: "Disposal",
  expired: "Expired",
};

const ISSUE_TYPE_LABELS: Record<StockIssueType, string> = {
  issue_opd: "OPD",
  issue_ipd: "IPD",
  issue_general: "General",
};

const REFERENCE_TYPE_LABELS: Record<StockReferenceType, string> = {
  opd_visit: "OPD visit",
  ipd_admission: "IPD admission",
  manual: "Manual",
  other: "Other",
};

function batchOptions(batches: InventoryBatch[]) {
  return batches.map((b) => ({ label: `${b.batch_number} · ${b.quantity} left`, value: String(b.id) }));
}

function ReceiveForm({ item, onDone }: { item: InventoryItemDetail; onDone: () => void }) {
  const toast = useToast();
  const receiveStock = useReceiveStock();
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");

  function submit() {
    const qty = Number(quantity);
    if (!batchNumber.trim()) {
      toast.show("Enter a batch number", "error");
      return;
    }
    if (!qty || qty <= 0) {
      toast.show("Enter a valid quantity", "error");
      return;
    }
    receiveStock.mutate(
      {
        item: item.id,
        batch_number: batchNumber.trim(),
        quantity: qty,
        expiry_date: expiryDate || undefined,
        supplier: supplier || undefined,
        unit_cost: unitCost || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.show("Stock received", "success");
          onDone();
        },
        onError: (err) => toast.show(extractErrorMessage(err, "Couldn't receive stock"), "error"),
      }
    );
  }

  return (
    <View className="gap-3">
      <TextInput
        value={batchNumber}
        onChangeText={setBatchNumber}
        placeholder="Batch number"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder={`Quantity (${item.unit_of_measure})`}
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <TextInput
        value={expiryDate}
        onChangeText={setExpiryDate}
        placeholder="Expiry date (YYYY-MM-DD, optional)"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <TextInput
        value={supplier}
        onChangeText={setSupplier}
        placeholder="Supplier (optional)"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <TextInput
        value={unitCost}
        onChangeText={setUnitCost}
        keyboardType="numeric"
        placeholder="Unit cost ₹ (optional)"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <Button title="Receive stock" onPress={submit} loading={receiveStock.isPending} />
    </View>
  );
}

function IssueForm({
  item,
  batches,
  onDone,
}: {
  item: InventoryItemDetail;
  batches: InventoryBatch[];
  onDone: () => void;
}) {
  const toast = useToast();
  const issueStock = useIssueStock();
  const [quantity, setQuantity] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<StockIssueType>("issue_general");
  const [referenceType, setReferenceType] = useState<StockReferenceType>("manual");
  const [notes, setNotes] = useState("");

  function submit() {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.show("Enter a valid quantity", "error");
      return;
    }
    issueStock.mutate(
      {
        item: item.id,
        quantity: qty,
        batch: batchId ? Number(batchId) : undefined,
        issue_type: issueType,
        reference_type: referenceType,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.show("Stock issued", "success");
          onDone();
        },
        onError: (err) => toast.show(extractErrorMessage(err, "Couldn't issue stock"), "error"),
      }
    );
  }

  return (
    <View className="gap-3">
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder={`Quantity (${item.unit_of_measure})`}
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      {batches.length > 0 ? (
        <Select
          label="Batch (optional)"
          placeholder="Any batch"
          options={batchOptions(batches)}
          value={batchId}
          onChange={setBatchId}
        />
      ) : null}
      <Select
        label="Issue type"
        options={STOCK_ISSUE_TYPES.map((t) => ({ label: ISSUE_TYPE_LABELS[t], value: t }))}
        value={issueType}
        onChange={(v) => setIssueType(v as StockIssueType)}
      />
      <Select
        label="Reference"
        options={STOCK_REFERENCE_TYPES.map((t) => ({ label: REFERENCE_TYPE_LABELS[t], value: t }))}
        value={referenceType}
        onChange={(v) => setReferenceType(v as StockReferenceType)}
      />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <Button title="Issue stock" onPress={submit} loading={issueStock.isPending} />
    </View>
  );
}

function AdjustForm({
  item,
  batches,
  onDone,
}: {
  item: InventoryItemDetail;
  batches: InventoryBatch[];
  onDone: () => void;
}) {
  const toast = useToast();
  const adjustStock = useAdjustStock();
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>("adjustment_add");
  const [quantity, setQuantity] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  function submit() {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.show("Enter a valid quantity", "error");
      return;
    }
    adjustStock.mutate(
      {
        item: item.id,
        adjustment_type: adjustmentType,
        quantity: qty,
        batch: batchId ? Number(batchId) : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.show("Stock adjusted", "success");
          onDone();
        },
        onError: (err) => toast.show(extractErrorMessage(err, "Couldn't adjust stock"), "error"),
      }
    );
  }

  return (
    <View className="gap-3">
      <Select
        label="Adjustment type"
        options={STOCK_ADJUSTMENT_TYPES.map((t) => ({ label: ADJUSTMENT_LABELS[t], value: t }))}
        value={adjustmentType}
        onChange={(v) => setAdjustmentType(v as StockAdjustmentType)}
      />
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder={`Quantity (${item.unit_of_measure})`}
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      {batches.length > 0 ? (
        <Select
          label="Batch (optional)"
          placeholder="Any batch"
          options={batchOptions(batches)}
          value={batchId}
          onChange={setBatchId}
        />
      ) : null}
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      <Button title="Adjust stock" onPress={submit} loading={adjustStock.isPending} />
    </View>
  );
}

export type StockActionKind = "receive" | "issue" | "adjust";

const TAB_LABELS: Record<StockActionKind, string> = {
  receive: "Receive",
  issue: "Issue",
  adjust: "Adjust",
};

export function StockActionsSheet({
  visible,
  initialTab,
  item,
  batches,
  onClose,
}: {
  visible: boolean;
  initialTab: StockActionKind;
  item: InventoryItemDetail;
  batches: InventoryBatch[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<StockActionKind>(initialTab);

  useEffect(() => {
    if (visible) setTab(initialTab);
  }, [visible, initialTab]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Stock movement" snapPoints={[0.75]}>
      <View className="gap-4 pb-2">
        <View className="flex-row gap-1.5">
          {(["receive", "issue", "adjust"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={["flex-1 h-9 items-center justify-center rounded-full", tab === t ? "bg-primary" : "bg-secondary"].join(
                " "
              )}
            >
              <Text className={["text-sm font-medium", tab === t ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
                {TAB_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "receive" ? <ReceiveForm item={item} onDone={onClose} /> : null}
        {tab === "issue" ? <IssueForm item={item} batches={batches} onDone={onClose} /> : null}
        {tab === "adjust" ? <AdjustForm item={item} batches={batches} onDone={onClose} /> : null}
      </View>
    </BottomSheet>
  );
}
