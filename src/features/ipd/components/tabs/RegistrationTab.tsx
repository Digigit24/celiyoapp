/**
 * Merged patient + admission editor — ported from celiyohms's RegistrationTab.
 * Ward/bed allotment only applies here while the admission has no bed yet
 * (matches the backend's guard); once a bed exists, reassignment goes
 * through BedTransferModal instead.
 */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, PhotoPickerField, Select, useToast } from "../../../../components/ui";
import { useBeds, useDoctors, useWards } from "../../../../hooks/masters";
import { useAdmissionRegistration, useUpdateRegistration } from "../../hooks";
import type { RegistrationPatchPayload } from "../../../../types/ipd";
import { BedTransferModal } from "../BedTransferModal";

const TITLES = ["Mr", "Mrs", "Ms", "Dr", "Master", "Baby"].map((t) => ({ label: t, value: t }));
const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => ({ label: g, value: g }));
const MARITAL = ["single", "married", "divorced", "widowed"].map((m) => ({
  label: m[0].toUpperCase() + m.slice(1),
  value: m,
}));
const RELATIONS = ["Wife", "Husband", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Guardian", "Other"].map(
  (r) => ({ label: r, value: r })
);
const ADMISSION_TYPES = [
  { label: "Regular", value: "regular" },
  { label: "Emergency", value: "emergency" },
  { label: "Transfer", value: "transfer" },
  { label: "Readmission", value: "readmission" },
  { label: "Daycare", value: "daycare" },
];

interface FormState {
  admission_date: string;
  admission_type: string;
  reason: string;
  provisional_diagnosis: string;
  reference_doctor_id: string | null;
  notify_reference_doctor: boolean;
  consulting_doctor_ids: string[];
  has_mediclaim: boolean;
  title: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  mobile_primary: string;
  blood_group: string | null;
  marital_status: string | null;
  aadhaar_number: string;
  height: string;
  weight: string;
  address_line1: string;
  photo_data: string | null;
  guardian_first_name: string;
  guardian_middle_name: string;
  guardian_last_name: string;
  guardian_mobile: string;
  guardian_gender: string | null;
  guardian_relation: string | null;
  guardian_address: string;
  guardian_photo_data: string | null;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-4">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name={icon} size={14} color="#2563eb" />
        </View>
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
      </View>
      <View className="gap-4">{children}</View>
    </Card>
  );
}

export function RegistrationTab({ admissionId }: { admissionId: number }) {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const registration = useAdmissionRegistration(admissionId);
  const updateRegistration = useUpdateRegistration();
  const wards = useWards();
  const doctors = useDoctors();

  const [form, setForm] = useState<FormState | null>(null);
  const [allotWardId, setAllotWardId] = useState<string | null>(null);
  const [allotBedId, setAllotBedId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [sameAsPatientAddress, setSameAsPatientAddress] = useState(false);

  const allotBeds = useBeds(allotWardId ?? undefined);

  useEffect(() => {
    if (!registration.data) return;
    const r = registration.data;
    const p = r.patient;
    setForm({
      admission_date: r.admission_date,
      admission_type: r.admission_type,
      reason: r.reason,
      provisional_diagnosis: r.provisional_diagnosis,
      reference_doctor_id: r.reference_doctor_id,
      notify_reference_doctor: r.notify_reference_doctor,
      consulting_doctor_ids: r.consulting_doctor_ids,
      has_mediclaim: r.has_mediclaim,
      title: p.title,
      first_name: p.first_name,
      middle_name: p.middle_name ?? "",
      last_name: p.last_name ?? "",
      gender: p.gender,
      date_of_birth: p.date_of_birth ?? "",
      mobile_primary: p.mobile_primary,
      blood_group: p.blood_group,
      marital_status: p.marital_status,
      aadhaar_number: p.aadhaar_number ?? "",
      height: p.height ?? "",
      weight: p.weight ?? "",
      address_line1: p.address_line1 ?? "",
      photo_data: p.photo_data,
      guardian_first_name: p.guardian_first_name ?? "",
      guardian_middle_name: p.guardian_middle_name ?? "",
      guardian_last_name: p.guardian_last_name ?? "",
      guardian_mobile: p.guardian_mobile ?? "",
      guardian_gender: p.guardian_gender,
      guardian_relation: p.guardian_relation,
      guardian_address: p.guardian_address ?? "",
      guardian_photo_data: p.guardian_photo_data,
    });
  }, [registration.data]);

  if (registration.isLoading || !form) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const r = registration.data!;
  const bmi = form.height && form.weight ? r.patient.bmi : null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleConsultingDoctor(userId: string) {
    if (!form) return;
    const exists = form.consulting_doctor_ids.includes(userId);
    set(
      "consulting_doctor_ids",
      exists ? form.consulting_doctor_ids.filter((id) => id !== userId) : [...form.consulting_doctor_ids, userId]
    );
  }

  function handleAllotBed() {
    if (!allotWardId) return;
    updateRegistration.mutate(
      { id: admissionId, payload: { ward: allotWardId, bed: allotBedId } },
      {
        onSuccess: () => {
          toast.show("Bed allotted", "success");
          setAllotWardId(null);
          setAllotBedId(null);
        },
        onError: () => toast.show("Couldn't allot the bed — it may no longer be available", "error"),
      }
    );
  }

  function handleSave() {
    if (!form) return;
    const payload: RegistrationPatchPayload = {
      admission_date: form.admission_date,
      admission_type: form.admission_type as RegistrationPatchPayload["admission_type"],
      reason: form.reason,
      provisional_diagnosis: form.provisional_diagnosis,
      reference_doctor_id: form.reference_doctor_id,
      notify_reference_doctor: form.notify_reference_doctor,
      consulting_doctor_ids: form.consulting_doctor_ids,
      has_mediclaim: form.has_mediclaim,
      doctor_id: form.consulting_doctor_ids[0],
      patient: {
        title: form.title,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        gender: form.gender,
        date_of_birth: form.date_of_birth || null,
        mobile_primary: form.mobile_primary,
        blood_group: form.blood_group ?? undefined,
        marital_status: form.marital_status ?? undefined,
        aadhaar_number: form.aadhaar_number,
        height: form.height || null,
        weight: form.weight || null,
        address_line1: form.address_line1,
        photo_data: form.photo_data,
        guardian_first_name: form.guardian_first_name,
        guardian_middle_name: form.guardian_middle_name,
        guardian_last_name: form.guardian_last_name,
        guardian_mobile: form.guardian_mobile,
        guardian_gender: form.guardian_gender ?? undefined,
        guardian_relation: form.guardian_relation ?? undefined,
        guardian_address: sameAsPatientAddress ? form.address_line1 : form.guardian_address,
        guardian_photo_data: form.guardian_photo_data,
      },
    };
    updateRegistration.mutate(
      { id: admissionId, payload },
      {
        onSuccess: () => toast.show("Registration saved", "success"),
        onError: () => toast.show("Failed to save registration", "error"),
      }
    );
  }

  const wardOptions = (wards.data ?? []).map((w) => ({ label: `${w.name} (${w.available_beds_count} free)`, value: w.id }));
  const allotBedOptions = (allotBeds.data ?? [])
    .filter((b) => !b.is_occupied)
    .map((b) => ({ label: `Bed ${b.bed_number}`, value: b.id }));
  const doctorOptions = (doctors.data ?? []).map((d) => ({ label: d.full_name, value: d.user_id }));
  const consultingDoctors = (doctors.data ?? []).filter((d) => form.consulting_doctor_ids.includes(d.user_id));

  return (
    <View className="flex-1">
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
      <Section title="Ward / Bed" icon="bed-outline">
        {r.bed ? (
          <>
            <Text className="text-sm text-foreground">
              {r.ward ? wards.data?.find((w) => w.id === r.ward)?.name : "—"} — Bed {r.bed}
            </Text>
            <Button title="Transfer" variant="outline" size="sm" onPress={() => setTransferOpen(true)} />
          </>
        ) : (
          <>
            <Select
              label="Ward"
              placeholder="Select ward"
              options={wardOptions}
              value={allotWardId}
              onChange={(v) => {
                setAllotWardId(v);
                setAllotBedId(null);
              }}
              loading={wards.isLoading}
            />
            <Select
              label="Bed"
              placeholder={allotWardId ? "Select bed" : "Select a ward first"}
              options={allotBedOptions}
              value={allotBedId}
              onChange={setAllotBedId}
              loading={allotBeds.isLoading}
              disabled={!allotWardId}
            />
            <Button
              title="Allot Bed"
              size="sm"
              onPress={handleAllotBed}
              disabled={!allotWardId}
              loading={updateRegistration.isPending}
            />
          </>
        )}
      </Section>

      <Section title="Admission" icon="calendar-outline">
        <Input label="Admission date/time" value={form.admission_date} onChangeText={(v) => set("admission_date", v)} />
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">Type of admission</Text>
          <View className="flex-row flex-wrap gap-2">
            {ADMISSION_TYPES.map((t) => {
              const selected = form.admission_type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => set("admission_type", t.value)}
                  className={["px-3.5 py-2 rounded-full border", selected ? "bg-primary border-primary" : "bg-card border-input"].join(" ")}
                >
                  <Text className={["text-sm font-medium", selected ? "text-primary-foreground" : "text-foreground"].join(" ")}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Section>

      <Section title="Patient" icon="person-outline">
        <PhotoPickerField label="Patient photo" value={form.photo_data} onChange={(v) => set("photo_data", v)} />
        <Select label="Title" options={TITLES} value={form.title} onChange={(v) => set("title", v)} />
        <Input label="First name" value={form.first_name} onChangeText={(v) => set("first_name", v)} />
        <Input label="Middle name" value={form.middle_name} onChangeText={(v) => set("middle_name", v)} />
        <Input label="Last name" value={form.last_name} onChangeText={(v) => set("last_name", v)} />
        <Select label="Gender" options={GENDERS} value={form.gender} onChange={(v) => set("gender", v)} />
        <Input label="Date of birth (YYYY-MM-DD)" value={form.date_of_birth} onChangeText={(v) => set("date_of_birth", v)} />
        <Input label="Mobile" value={form.mobile_primary} onChangeText={(v) => set("mobile_primary", v)} keyboardType="phone-pad" />
        <Select label="Blood group" options={BLOOD_GROUPS} value={form.blood_group} onChange={(v) => set("blood_group", v)} />
        <Select label="Marital status" options={MARITAL} value={form.marital_status} onChange={(v) => set("marital_status", v)} />
        <Input label="Aadhaar number" value={form.aadhaar_number} onChangeText={(v) => set("aadhaar_number", v)} />
        <Input label="Height (cm)" value={form.height} onChangeText={(v) => set("height", v)} keyboardType="numeric" />
        <Input label="Weight (kg)" value={form.weight} onChangeText={(v) => set("weight", v)} keyboardType="numeric" />
        {bmi ? <Text className="text-xs text-muted-foreground">BMI: {bmi}</Text> : null}
        <Input label="Address" value={form.address_line1} onChangeText={(v) => set("address_line1", v)} multiline />
      </Section>

      <Section title="Guardian / Relative" icon="people-outline">
        <PhotoPickerField label="Guardian photo" value={form.guardian_photo_data} onChange={(v) => set("guardian_photo_data", v)} />
        <Input label="First name" value={form.guardian_first_name} onChangeText={(v) => set("guardian_first_name", v)} />
        <Input label="Middle name" value={form.guardian_middle_name} onChangeText={(v) => set("guardian_middle_name", v)} />
        <Input label="Last name" value={form.guardian_last_name} onChangeText={(v) => set("guardian_last_name", v)} />
        <Input label="Mobile" value={form.guardian_mobile} onChangeText={(v) => set("guardian_mobile", v)} keyboardType="phone-pad" />
        <Select label="Gender" options={GENDERS} value={form.guardian_gender} onChange={(v) => set("guardian_gender", v)} />
        <Select label="Relation" options={RELATIONS} value={form.guardian_relation} onChange={(v) => set("guardian_relation", v)} />
        <Pressable
          onPress={() => setSameAsPatientAddress((v) => !v)}
          className="flex-row items-center gap-2"
        >
          <View className={["h-5 w-5 rounded border items-center justify-center", sameAsPatientAddress ? "bg-primary border-primary" : "border-input"].join(" ")} />
          <Text className="text-sm text-foreground">Same as patient address</Text>
        </Pressable>
        {!sameAsPatientAddress ? (
          <Input label="Address" value={form.guardian_address} onChangeText={(v) => set("guardian_address", v)} multiline />
        ) : null}
      </Section>

      <Section title="Doctors & Admission Details" icon="medkit-outline">
        <Select
          label="Reference doctor"
          placeholder="None"
          options={doctorOptions}
          value={form.reference_doctor_id}
          onChange={(v) => set("reference_doctor_id", v)}
          loading={doctors.isLoading}
        />
        <Pressable onPress={() => set("notify_reference_doctor", !form.notify_reference_doctor)} className="flex-row items-center gap-2">
          <View className={["h-5 w-5 rounded border items-center justify-center", form.notify_reference_doctor ? "bg-primary border-primary" : "border-input"].join(" ")} />
          <Text className="text-sm text-foreground">Send SMS to reference doctor</Text>
        </Pressable>

        <View>
          <Text className="text-sm font-medium text-foreground mb-2">Consulting doctor(s)</Text>
          <View className="flex-row flex-wrap gap-2 mb-2">
            {consultingDoctors.map((d) => (
              <Pressable
                key={d.user_id}
                onPress={() => toggleConsultingDoctor(d.user_id)}
                className="flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-1"
              >
                <Text className="text-xs font-medium text-secondary-foreground">{d.full_name}</Text>
                <Text className="text-xs text-secondary-foreground">×</Text>
              </Pressable>
            ))}
          </View>
          <Select
            placeholder="Add doctor…"
            options={doctorOptions.filter((o) => !form.consulting_doctor_ids.includes(o.value))}
            value={null}
            onChange={toggleConsultingDoctor}
            loading={doctors.isLoading}
          />
        </View>

        <Input label="Reason for admission" value={form.reason} onChangeText={(v) => set("reason", v)} multiline />
        <Input label="Provisional diagnosis" value={form.provisional_diagnosis} onChangeText={(v) => set("provisional_diagnosis", v)} multiline />
      </Section>

      <Section title="Mediclaim / TPA Insurance" icon="card-outline">
        <Pressable onPress={() => set("has_mediclaim", !form.has_mediclaim)} className="flex-row items-center gap-2">
          <View className={["h-5 w-5 rounded border items-center justify-center", form.has_mediclaim ? "bg-primary border-primary" : "border-input"].join(" ")} />
          <Text className="text-sm text-foreground">Has mediclaim / insurance</Text>
        </Pressable>
        <Text className="text-xs text-muted-foreground">
          TPA, claim status and reference details are managed on the Mediclaim tab.
        </Text>
      </Section>

    </ScrollView>

      <View
        className="px-4 pt-3 border-t border-border bg-card shadow-lg shadow-black/10"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button title="Save" onPress={handleSave} loading={updateRegistration.isPending} />
      </View>

      <BedTransferModal
        visible={transferOpen}
        onClose={() => setTransferOpen(false)}
        admissionId={admissionId}
        currentBedId={r.bed}
      />
    </View>
  );
}
