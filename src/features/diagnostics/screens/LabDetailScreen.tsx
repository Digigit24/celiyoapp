import React, { useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  KeyValueRow,
  Select,
  SectionHeader,
  useToast,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  formatDateTime,
  NEXT_ORDER_STATUS,
  ORDER_STATUS_CHIP_VARIANT,
  ORDER_STATUS_LABELS,
  PRIORITY_CHIP_VARIANT,
  PRIORITY_LABELS,
  RESULT_DATA_KEY,
  RESULT_FLAG_CHIP_VARIANT,
  RESULT_FLAG_LABELS,
} from "../constants";
import {
  useCancelOrder,
  useCollectSample,
  useCreateLabReport,
  useInvestigationRanges,
  useLabReportForOrder,
  useOrder,
  useRequisition,
  useUpdateOrderStatus,
  useVerifyLabReport,
} from "../hooks";
import type { LabStackParamList } from "./LabListScreen";
import type { ResultFlag } from "../../../types/diagnostics";

type Props = NativeStackScreenProps<LabStackParamList, "LabDetail">;

const FLAG_OPTIONS: Array<{ label: string; value: ResultFlag }> = (
  Object.keys(RESULT_FLAG_LABELS) as ResultFlag[]
).map((flag) => ({ label: RESULT_FLAG_LABELS[flag], value: flag }));

export function LabDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can, session } = useAuth();

  const { data: order, isLoading } = useOrder(orderId);
  const requisitionQuery = useRequisition(order?.requisition);
  const requisition = requisitionQuery.data;
  const rangesQuery = useInvestigationRanges(order?.investigation);
  const ranges = rangesQuery.data ?? [];
  const reportQuery = useLabReportForOrder(orderId);
  const report = reportQuery.data;

  const canEdit = can("hms.diagnostics.edit");
  const canEnterResult = can("hms.diagnostics.create");

  const [sampleId, setSampleId] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [resultUnit, setResultUnit] = useState("");
  const [resultFlag, setResultFlag] = useState<ResultFlag | null>(null);
  const [resultNotes, setResultNotes] = useState("");

  const collectSample = useCollectSample();
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const createReport = useCreateLabReport();
  const verifyReport = useVerifyLabReport();

  useLayoutEffect(() => {
    if (order) {
      navigation.setOptions({
        title: order.investigation_name,
        headerRight: () => (
          <View className="pr-1">
            <Chip label={ORDER_STATUS_LABELS[order.status]} variant={ORDER_STATUS_CHIP_VARIANT[order.status]} />
          </View>
        ),
      });
    }
  }, [navigation, order]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">Order not found</Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The order may have been removed. Try going back to the list.
        </Text>
      </View>
    );
  }

  const nextStatus = NEXT_ORDER_STATUS[order.status];
  const isCancellable = order.status !== "completed" && order.status !== "cancelled";
  const range = ranges[0];

  function handleCollectSample() {
    if (!sampleId.trim()) {
      toast.show("Enter a sample id first", "error");
      return;
    }
    collectSample.mutate(
      { id: order!.id, sampleId: sampleId.trim() },
      {
        onSuccess: () => toast.show("Sample collected", "success"),
        onError: () => toast.show("Couldn't record the sample", "error"),
      }
    );
  }

  function handleAdvance() {
    if (!nextStatus) return;
    updateStatus.mutate(
      { id: order!.id, status: nextStatus },
      {
        onSuccess: () => toast.show(`Moved to ${ORDER_STATUS_LABELS[nextStatus]}`, "success"),
        onError: () => toast.show("Couldn't update status", "error"),
      }
    );
  }

  function handleCancel() {
    Alert.alert("Cancel this order?", "This can't be undone.", [
      { text: "Keep order", style: "cancel" },
      {
        text: "Cancel order",
        style: "destructive",
        onPress: () =>
          cancelOrder.mutate(order!.id, {
            onSuccess: () => toast.show("Order cancelled", "success"),
            onError: () => toast.show("Couldn't cancel the order", "error"),
          }),
      },
    ]);
  }

  function handleSubmitResult() {
    if (!resultValue.trim()) {
      toast.show("Enter a result value first", "error");
      return;
    }
    createReport.mutate(
      {
        diagnostic_order: order!.id,
        result_data: {
          [RESULT_DATA_KEY]: {
            value: resultValue.trim(),
            unit: resultUnit.trim() || undefined,
            flag: resultFlag ?? undefined,
            notes: resultNotes.trim() || undefined,
          },
        },
      },
      {
        onSuccess: () => {
          toast.show("Result submitted — order marked completed", "success");
          setResultValue("");
          setResultUnit("");
          setResultFlag(null);
          setResultNotes("");
        },
        onError: () => toast.show("Couldn't submit the result", "error"),
      }
    );
  }

  function handleVerify() {
    if (!report || !session) return;
    verifyReport.mutate(
      { id: report.id, verifiedByUserId: session.userId },
      {
        onSuccess: () => toast.show("Report verified", "success"),
        onError: () => toast.show("Couldn't verify the report", "error"),
      }
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
      keyboardShouldPersistTaps="handled"
    >
      {/* Identity header */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={order.patient_name} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {order.patient_name}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {order.patient_mobile}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip label={ORDER_STATUS_LABELS[order.status]} variant={ORDER_STATUS_CHIP_VARIANT[order.status]} />
                {requisition ? (
                  <Chip
                    label={PRIORITY_LABELS[requisition.priority]}
                    variant={PRIORITY_CHIP_VARIANT[requisition.priority]}
                  />
                ) : null}
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Test" value={order.investigation_name} />
            <KeyValueRow label="Price" value={`₹${order.price}`} />
            {requisition ? <KeyValueRow label="Requisition" value={requisition.requisition_number} /> : null}
            {order.sample_id ? <KeyValueRow label="Sample id" value={order.sample_id} /> : null}
            <KeyValueRow label="Ordered" value={formatDateTime(order.created_at)} />
            <KeyValueRow label="Updated" value={formatDateTime(order.updated_at)} />
          </View>
        </Card>
      </View>

      {requisition?.clinical_notes ? (
        <View className="px-4">
          <Card>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Clinical notes
            </Text>
            <Text className="mt-1 text-sm text-foreground">{requisition.clinical_notes}</Text>
          </Card>
        </View>
      ) : null}

      {/* Sample collection */}
      {order.status === "pending" && canEdit ? (
        <View>
          <SectionHeader title="Collect sample" />
          <View className="px-4 gap-3">
            <Card className="gap-3">
              <Input
                label="Sample id"
                placeholder="e.g. S-10234"
                value={sampleId}
                onChangeText={setSampleId}
                autoCapitalize="characters"
              />
              <Button
                title="Mark sample collected"
                onPress={handleCollectSample}
                loading={collectSample.isPending}
              />
            </Card>
          </View>
        </View>
      ) : null}

      {/* Status progression (sample_collected → processing) */}
      {order.status !== "pending" && nextStatus && order.status !== "processing" && canEdit ? (
        <View className="px-4">
          <Card className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-foreground">
                Advance to {ORDER_STATUS_LABELS[nextStatus]}
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                Forward-only — there's no way to go back once advanced.
              </Text>
            </View>
            <Button
              title="Advance"
              variant="secondary"
              fullWidth={false}
              onPress={handleAdvance}
              loading={updateStatus.isPending}
            />
          </Card>
        </View>
      ) : null}

      {/* Reference range (informational, once processing) */}
      {(order.status === "processing" || order.status === "sample_collected") && range ? (
        <View className="px-4">
          <Card>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Reference range
            </Text>
            <Text className="mt-1 text-sm text-foreground">
              {range.normal_range_text ??
                (range.min_value && range.max_value
                  ? `${range.min_value} – ${range.max_value} ${range.unit ?? ""}`.trim()
                  : "Not available")}
            </Text>
          </Card>
        </View>
      ) : null}

      {/* Result entry — processing only, before a report exists */}
      {order.status === "processing" && canEnterResult && !report ? (
        <View>
          <SectionHeader title="Enter result" />
          <View className="px-4">
            <Card className="gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Value" value={resultValue} onChangeText={setResultValue} />
                </View>
                <View className="flex-1">
                  <Input label="Unit" value={resultUnit} onChangeText={setResultUnit} />
                </View>
              </View>
              <Select
                label="Flag"
                placeholder="Select a flag (optional)"
                options={FLAG_OPTIONS}
                value={resultFlag}
                onChange={(v) => setResultFlag(v as ResultFlag)}
              />
              <Input label="Notes" value={resultNotes} onChangeText={setResultNotes} multiline />
              <Button title="Submit result" onPress={handleSubmitResult} loading={createReport.isPending} />
            </Card>
          </View>
        </View>
      ) : null}

      {/* Report — once it exists */}
      {report ? (
        <View>
          <SectionHeader title="Report" />
          <View className="px-4">
            <Card padded={false}>
              <View className="px-1">
                {Object.entries(report.result_data).map(([key, entry], i, arr) => (
                  <View key={key}>
                    <View className="px-3 py-2.5">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-foreground">
                          {entry.value}
                          {entry.unit ? ` ${entry.unit}` : ""}
                        </Text>
                        {entry.flag ? (
                          <Chip
                            label={RESULT_FLAG_LABELS[entry.flag]}
                            variant={RESULT_FLAG_CHIP_VARIANT[entry.flag]}
                          />
                        ) : null}
                      </View>
                      {entry.notes ? (
                        <Text className="mt-0.5 text-xs text-muted-foreground">{entry.notes}</Text>
                      ) : null}
                    </View>
                    {i < arr.length - 1 ? <View className="h-px bg-border/60" /> : null}
                  </View>
                ))}
              </View>
              <View className="border-t border-border/60 px-1">
                <KeyValueRow label="Reported" value={formatDateTime(report.created_at)} />
                {report.verified_by ? (
                  <>
                    <KeyValueRow label="Verified by" value={report.verified_by} />
                    <KeyValueRow label="Verified at" value={formatDateTime(report.verified_at)} />
                  </>
                ) : (
                  <View className="px-3 pb-3">
                    <Button
                      title="Verify report"
                      variant="secondary"
                      onPress={handleVerify}
                      loading={verifyReport.isPending}
                      disabled={!canEdit}
                    />
                  </View>
                )}
              </View>
            </Card>
          </View>
        </View>
      ) : null}

      {/* Cancel */}
      {isCancellable && canEdit ? (
        <View className="px-4">
          <Button
            title="Cancel order"
            variant="destructive"
            onPress={handleCancel}
            loading={cancelOrder.isPending}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
