/**
 * Ported from src/features/ipd/components/billing/BillItemsSection.tsx,
 * retargeted at OPD bill items. Reuses CatalogSearchField as-is (generic,
 * not admission-specific) — web's own OPD billing UI only exposes the
 * Procedure catalog, but the mobile app offers all four catalog types for
 * consistency with IPD-mobile's billing (deliberate improvement, see
 * OPD_BUILD_PROMPT.md).
 */
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Select, useToast } from "../../../../components/ui";
import { searchInvestigations } from "../../../../lib/api/diagnostics";
import { searchPackages, searchProcedures, searchServices } from "../../../../lib/api/catalog";
import { useCreateOpdBillItem, useDeleteOpdBillItem, useUpdateOpdBillItem } from "../../hooks";
import { OPD_BILL_ITEM_SOURCE_COLOR } from "../../constants";
import type { BillItemSource, CatalogType } from "../../../../types/ipd";
import type { OPDBillItem } from "../../../../types/opd";
import { CatalogSearchField, type CatalogOption } from "../../../ipd/components/billing/CatalogSearchField";

const CATALOG_TABS: Array<{ key: CatalogType | "custom"; label: string }> = [
  { key: "procedure", label: "Procedure" },
  { key: "package", label: "Package" },
  { key: "service", label: "Service" },
  { key: "investigation", label: "Investigation" },
  { key: "custom", label: "Custom" },
];

const OPD_SOURCE_OPTIONS: OPDBillItem["source"][] = [
  "Consultation",
  "Pharmacy",
  "Lab",
  "Radiology",
  "Procedure",
  "Package",
  "Therapy",
  "Other",
];

function BillItemRow({ item, visitId, locked }: { item: OPDBillItem; visitId: number; locked: boolean }) {
  const toast = useToast();
  const updateItem = useUpdateOpdBillItem(visitId);
  const deleteItem = useDeleteOpdBillItem(visitId);
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(item.unit_price);

  const sourceColor = OPD_BILL_ITEM_SOURCE_COLOR[item.source as keyof typeof OPD_BILL_ITEM_SOURCE_COLOR] ?? "#64748b";

  return (
    <View className="flex-row items-center gap-2 py-2.5 border-b border-border">
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${sourceColor}22` }}>
            <Text className="text-[10px] font-medium" style={{ color: sourceColor }}>
              {item.source}
            </Text>
          </View>
          {item.is_price_overridden ? <Text className="text-[10px] text-amber-600">Modified</Text> : null}
        </View>
        <Text className="text-sm font-medium text-foreground mt-0.5" numberOfLines={1}>
          {item.item_name}
        </Text>
        <Text className="text-xs text-muted-foreground">Qty {item.quantity}</Text>
      </View>
      {editing ? (
        <TextInput
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          autoFocus
          onBlur={() => {
            setEditing(false);
            if (price !== item.unit_price) {
              updateItem.mutate(
                { id: item.id, payload: { unit_price: Number(price) } },
                { onError: () => toast.show("Couldn't update the price", "error") }
              );
            }
          }}
          className="w-20 h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground text-right"
        />
      ) : (
        <Pressable disabled={locked} onPress={() => setEditing(true)}>
          <Text className="text-sm font-semibold text-foreground">₹{item.total_price}</Text>
        </Pressable>
      )}
      {!locked ? (
        <Pressable
          hitSlop={8}
          onPress={() =>
            deleteItem.mutate(item.id, { onError: () => toast.show("Couldn't remove the item", "error") })
          }
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </Pressable>
      ) : null}
    </View>
  );
}

function AddItemForm({ billId, visitId, onDone }: { billId: number; visitId: number; onDone: () => void }) {
  const toast = useToast();
  const createItem = useCreateOpdBillItem(visitId);
  const [tab, setTab] = useState<CatalogType | "custom">("procedure");
  const [selected, setSelected] = useState<{ catalogId?: number; name: string; price: string } | null>(null);
  const [source, setSource] = useState<BillItemSource>("Other");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");

  function submit() {
    if (tab === "custom") {
      if (!selected?.name.trim() || !price) {
        toast.show("Description and price are required", "error");
        return;
      }
      createItem.mutate(
        { bill: billId, item_name: selected.name.trim(), source, quantity: Number(quantity), unit_price: Number(price) },
        { onSuccess: onDone, onError: () => toast.show("Couldn't add the item", "error") }
      );
      return;
    }
    if (!selected?.catalogId) {
      toast.show("Search and select an item first", "error");
      return;
    }
    createItem.mutate(
      {
        bill: billId,
        catalog_type: tab,
        catalog_id: selected.catalogId,
        quantity: Number(quantity),
        unit_price: price ? Number(price) : undefined,
      },
      { onSuccess: onDone, onError: () => toast.show("Couldn't add the item", "error") }
    );
  }

  function handleCatalogPick(option: CatalogOption) {
    setSelected({ catalogId: option.id, name: option.label, price: option.price });
    setPrice(option.price);
  }

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-3 mt-2">
      <View className="flex-row flex-wrap gap-1.5">
        {CATALOG_TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => {
              setTab(t.key);
              setSelected(null);
              setPrice("");
            }}
            className={["px-2.5 py-1.5 rounded-full", tab === t.key ? "bg-primary" : "bg-secondary"].join(" ")}
          >
            <Text className={["text-xs font-medium", tab === t.key ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "procedure" ? (
        <CatalogSearchField
          placeholder="Search procedures…"
          search={(q) => searchProcedures(q).then((r) => r.map((p) => ({ id: p.id, label: p.name, price: p.default_charge })))}
          onPick={handleCatalogPick}
        />
      ) : null}
      {tab === "service" ? (
        <CatalogSearchField
          placeholder="Search services…"
          search={(q) => searchServices(q).then((r) => r.map((s) => ({ id: s.id, label: s.name, price: s.default_charge })))}
          onPick={handleCatalogPick}
        />
      ) : null}
      {tab === "package" ? (
        <CatalogSearchField
          placeholder="Search packages…"
          search={(q) => searchPackages(q).then((r) => r.map((p) => ({ id: p.id, label: p.name, price: p.discounted_charge })))}
          onPick={handleCatalogPick}
        />
      ) : null}
      {tab === "investigation" ? (
        <CatalogSearchField
          placeholder="Search investigations…"
          search={(q) => searchInvestigations(q).then((r) => r.map((i) => ({ id: i.id, label: i.name, price: i.base_charge })))}
          onPick={handleCatalogPick}
        />
      ) : null}
      {tab === "custom" ? (
        <>
          <TextInput
            value={selected?.name ?? ""}
            onChangeText={(t) => setSelected({ name: t, price: "" })}
            placeholder="Description"
            placeholderTextColor="#94a3b8"
            className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
          />
          <Select
            label="Source"
            options={OPD_SOURCE_OPTIONS.map((s) => ({ label: s, value: s }))}
            value={source}
            onChange={(v) => setSource(v as BillItemSource)}
          />
        </>
      ) : null}

      {selected ? (
        <Text className="text-sm text-foreground" numberOfLines={1}>
          Selected: {selected.name}
        </Text>
      ) : null}

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="text-xs font-medium text-muted-foreground mb-1">Qty</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            className="h-10 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-medium text-muted-foreground mb-1">Price (₹)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            className="h-10 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
          />
        </View>
      </View>

      <Button title="Add item" size="sm" onPress={submit} loading={createItem.isPending} />
    </View>
  );
}

export function BillItemsSection({
  billId,
  visitId,
  items,
  locked,
}: {
  billId: number;
  visitId: number;
  items: OPDBillItem[];
  locked: boolean;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <View>
      {items.map((item) => (
        <BillItemRow key={item.id} item={item} visitId={visitId} locked={locked} />
      ))}
      {items.length === 0 ? <Text className="text-sm text-muted-foreground py-3">No items yet.</Text> : null}

      {!locked ? (
        adding ? (
          <AddItemForm billId={billId} visitId={visitId} onDone={() => setAdding(false)} />
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
