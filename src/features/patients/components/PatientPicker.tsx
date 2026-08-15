/**
 * Reusable search-and-select-or-create used by New Visit and New Admission,
 * matching celiyohms's PatientIntakeStep (toggle between an existing-patient
 * search and a new-patient intake form).
 *
 * Search results render as a plain mapped list, not a FlatList — this
 * component always sits inside an outer form ScrollView, and a
 * VirtualizedList nested in a ScrollView of the same orientation breaks
 * windowing (RN warning) since results are already capped to ~15 rows by
 * the API call, there's nothing to virtualize.
 */
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Input, PhotoPickerField, Select, Button, useToast } from "../../../components/ui";
import { usePatients, useCreatePatient } from "../hooks";
import type { Gender, PatientCreatePayload, PatientListItem } from "../../../types/patients";

interface PatientPickerProps {
  selected: PatientListItem | null;
  onSelect: (patient: PatientListItem | null) => void;
}

type Mode = "search" | "create";

const TITLES = ["Mr", "Mrs", "Ms", "Dr", "Master", "Baby"].map((t) => ({ label: t, value: t }));
const GENDERS: Array<{ label: string; value: Gender }> = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => ({ label: g, value: g }));
const RELATIONS = ["Spouse", "Father", "Mother", "Son", "Daughter", "Sibling", "Friend", "Other"].map((r) => ({
  label: r,
  value: r,
}));

interface NewPatientForm {
  title: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: Gender;
  date_of_birth: string;
  mobile_primary: string;
  blood_group: string | null;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string | null;
  photo_data: string | null;
}

const BLANK_FORM: NewPatientForm = {
  title: "Mr",
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "male",
  date_of_birth: "",
  mobile_primary: "",
  blood_group: null,
  address_line1: "",
  city: "",
  state: "",
  pincode: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: null,
  photo_data: null,
};

export function PatientPicker({ selected, onSelect }: PatientPickerProps) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<NewPatientForm>(BLANK_FORM);
  const [error, setError] = useState<string | null>(null);

  const search = usePatients(query.trim().length >= 2 ? { search: query.trim(), page_size: 15 } : undefined);
  const createPatient = useCreatePatient();

  function set<K extends keyof NewPatientForm>(key: K, value: NewPatientForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (selected) {
    return (
      <Card className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{selected.full_name}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {selected.patient_id} · {selected.gender} · {selected.age ?? "—"}y · {selected.mobile_primary}
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => onSelect(null)} className="px-3 py-1.5">
          <Text className="text-sm font-medium text-primary">Change</Text>
        </Pressable>
      </Card>
    );
  }

  function handleCreate() {
    if (!form.first_name.trim() || !form.last_name.trim()) return setError("First and last name are required");
    if (!form.date_of_birth.trim()) return setError("Date of birth is required");
    if (!form.mobile_primary.trim()) return setError("Mobile number is required");
    if (!form.address_line1.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      return setError("Full address is required");
    }
    if (!form.emergency_contact_name.trim() || !form.emergency_contact_phone.trim() || !form.emergency_contact_relation) {
      return setError("Emergency contact details are required");
    }
    setError(null);

    const payload: PatientCreatePayload = {
      title: form.title,
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || undefined,
      last_name: form.last_name.trim(),
      gender: form.gender,
      date_of_birth: form.date_of_birth.trim(),
      mobile_primary: form.mobile_primary.trim(),
      blood_group: (form.blood_group as PatientCreatePayload["blood_group"]) ?? undefined,
      address_line1: form.address_line1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      emergency_contact_name: form.emergency_contact_name.trim(),
      emergency_contact_phone: form.emergency_contact_phone.trim(),
      emergency_contact_relation: form.emergency_contact_relation ?? "",
      photo_data: form.photo_data ?? undefined,
    };

    createPatient.mutate(payload, {
      onSuccess: (patient) => {
        toast.show("Patient registered", "success");
        onSelect(patient);
        setForm(BLANK_FORM);
      },
      onError: () => toast.show("Couldn't register the patient", "error"),
    });
  }

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setMode("search")}
          className={["flex-1 items-center py-2 rounded-full", mode === "search" ? "bg-primary" : "bg-secondary"].join(" ")}
        >
          <Text className={["text-sm font-medium", mode === "search" ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
            Select Existing
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("create")}
          className={["flex-1 items-center py-2 rounded-full", mode === "create" ? "bg-primary" : "bg-secondary"].join(" ")}
        >
          <Text className={["text-sm font-medium", mode === "create" ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
            New Patient
          </Text>
        </Pressable>
      </View>

      {mode === "search" ? (
        <View className="gap-2">
          <Input
            label="Patient"
            placeholder="Search by name, UHID, or mobile…"
            leftIcon="search-outline"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.trim().length >= 2 ? (
            search.isLoading ? (
              <ActivityIndicator className="py-3" />
            ) : (search.data ?? []).length === 0 ? (
              <View className="items-center gap-1 rounded-lg border border-border bg-card px-4 py-6">
                <Ionicons name="person-remove-outline" size={20} color="#94a3b8" />
                <Text className="text-sm text-muted-foreground text-center">
                  No patient found — switch to "New Patient" to register one.
                </Text>
              </View>
            ) : (
              <View className="rounded-lg border border-border bg-card overflow-hidden">
                {(search.data ?? []).map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      onSelect(item);
                      setQuery("");
                    }}
                    className="px-3 py-2.5 border-b border-border active:bg-accent"
                  >
                    <Text className="text-sm font-medium text-foreground">{item.full_name}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {item.patient_id} · {item.mobile_primary}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )
          ) : null}
        </View>
      ) : (
        <View className="gap-4">
          <PhotoPickerField label="Patient photo" value={form.photo_data} onChange={(v) => set("photo_data", v)} />
          <Select label="Title" options={TITLES} value={form.title} onChange={(v) => set("title", v)} />
          <Input label="First name" value={form.first_name} onChangeText={(v) => set("first_name", v)} />
          <Input label="Middle name" value={form.middle_name} onChangeText={(v) => set("middle_name", v)} />
          <Input label="Last name" value={form.last_name} onChangeText={(v) => set("last_name", v)} />
          <Select label="Gender" options={GENDERS} value={form.gender} onChange={(v) => set("gender", v as Gender)} />
          <Input label="Date of birth (YYYY-MM-DD)" value={form.date_of_birth} onChangeText={(v) => set("date_of_birth", v)} />
          <Input label="Mobile" value={form.mobile_primary} onChangeText={(v) => set("mobile_primary", v)} keyboardType="phone-pad" />
          <Select label="Blood group" options={BLOOD_GROUPS} value={form.blood_group} onChange={(v) => set("blood_group", v)} />
          <Input label="Address" value={form.address_line1} onChangeText={(v) => set("address_line1", v)} multiline />
          <Input label="City" value={form.city} onChangeText={(v) => set("city", v)} />
          <Input label="State" value={form.state} onChangeText={(v) => set("state", v)} />
          <Input label="Pincode" value={form.pincode} onChangeText={(v) => set("pincode", v)} keyboardType="numeric" />
          <Input label="Emergency contact name" value={form.emergency_contact_name} onChangeText={(v) => set("emergency_contact_name", v)} />
          <Input
            label="Emergency contact phone"
            value={form.emergency_contact_phone}
            onChangeText={(v) => set("emergency_contact_phone", v)}
            keyboardType="phone-pad"
          />
          <Select
            label="Emergency contact relation"
            options={RELATIONS}
            value={form.emergency_contact_relation}
            onChange={(v) => set("emergency_contact_relation", v)}
          />
          {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
          <Button title="Register patient" onPress={handleCreate} loading={createPatient.isPending} />
        </View>
      )}
    </View>
  );
}
