import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Button, Select, useToast } from "../../../../components/ui";
import { useAddPayment, useBillPayments } from "../../hooks";
import { PAYMENT_MODE_LABEL } from "../../constants";
import { IPD_PAYMENT_MODES } from "../../../../types/ipd";
import type { BillPaymentMode, IPDBilling } from "../../../../types/ipd";

export function PaymentsSection({ bill, admissionId }: { bill: IPDBilling; admissionId: number }) {
  const toast = useToast();
  const payments = useBillPayments(bill.id);
  const addPayment = useAddPayment(admissionId);
  const [recording, setRecording] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<BillPaymentMode>("cash");

  const balance = Number(bill.balance_amount);

  function submit() {
    if (!amount || Number(amount) <= 0) {
      toast.show("Enter a valid amount", "error");
      return;
    }
    addPayment.mutate(
      { id: bill.id, payload: { amount: Number(amount), payment_mode: mode } },
      {
        onSuccess: () => {
          toast.show("Payment recorded", "success");
          setRecording(false);
          setAmount("");
        },
        onError: () => toast.show("Couldn't record the payment", "error"),
      }
    );
  }

  return (
    <View className="gap-3">
      {payments.isLoading ? (
        <ActivityIndicator className="py-4" />
      ) : (payments.data ?? []).length === 0 ? (
        <Text className="text-sm text-muted-foreground py-2">No payments recorded yet.</Text>
      ) : (
        (payments.data ?? []).map((p) => (
          <View key={p.id} className="flex-row items-center justify-between py-2 border-b border-border">
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">{PAYMENT_MODE_LABEL[p.payment_mode]}</Text>
              <Text className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</Text>
            </View>
            <Text className="text-sm font-semibold text-emerald-600">+₹{p.amount}</Text>
          </View>
        ))
      )}

      {balance > 0 ? (
        recording ? (
          <View className="gap-3 rounded-lg border border-border bg-card p-3">
            <View className="flex-row items-center gap-2">
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Amount"
                placeholderTextColor="#94a3b8"
                className="flex-1 h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground"
              />
              <Pressable onPress={() => setAmount(bill.balance_amount)}>
                <Text className="text-xs font-medium text-primary">Use full balance</Text>
              </Pressable>
            </View>
            <Select
              label="Payment mode"
              options={IPD_PAYMENT_MODES}
              value={mode}
              onChange={(v) => setMode(v as BillPaymentMode)}
            />
            <Button title="Record payment" size="sm" onPress={submit} loading={addPayment.isPending} />
          </View>
        ) : (
          <Button title={`Record payment (₹${bill.balance_amount} due)`} variant="outline" onPress={() => setRecording(true)} />
        )
      ) : (
        <Text className="text-sm font-medium text-emerald-600 text-center py-2">Fully paid</Text>
      )}
    </View>
  );
}
