import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Badge, Button, TabStrip, useToast } from "../../../components/ui";
import type { OpdStackParamList } from "../../../navigation/OpdStack";
import { useCompleteVisit, useStartVisit, useVisit } from "../hooks";
import { useEncounterForms } from "../../clinical/hooks";
import { useWhatsAppConfig } from "../../whatsapp/hooks";
import { EmrWorkspace } from "../../clinical/components/EmrWorkspace";
import { WhatsAppTab } from "../../ipd/components/tabs/WhatsAppTab";
import { VISIT_STATUS_VARIANT } from "../constants";
import { VitalsTab } from "../components/tabs/VitalsTab";
import { BillingTab } from "../components/tabs/BillingTab";
import { HistoryTab } from "../components/tabs/HistoryTab";
import { FilesTab } from "../components/tabs/FilesTab";
import { ProfileTab } from "../components/tabs/ProfileTab";
import type { VisitDetail } from "../../../types/opd";

type Props = NativeStackScreenProps<OpdStackParamList, "OpdVisitDetail">;
type Tab = "emr" | "vitals" | "billing" | "history" | "files" | "whatsapp" | "profile";

/** Replaces the generic "Visit" title once data loads — patient/visit summary lives in the header, not the body. */
function HeaderTitle({ visit }: { visit: VisitDetail }) {
  return (
    <View style={{ maxWidth: 240 }}>
      <Text numberOfLines={1} className="text-base font-semibold text-foreground">
        {visit.patient_name}
      </Text>
      <Text numberOfLines={1} className="text-xs text-muted-foreground">
        {visit.visit_number} · Dr. {visit.doctor_name ?? "—"}
      </Text>
    </View>
  );
}

export function OpdVisitDetailScreen({ route, navigation }: Props) {
  const { visitId, initialTab } = route.params;
  const toast = useToast();
  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? "emr");
  const visit = useVisit(visitId);
  const encounterForms = useEncounterForms("opd_visit", visitId);
  const whatsAppConfig = useWhatsAppConfig();
  const startVisit = useStartVisit();
  const completeVisit = useCompleteVisit();
  const [formCode, setFormCode] = useState<string | null>(null);

  useEffect(() => {
    if (!formCode && encounterForms.data && encounterForms.data.length > 0) {
      setFormCode(encounterForms.data[0].form.code);
    }
  }, [encounterForms.data, formCode]);

  const v = visit.data;

  useLayoutEffect(() => {
    if (!v) return;
    navigation.setOptions({
      headerTitle: () => <HeaderTitle visit={v} />,
      headerRight: () => (
        <View className="pr-1">
          <Badge label={v.status.replace("_", " ")} variant={VISIT_STATUS_VARIANT[v.status]} />
        </View>
      ),
    });
  }, [navigation, v]);

  if (visit.isLoading || !v) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "emr", label: "EMR" },
    { key: "vitals", label: "Vitals" },
    { key: "billing", label: "Billing" },
    { key: "history", label: "History" },
    { key: "files", label: "Files" },
    ...(whatsAppConfig.configured ? [{ key: "whatsapp" as const, label: "WhatsApp" }] : []),
    { key: "profile", label: "Profile" },
  ];
  const activeTab = tabs.some((t) => t.key === tab) ? tab : "emr";

  return (
    <View className="flex-1 bg-background">
      <View className="py-2.5 border-b border-border bg-card shadow-sm shadow-black/5 z-10">
        <TabStrip tabs={tabs} activeKey={activeTab} onChange={setTab} scrollable />
      </View>

      {activeTab === "emr" ? (
        <View className="flex-1">
          {v.status !== "in_consultation" && v.status !== "completed" ? (
            <View className="px-4 pt-3">
              <Button
                title="Start Consultation"
                variant="outline"
                size="sm"
                loading={startVisit.isPending}
                onPress={() =>
                  startVisit.mutate(v.id, { onError: () => toast.show("Couldn't start the visit", "error") })
                }
              />
            </View>
          ) : null}
          {formCode ? (
            <EmrWorkspace
              encounterType="opd_visit"
              encounterId={visitId}
              formCode={formCode}
              onSelectForm={setFormCode}
              banner={{
                patientName: v.patient_name,
                patientId: v.patient_id,
                doctorName: v.doctor_name ?? undefined,
                date: v.visit_date,
                encounterLabel: v.visit_number,
              }}
            />
          ) : encounterForms.isLoading ? (
            <ActivityIndicator className="mt-6" />
          ) : (
            <ScrollView className="px-4">
              <Text className="text-sm text-muted-foreground text-center mt-6">
                No clinical forms configured for this tenant yet.
              </Text>
            </ScrollView>
          )}
          {v.status !== "completed" ? (
            <View className="px-4 py-3 border-t border-border bg-card">
              <Button
                title="Complete Visit"
                loading={completeVisit.isPending}
                onPress={() =>
                  completeVisit.mutate(
                    { id: v.id },
                    { onError: () => toast.show("Couldn't complete the visit", "error") }
                  )
                }
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {activeTab === "vitals" ? <VitalsTab visitId={visitId} /> : null}
      {activeTab === "billing" ? <BillingTab visitId={visitId} /> : null}
      {activeTab === "history" ? <HistoryTab visitId={visitId} patientId={v.patient} /> : null}
      {activeTab === "files" ? <FilesTab visitId={visitId} /> : null}
      {activeTab === "whatsapp" && whatsAppConfig.configured ? (
        <WhatsAppTab phone={v.patient_mobile} patientName={v.patient_name} />
      ) : null}
      {activeTab === "profile" ? <ProfileTab patientId={v.patient} /> : null}
    </View>
  );
}
