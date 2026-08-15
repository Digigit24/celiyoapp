/**
 * Ported from celiyohms/src/features/clinical/components/EmrWorkspace.tsx —
 * embedded-only (mobile screens already provide chrome; the standalone
 * routed mode from web isn't needed). Owns values/dirty-tracking/validation
 * and wires useAutosave + the AsyncStorage draft buffer + save/complete/
 * lock/print actions, mirroring web's flushNow-before-every-navigation flow.
 * Also covers repeatable-form rounds (progress/monitoring-chart occurrences),
 * batch print, value templates, and Import from OPD — the full action set
 * web exposes here, minus the admin form-structure editor.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, EmptyState, useToast } from "../../../components/ui";
import type { EntityType } from "../../../types/clinical";
import type { PrintPreviewNavigation } from "../screens/PrintPreviewScreen";
import { importFromOpd } from "../../../lib/api/clinical";
import {
  useBulkUpsertValues,
  useCompleteRecord,
  useCreateRecord,
  useEncounterForms,
  useFormStructure,
  useLockRecord,
  useRecord,
  useUnlockRecord,
} from "../hooks";
import {
  buildInitialValues,
  buildUpsertPayloadForKeys,
  formPrintTemplateCode,
  validateRequiredFields,
} from "../lib/fieldMapping";
import { useAutosave } from "../lib/useAutosave";
import { clearDraftBuffer, draftBufferKey, readDraftBuffer, writeDraftBuffer } from "../lib/draftBuffer";
import { AUTOSAVE_CONFIG } from "../lib/autosaveConfig";
import { ClinicalFormRenderer } from "./ClinicalFormRenderer";
import { EmrSaveIndicator } from "./EmrSaveIndicator";
import { EmrFormRail } from "./EmrFormRail";
import { EmrRoundPills } from "./EmrRoundPills";
import { EmrBatchPrintModal } from "./EmrBatchPrintModal";
import { EmrTemplatesModal } from "./EmrTemplatesModal";

interface EmrWorkspaceProps {
  encounterType: EntityType;
  encounterId: number;
  formCode: string;
  onSelectForm: (formCode: string) => void;
  encounterContext?: Record<string, unknown>;
  banner: {
    patientName?: string;
    patientId?: string;
    encounterLabel?: string;
    date?: string;
    doctorName?: string;
  };
}

export function EmrWorkspace({
  encounterType,
  encounterId,
  formCode,
  onSelectForm,
  encounterContext,
  banner,
}: EmrWorkspaceProps) {
  const toast = useToast();
  const navigation = useNavigation() as unknown as PrintPreviewNavigation;
  const encounterForms = useEncounterForms(encounterType, encounterId);
  const activeState = encounterForms.data?.find((s) => s.form.code === formCode);
  const activeForm = activeState?.form;
  const occurrences = activeState?.occurrences ?? [];
  const isRepeatable = Boolean(activeState?.repeatable);

  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const resolvedRecordId = selectedRecordId ?? activeState?.record_id ?? null;

  const structureQuery = useFormStructure(activeForm?.id);
  const recordQuery = useRecord(resolvedRecordId);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [railOpen, setRailOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [batchPrintOpen, setBatchPrintOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  const [importing, setImporting] = useState(false);

  const dirtyKeysRef = useRef<Set<string>>(new Set());
  const recordIdRef = useRef<number | null>(resolvedRecordId);
  const ensureRecordPromiseRef = useRef<Promise<number> | null>(null);
  recordIdRef.current = resolvedRecordId;

  useEffect(() => {
    setSelectedRecordId(null);
  }, [formCode, encounterId]);

  const record = recordQuery.data;
  const isLocked = Boolean(record?.is_locked);
  const isCompleted = record?.status === "completed";
  const readOnly = isLocked || isCompleted;

  const occurrence = resolvedRecordId ? String(resolvedRecordId) : "draft";
  const bufferKey = draftBufferKey(encounterType, encounterId, formCode, occurrence);

  // Hydrate values from the record, overlaying a newer local draft buffer if one exists.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverValues = buildInitialValues(record);
      const buffer = await readDraftBuffer(bufferKey);
      if (cancelled) return;
      if (buffer && (!record || new Date(buffer.savedAt) > new Date(record.updated_at))) {
        setValues({ ...serverValues, ...buffer.values });
        dirtyKeysRef.current = new Set(buffer.dirtyKeys);
        toast.show("Restored unsaved changes from this device", "info");
      } else {
        setValues(serverValues);
        dirtyKeysRef.current = new Set();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id, bufferKey]);

  const scheduleBufferWrite = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void writeDraftBuffer(bufferKey, {
          values,
          dirtyKeys: Array.from(dirtyKeysRef.current),
          savedAt: new Date().toISOString(),
        });
      }, AUTOSAVE_CONFIG.BUFFER_THROTTLE_MS);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bufferKey, values]);

  const createRecordMutation = useCreateRecord();
  const bulkUpsert = useBulkUpsertValues();
  const completeRecordMutation = useCompleteRecord();
  const lockRecordMutation = useLockRecord();
  const unlockRecordMutation = useUnlockRecord();

  const ensureRecord = useCallback(async (): Promise<number> => {
    if (recordIdRef.current) return recordIdRef.current;
    if (ensureRecordPromiseRef.current) return ensureRecordPromiseRef.current;
    if (!activeForm) throw new Error("No active form");
    const promise = createRecordMutation
      .mutateAsync({ form: activeForm.id, encounter_type: encounterType, encounter_id: encounterId })
      .then((created) => {
        recordIdRef.current = created.id;
        setSelectedRecordId(created.id);
        return created.id;
      })
      .finally(() => {
        ensureRecordPromiseRef.current = null;
      });
    ensureRecordPromiseRef.current = promise;
    return promise;
  }, [activeForm, createRecordMutation, encounterId, encounterType]);

  const performAutosave = useCallback(async (): Promise<"ok" | "error"> => {
    if (!structureQuery.data) return "error";
    const keysSnapshot = Array.from(dirtyKeysRef.current);
    dirtyKeysRef.current = new Set();
    try {
      const id = await ensureRecord();
      const upsertItems = buildUpsertPayloadForKeys(structureQuery.data, values, keysSnapshot);
      if (upsertItems.length === 0) {
        await clearDraftBuffer(bufferKey);
        return "ok";
      }
      await bulkUpsert.mutateAsync({ recordId: id, payload: { values: upsertItems }, silent: true });
      if (dirtyKeysRef.current.size === 0) {
        await clearDraftBuffer(bufferKey);
      } else {
        await writeDraftBuffer(bufferKey, {
          values,
          dirtyKeys: Array.from(dirtyKeysRef.current),
          savedAt: new Date().toISOString(),
        });
      }
      return "ok";
    } catch {
      keysSnapshot.forEach((k) => dirtyKeysRef.current.add(k));
      await writeDraftBuffer(bufferKey, {
        values,
        dirtyKeys: Array.from(dirtyKeysRef.current),
        savedAt: new Date().toISOString(),
      });
      return "error";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bufferKey, bulkUpsert, ensureRecord, structureQuery.data, values]);

  const autosave = useAutosave({
    enabled: Boolean(structureQuery.data) && !readOnly,
    hasPendingChanges: () => dirtyKeysRef.current.size > 0,
    performSave: performAutosave,
    onPersistentFailure: () => toast.show("Changes are saved on this device but haven't synced yet", "error"),
  });

  const handleValuesChange = useCallback(
    (fieldKey: string, value: unknown, opts?: { isDefaultApply?: boolean }) => {
      setValues((prev) => ({ ...prev, [fieldKey]: value }));
      if (!opts?.isDefaultApply) {
        dirtyKeysRef.current.add(fieldKey);
        autosave.scheduleSave();
        scheduleBufferWrite();
      }
    },
    [autosave, scheduleBufferWrite]
  );

  async function handleSelectForm(code: string) {
    await autosave.flushNow();
    setRailOpen(false);
    onSelectForm(code);
  }

  async function handleComplete() {
    if (!structureQuery.data) return;
    const errors = validateRequiredFields(structureQuery.data, values);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.show("Fill in the required fields before completing", "error");
      return;
    }
    setValidationErrors({});
    await autosave.flushNow();
    try {
      const id = await ensureRecord();
      await completeRecordMutation.mutateAsync(id);
      toast.show("Form completed", "success");
    } catch {
      toast.show("Couldn't complete the form — try again", "error");
    }
  }

  async function handleLockToggle() {
    if (!resolvedRecordId) return;
    await autosave.flushNow();
    try {
      if (isLocked) {
        await unlockRecordMutation.mutateAsync(resolvedRecordId);
      } else {
        await lockRecordMutation.mutateAsync(resolvedRecordId);
      }
    } catch {
      toast.show("Couldn't update the lock state", "error");
    }
  }

  function handlePrint() {
    const id = resolvedRecordId;
    if (!id || !activeForm) {
      toast.show("Save the form before printing", "error");
      return;
    }
    setMoreOpen(false);
    void autosave.flushNow().then(() => {
      navigation.navigate("PrintPreview", {
        formCode: formPrintTemplateCode(activeForm),
        recordId: id,
        title: activeForm.name,
      });
    });
  }

  async function handleSave() {
    setMoreOpen(false);
    await autosave.flushNow();
    toast.show("Saved", "success");
  }

  async function handleCreateNextRound() {
    if (!activeForm) return;
    setCreatingRound(true);
    await autosave.flushNow();
    try {
      const created = await createRecordMutation.mutateAsync({
        form: activeForm.id,
        encounter_type: encounterType,
        encounter_id: encounterId,
      });
      recordIdRef.current = created.id;
      setSelectedRecordId(created.id);
    } catch {
      toast.show("Couldn't create a new round", "error");
    } finally {
      setCreatingRound(false);
    }
  }

  async function handleImportFromOpd() {
    setMoreOpen(false);
    setImporting(true);
    await autosave.flushNow();
    try {
      const id = await ensureRecord();
      await importFromOpd(id, false);
      await recordQuery.refetch();
      toast.show("Imported from the patient's latest OPD visit", "success");
    } catch {
      toast.show("Couldn't import — the patient may have no OPD record", "error");
    } finally {
      setImporting(false);
    }
  }

  function handleApplyTemplate(templateValues: Record<string, unknown>) {
    Object.entries(templateValues).forEach(([key, value]) => handleValuesChange(key, value));
    toast.show("Template applied", "success");
  }

  if (encounterForms.isLoading || structureQuery.isLoading) {
    return (
      <View className="items-center justify-center py-12">
        <ActivityIndicator />
      </View>
    );
  }

  if (!activeState) {
    return (
      <EmptyState
        icon="document-text-outline"
        title="No forms available"
        message="This encounter has no clinical forms configured yet."
      />
    );
  }

  return (
    <View className="flex-1 gap-3">
      <View className="flex-row items-center justify-between gap-2 px-4 pt-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {activeForm?.name}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <EmrSaveIndicator status={readOnly ? "idle" : autosave.status} />
            {isLocked ? <Badge label="Locked" variant="destructive" /> : null}
            {isCompleted ? <Badge label="Completed" variant="success" /> : null}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setRailOpen(true)}
          className="h-9 px-3 flex-row items-center gap-1.5 rounded-lg border border-input bg-card"
        >
          <Ionicons name="list-outline" size={16} color="#0f172a" />
          <Text className="text-sm font-medium text-foreground">Forms</Text>
        </Pressable>
      </View>

      {isRepeatable ? (
        <EmrRoundPills
          occurrences={occurrences}
          selectedRecordId={resolvedRecordId}
          onSelect={setSelectedRecordId}
          onCreateNext={handleCreateNextRound}
          creating={creatingRound}
        />
      ) : null}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        <ClinicalFormRenderer
          structure={structureQuery.data}
          values={values}
          onChange={handleValuesChange}
          disabled={readOnly}
          errors={validationErrors}
          encounter={{ ...banner, ...encounterContext }}
        />
      </ScrollView>

      <View className="flex-row gap-2 px-4 pb-3 pt-2 border-t border-border bg-background shadow-lg shadow-black/10">
        <View className="flex-1">
          <Button
            title={isLocked ? "Unlock" : "Lock"}
            variant="outline"
            size="sm"
            onPress={handleLockToggle}
            disabled={!resolvedRecordId}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Complete"
            size="sm"
            onPress={handleComplete}
            disabled={readOnly || completeRecordMutation.isPending}
            loading={completeRecordMutation.isPending}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMoreOpen(true)}
          className="h-9 w-11 items-center justify-center rounded-lg border border-input bg-card"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#0f172a" />
        </Pressable>
      </View>

      <EmrFormRail
        visible={railOpen}
        onClose={() => setRailOpen(false)}
        forms={encounterForms.data ?? []}
        activeFormCode={formCode}
        onSelect={handleSelectForm}
      />

      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setMoreOpen(false)}>
          <Pressable className="bg-popover rounded-t-2xl pb-6" onPress={(e) => e.stopPropagation()}>
            <View className="items-center pt-2 pb-1">
              <View className="h-1 w-10 rounded-full bg-border" />
            </View>
            <MoreActionRow icon="save-outline" label="Save" onPress={handleSave} disabled={readOnly} />
            <MoreActionRow icon="print-outline" label="Print" onPress={handlePrint} disabled={!resolvedRecordId} />
            {isRepeatable && occurrences.length > 0 ? (
              <MoreActionRow
                icon="copy-outline"
                label="Print Multiple"
                onPress={() => {
                  setMoreOpen(false);
                  setBatchPrintOpen(true);
                }}
              />
            ) : null}
            <MoreActionRow
              icon="bookmark-outline"
              label="Templates"
              onPress={() => {
                setMoreOpen(false);
                setTemplatesOpen(true);
              }}
              disabled={readOnly || !activeForm}
            />
            {encounterType === "ipd_admission" ? (
              <MoreActionRow
                icon="download-outline"
                label="Import from OPD"
                onPress={handleImportFromOpd}
                disabled={readOnly || importing}
                loading={importing}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {isRepeatable ? (
        <EmrBatchPrintModal
          visible={batchPrintOpen}
          onClose={() => setBatchPrintOpen(false)}
          formCode={formPrintTemplateCode(activeForm)}
          occurrences={occurrences}
        />
      ) : null}

      {activeForm ? (
        <EmrTemplatesModal
          visible={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          formId={activeForm.id}
          currentValues={values}
          onApply={handleApplyTemplate}
        />
      ) : null}
    </View>
  );
}

function MoreActionRow({
  icon,
  label,
  onPress,
  disabled,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className={["flex-row items-center gap-3 px-5 py-3.5", disabled ? "opacity-40" : "active:bg-accent"].join(" ")}
    >
      {loading ? <ActivityIndicator size="small" /> : <Ionicons name={icon} size={20} color="#0f172a" />}
      <Text className="text-base text-popover-foreground">{label}</Text>
    </Pressable>
  );
}
