/** Ported from src/features/ipd/components/tabs/BillingTab.tsx — OPD supports multiple independent bills per visit, same as IPD. */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, EmptyState, useToast } from "../../../../components/ui";
import { useCreateOpdBill, useOpdBills } from "../../hooks";
import { BillDetailCard } from "../billing/BillDetailCard";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1" padded>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-base font-semibold text-foreground mt-0.5">{value}</Text>
    </Card>
  );
}

export function BillingTab({ visitId }: { visitId: number }) {
  const toast = useToast();
  const bills = useOpdBills(visitId);
  const createBill = useCreateOpdBill(visitId);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedBillId && bills.data && bills.data.length > 0) {
      setSelectedBillId(bills.data[0].id);
    }
  }, [bills.data, selectedBillId]);

  if (bills.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const list = bills.data ?? [];
  const selected = list.find((b) => b.id === selectedBillId) ?? list[0] ?? null;

  const totalPayable = list.reduce((sum, b) => sum + Number(b.payable_amount), 0);
  const totalPaid = list.reduce((sum, b) => sum + Number(b.received_amount), 0);
  const totalBalance = list.reduce((sum, b) => sum + Number(b.balance_amount), 0);

  function handleCreateBill() {
    createBill.mutate(undefined, {
      onSuccess: (bill) => setSelectedBillId(bill.id),
      onError: () => toast.show("Couldn't create a bill", "error"),
    });
  }

  if (list.length === 0) {
    return (
      <View className="flex-1">
        <EmptyState
          icon="receipt-outline"
          title="No bills yet"
          action={<Button title="Create Bill" onPress={handleCreateBill} loading={createBill.isPending} />}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
      <View className="flex-row gap-2">
        <StatCard label="Bills" value={String(list.length)} />
        <StatCard label="Payable" value={`₹${totalPayable.toFixed(0)}`} />
        <StatCard label="Paid" value={`₹${totalPaid.toFixed(0)}`} />
        <StatCard label="Balance" value={`₹${totalBalance.toFixed(0)}`} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {list.map((b) => {
            const active = b.id === selected?.id;
            return (
              <Pressable
                key={b.id}
                onPress={() => setSelectedBillId(b.id)}
                className={["rounded-full px-3.5 py-2", active ? "bg-primary" : "bg-secondary"].join(" ")}
              >
                <Text className={["text-sm font-medium", active ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
                  {b.bill_number} · ₹{b.payable_amount}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={handleCreateBill}
            className="rounded-full px-3.5 py-2 border border-dashed border-input items-center justify-center"
          >
            <Text className="text-sm font-medium text-primary">+ New Bill</Text>
          </Pressable>
        </View>
      </ScrollView>

      {selected ? <BillDetailCard bill={selected} visitId={visitId} /> : null}
    </ScrollView>
  );
}
