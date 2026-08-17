import React, { useLayoutEffect } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Card, Chip, KeyValueRow, SectionHeader, useToast } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import { BILL_TYPE_CHIP_VARIANT, formatINR, formatPaymentDate, PAYMENT_METHOD_LABELS } from "../constants";
import { useDeletePayment, usePayment } from "../hooks";
import type { PaymentsStackParamList } from "./PaymentsListScreen";

type Props = NativeStackScreenProps<PaymentsStackParamList, "PaymentsDetail">;

export function PaymentsDetailScreen({ route, navigation }: Props) {
  const { paymentId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can("hms.payments.edit");
  const canDelete = can("hms.payments.delete");

  const { data: payment, isLoading, isError } = usePayment(paymentId);
  const deletePayment = useDeletePayment();

  useLayoutEffect(() => {
    if (payment) {
      navigation.setOptions({
        title: payment.receipt_number ?? "Payment",
        headerRight: () => (
          <View className="pr-1">
            <Chip label={payment.bill_type_label} variant={BILL_TYPE_CHIP_VARIANT[payment.bill_type]} />
          </View>
        ),
      });
    }
  }, [navigation, payment]);

  function handleDelete() {
    if (!payment) return;
    Alert.alert(
      "Delete this payment?",
      "This is a financial record with no undo — deleting it recalculates the parent bill's payment status.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deletePayment.mutate(payment.id, {
              onSuccess: () => {
                toast.show("Payment deleted", "success");
                navigation.goBack();
              },
              onError: () => toast.show("Couldn't delete the payment", "error"),
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

  if (!payment || isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">Payment not found</Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          It may have been deleted, or there was a problem loading it. Try going back to the list.
        </Text>
      </View>
    );
  }

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
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {payment.patient_name || "Freestanding payment"}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {payment.receipt_number ?? "No receipt number"}
                {payment.encounter_number ? ` · ${payment.encounter_number}` : ""}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip label={payment.bill_type_label} variant={BILL_TYPE_CHIP_VARIANT[payment.bill_type]} />
                <Chip label={PAYMENT_METHOD_LABELS[payment.payment_mode]} variant="neutral" />
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
                {formatINR(payment.amount)}
              </Text>
              <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                {formatPaymentDate(payment.payment_date)}
              </Text>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Bill type" value={payment.bill_type_label} />
            <KeyValueRow label="Payment mode" value={payment.payment_mode_label} />
            <KeyValueRow label="Payment date" value={formatPaymentDate(payment.payment_date)} />
            {payment.bill_number ? (
              <KeyValueRow label="Bill number" value={payment.bill_number} />
            ) : null}
            {payment.opd_bill != null ? (
              <KeyValueRow label="OPD bill #" value={String(payment.opd_bill)} />
            ) : null}
            {payment.ipd_bill != null ? (
              <KeyValueRow label="IPD bill #" value={String(payment.ipd_bill)} />
            ) : null}
            {payment.payment_group_id ? (
              <KeyValueRow label="Payment group" value={payment.payment_group_id} />
            ) : null}
          </View>
        </Card>
      </View>

      {/* Notes */}
      {payment.notes ? (
        <View>
          <SectionHeader title="Notes" />
          <View className="px-4">
            <Card>
              <Text className="text-sm leading-relaxed text-foreground">{payment.notes}</Text>
            </Card>
          </View>
        </View>
      ) : null}

      {/* Record metadata */}
      <View>
        <SectionHeader title="Record" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              {payment.recorded_by_user_id ? (
                <KeyValueRow label="Recorded by" value={payment.recorded_by_user_id} />
              ) : null}
              <KeyValueRow label="Created" value={new Date(payment.created_at).toLocaleString()} />
              <KeyValueRow label="Updated" value={new Date(payment.updated_at).toLocaleString()} />
            </View>
          </Card>
        </View>
      </View>

      {/* Actions */}
      {canEdit || canDelete ? (
        <View className="px-4">
          <View className="flex-row gap-2">
            {canEdit ? (
              <View className="flex-1">
                <Button
                  title="Edit"
                  variant="outline"
                  onPress={() => navigation.navigate("PaymentForm", { paymentId: payment.id })}
                />
              </View>
            ) : null}
            {canDelete ? (
              <View className="flex-1">
                <Button
                  title="Delete"
                  variant="destructive"
                  onPress={handleDelete}
                  loading={deletePayment.isPending}
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
