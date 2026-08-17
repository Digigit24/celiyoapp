import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, FormField, InlineError, Input, Select, useToast } from "../../../components/ui";
import { todayIso } from "../constants";
import { useCreatePayment, usePayment, useUpdatePayment } from "../hooks";
import type { PaymentsStackParamList } from "./PaymentsListScreen";
import { PAYMENT_BILL_TYPE_OPTIONS, PAYMENT_MODE_OPTIONS } from "../../../types/payments";
import type { PaymentBillType, PaymentMode } from "../../../types/payments";

type Props = NativeStackScreenProps<PaymentsStackParamList, "PaymentForm">;

/**
 * Shared create/edit form for a bill payment. In edit mode, `bill_type` and
 * the `opd_bill`/`ipd_bill` linkage are locked — the API technically allows
 * re-linking a settled payment to a different bill, but that's a bad UX we
 * deliberately don't expose; only amount/mode/date/notes are editable.
 */
export function PaymentFormScreen({ route, navigation }: Props) {
  const { paymentId } = route.params;
  const isEdit = Boolean(paymentId);
  const toast = useToast();

  const { data: existing, isLoading: loadingExisting } = usePayment(paymentId);
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();

  const [billType, setBillType] = useState<PaymentBillType>("opd");
  const [opdBill, setOpdBill] = useState("");
  const [ipdBill, setIpdBill] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [patientName, setPatientName] = useState("");
  const [encounterNumber, setEncounterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setBillType(existing.bill_type);
    setOpdBill(existing.opd_bill != null ? String(existing.opd_bill) : "");
    setIpdBill(existing.ipd_bill != null ? String(existing.ipd_bill) : "");
    setBillNumber(existing.bill_number ?? "");
    setPatientName(existing.patient_name ?? "");
    setEncounterNumber(existing.encounter_number ?? "");
    setAmount(existing.amount);
    setPaymentMode(existing.payment_mode);
    setPaymentDate(new Date(existing.payment_date));
    setNotes(existing.notes ?? "");
  }, [existing]);

  function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  function handleSubmit() {
    const trimmedAmount = amount.trim();
    const parsedAmount = Number.parseFloat(trimmedAmount);
    if (!trimmedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setError(null);

    if (isEdit && paymentId) {
      updatePayment.mutate(
        {
          id: paymentId,
          payload: {
            amount: trimmedAmount,
            payment_mode: paymentMode,
            payment_date: toIsoDate(paymentDate),
            notes: notes.trim() || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.show("Payment updated", "success");
            navigation.goBack();
          },
          onError: () => toast.show("Couldn't update the payment", "error"),
        }
      );
      return;
    }

    createPayment.mutate(
      {
        bill_type: billType,
        amount: trimmedAmount,
        opd_bill: billType === "opd" && opdBill.trim() ? Number(opdBill.trim()) : undefined,
        ipd_bill: billType === "ipd" && ipdBill.trim() ? Number(ipdBill.trim()) : undefined,
        bill_number: billNumber.trim() || undefined,
        patient_name: patientName.trim() || undefined,
        encounter_number: encounterNumber.trim() || undefined,
        payment_mode: paymentMode,
        payment_date: toIsoDate(paymentDate),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (payment) => {
          toast.show("Payment recorded", "success");
          navigation.replace("PaymentsDetail", { paymentId: payment.id });
        },
        onError: () => toast.show("Couldn't record the payment", "error"),
      }
    );
  }

  if (isEdit && loadingExisting) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const isPending = createPayment.isPending || updatePayment.isPending;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <FormField label="Bill type" required>
        <Select
          options={PAYMENT_BILL_TYPE_OPTIONS}
          value={billType}
          onChange={(v) => setBillType(v as PaymentBillType)}
          disabled={isEdit}
        />
      </FormField>

      {!isEdit && billType === "opd" ? (
        <Input
          label="OPD bill ID (optional)"
          placeholder="Leave blank for a freestanding payment"
          value={opdBill}
          onChangeText={setOpdBill}
          keyboardType="number-pad"
        />
      ) : null}
      {!isEdit && billType === "ipd" ? (
        <Input
          label="IPD bill ID (optional)"
          placeholder="Leave blank for a freestanding payment"
          value={ipdBill}
          onChangeText={setIpdBill}
          keyboardType="number-pad"
        />
      ) : null}

      {!isEdit ? (
        <>
          <Input label="Bill number (optional)" value={billNumber} onChangeText={setBillNumber} />
          <Input label="Patient name (optional)" value={patientName} onChangeText={setPatientName} />
          <Input
            label="Encounter number (optional)"
            value={encounterNumber}
            onChangeText={setEncounterNumber}
          />
        </>
      ) : null}

      <Input
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <FormField label="Payment mode">
        <Select
          options={PAYMENT_MODE_OPTIONS}
          value={paymentMode}
          onChange={(v) => setPaymentMode(v as PaymentMode)}
        />
      </FormField>

      <FormField label="Payment date">
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          className="flex-row items-center justify-between rounded-lg border border-input bg-card px-3 h-11"
        >
          <Text className="text-base text-foreground">{toIsoDate(paymentDate)}</Text>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
        </Pressable>
      </FormField>
      {pickerOpen ? (
        <DateTimePicker
          value={paymentDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setPickerOpen(false);
            if (event.type === "dismissed" || !date) return;
            setPaymentDate(date);
          }}
        />
      ) : null}

      <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

      <InlineError message={error} />
      <View>
        <Button
          title={isEdit ? "Save changes" : "Record payment"}
          onPress={handleSubmit}
          loading={isPending}
        />
      </View>
      {!isEdit ? (
        <Text className="text-xs text-muted-foreground text-center">
          Leave both bill fields blank to record a freestanding payment with no linked bill.
        </Text>
      ) : null}
    </ScrollView>
  );
}
