import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, InlineError, useToast } from "../../../components/ui";
import { listVisits } from "../../../lib/api/opd";
import { listAdmissions } from "../../../lib/api/ipd";
import { useCreatePrescription } from "../hooks";
import type { PharmacyStackParamList } from "./PharmacyListScreen";
import type { VisitListItem } from "../../../types/opd";
import type { AdmissionListItem } from "../../../types/ipd";

type Props = NativeStackScreenProps<PharmacyStackParamList, "NewPrescription">;

type EncounterKind = "opd" | "ipd";

interface EncounterOption {
  id: number;
  label: string;
  sublabel: string;
}

/** Debounced search over OPD visits or IPD admissions, whichever `kind` is active. */
function EncounterSearchField({
  kind,
  onPick,
}: {
  kind: EncounterKind;
  onPick: (option: EncounterOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EncounterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery("");
    setResults([]);
  }, [kind]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  function handleChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (kind === "opd") {
          const res = await listVisits({ search: text.trim(), page_size: 15 });
          setResults(
            res.results.map((v: VisitListItem) => ({
              id: v.id,
              label: v.patient_name,
              sublabel: `${v.visit_number} · ${v.visit_date}`,
            }))
          );
        } else {
          const res = await listAdmissions({ search: text.trim(), page_size: 15 });
          setResults(
            res.results.map((a: AdmissionListItem) => ({
              id: a.id,
              label: a.patient_name,
              sublabel: `${a.admission_id} · ${a.ward_name}`,
            }))
          );
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }

  return (
    <View className="gap-1">
      <TextInput
        value={query}
        onChangeText={handleChange}
        placeholder={kind === "opd" ? "Search OPD visits by patient…" : "Search IPD admissions by patient…"}
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      {loading || results.length > 0 ? (
        <View className="rounded-lg border border-border bg-popover overflow-hidden">
          {loading ? (
            <View className="p-3">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            results.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  onPick(opt);
                  setQuery("");
                  setResults([]);
                }}
                className="flex-row items-center justify-between px-3 py-2.5 border-b border-border active:bg-accent"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-sm text-popover-foreground" numberOfLines={1}>
                    {opt.label}
                  </Text>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {opt.sublabel}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

export function NewPrescriptionScreen({ navigation }: Props) {
  const toast = useToast();
  const [kind, setKind] = useState<EncounterKind>("opd");
  const [encounter, setEncounter] = useState<EncounterOption | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createPrescription = useCreatePrescription();

  function handleSubmit() {
    if (!encounter) {
      setError("Search and select an OPD visit or IPD admission first");
      return;
    }
    setError(null);
    createPrescription.mutate(
      {
        encounter_type: kind === "opd" ? "opd.visit" : "ipd.admission",
        encounter_id: encounter.id,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (prescription) => {
          toast.show("Prescription created", "success");
          navigation.replace("PharmacyDetail", { prescriptionId: prescription.id });
        },
        onError: () => toast.show("Couldn't create the prescription", "error"),
      }
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-foreground">Encounter type</Text>
        <View className="flex-row gap-2">
          {(["opd", "ipd"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                setKind(k);
                setEncounter(null);
              }}
              className={["flex-1 h-11 items-center justify-center rounded-lg border", kind === k ? "bg-primary border-primary" : "bg-card border-input"].join(
                " "
              )}
            >
              <Text className={kind === k ? "text-primary-foreground font-semibold" : "text-foreground font-medium"}>
                {k === "opd" ? "OPD Visit" : "IPD Admission"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-foreground">
          {kind === "opd" ? "OPD visit" : "IPD admission"}
        </Text>
        <EncounterSearchField kind={kind} onPick={setEncounter} />
        {encounter ? (
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 mt-1">
            <View className="flex-1 pr-2">
              <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                {encounter.label}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {encounter.sublabel}
              </Text>
            </View>
            <Pressable onPress={() => setEncounter(null)} hitSlop={8}>
              <Text className="text-xs font-semibold text-primary">Change</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-foreground">Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes for the pharmacy team"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
          className="min-h-[80px] rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground"
          textAlignVertical="top"
        />
      </View>

      <InlineError message={error} />

      <View>
        <Button title="Create prescription" onPress={handleSubmit} loading={createPrescription.isPending} />
      </View>
      <Text className="text-xs text-muted-foreground text-center">
        Drugs are added on the next screen — the prescribing doctor is set automatically from your account.
      </Text>
    </ScrollView>
  );
}
