import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Badge, Button, Card } from "../../../../components/ui";
import { useAddBedCharges, useUpdateBill } from "../../hooks";
import type { PrintPreviewNavigation } from "../../../clinical/screens/PrintPreviewScreen";
import type { IPDBilling } from "../../../../types/ipd";
import { BillItemsSection } from "./BillItemsSection";
import { PaymentsSection } from "./PaymentsSection";
import { BillTemplatesPanel } from "./BillTemplatesPanel";

const STATUS_VARIANT = { paid: "success", partial: "warning", unpaid: "destructive" } as const;

export function BillDetailCard({ bill, admissionId }: { bill: IPDBilling; admissionId: number }) {
  const navigation = useNavigation() as unknown as PrintPreviewNavigation;
  const [view, setView] = useState<"items" | "payments">("items");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(bill.discount_percent);

  const addBedCharges = useAddBedCharges(admissionId);
  const updateBill = useUpdateBill(admissionId);
  const locked = bill.payment_status === "paid";

  function handlePrint() {
    navigation.navigate("PrintPreview", { formCode: "ipd_bill", recordId: bill.id, title: bill.bill_number });
  }

  return (
    <View className="gap-3">
      <Card>
        <View className="flex-row items-center justify-between">
          <Badge label={bill.payment_status} variant={STATUS_VARIANT[bill.payment_status]} />
          <Text className="text-xs font-mono text-muted-foreground">{bill.bill_number}</Text>
        </View>

        <View className="flex-row justify-between mt-3">
          <View>
            <Text className="text-xs text-muted-foreground">Payable</Text>
            <Text className="text-base font-semibold text-foreground">₹{bill.payable_amount}</Text>
            {Number(bill.discount_percent) > 0 ? (
              <Text className="text-xs text-muted-foreground">−{bill.discount_percent}% disc</Text>
            ) : null}
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Received</Text>
            <Text className="text-base font-semibold text-emerald-600">₹{bill.received_amount}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Balance</Text>
            <Text className={["text-base font-semibold", Number(bill.balance_amount) > 0 ? "text-rose-600" : "text-emerald-600"].join(" ")}>
              ₹{bill.balance_amount}
            </Text>
          </View>
        </View>

        {bill.bed_day_info.total_los > 0 ? (
          <View className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2.5">
            <Text className="text-xs text-blue-700 dark:text-blue-300">
              Room charges: {bill.bed_day_info.already_billed_days} of {bill.bed_day_info.total_los} days billed
              {" · "}This bill: {bill.bed_day_info.this_bill_days} days
              {bill.bed_day_info.remaining_days > 0 ? ` · Unbilled: ${bill.bed_day_info.remaining_days} days` : ""}
            </Text>
            {!locked && bill.bed_day_info.remaining_days > 0 ? (
              <Pressable onPress={() => addBedCharges.mutate(bill.id)} className="mt-1">
                <Text className="text-xs font-medium text-primary">Refresh</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!locked ? (
          <View className="mt-3">
            {discountOpen ? (
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  keyboardType="numeric"
                  className="flex-1 h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
                />
                <Button
                  title="Apply"
                  size="sm"
                  fullWidth={false}
                  loading={updateBill.isPending}
                  onPress={() =>
                    updateBill.mutate(
                      { id: bill.id, payload: { discount_percent: Number(discountPercent) } },
                      { onSuccess: () => setDiscountOpen(false) }
                    )
                  }
                />
              </View>
            ) : (
              <Pressable onPress={() => setDiscountOpen(true)}>
                <Text className="text-sm font-medium text-primary">Apply discount</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <View className="mt-3">
          <Button title="Print" variant="outline" size="sm" onPress={handlePrint} />
        </View>
      </Card>

      <View className="flex-row gap-2">
        {(["items", "payments"] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            className={["px-3 py-1.5 rounded-full", view === v ? "bg-primary" : "bg-secondary"].join(" ")}
          >
            <Text className={["text-sm font-medium capitalize", view === v ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
              {v}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === "items" ? (
        <>
          <BillItemsSection billId={bill.id} admissionId={admissionId} items={bill.items} locked={locked} />
          <BillTemplatesPanel bill={bill} admissionId={admissionId} />
        </>
      ) : (
        <PaymentsSection bill={bill} admissionId={admissionId} />
      )}
    </View>
  );
}
