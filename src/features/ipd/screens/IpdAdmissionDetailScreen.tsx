import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Badge, TabStrip } from "../../../components/ui";
import type { IpdStackParamList } from "../../../navigation/IpdStack";
import { useAdmission } from "../hooks";
import { useEncounterForms } from "../../clinical/hooks";
import { EmrWorkspace } from "../../clinical/components/EmrWorkspace";
import { ADMISSION_STATUS_VARIANT } from "../constants";
import { RegistrationTab } from "../components/tabs/RegistrationTab";
import { BillingTab } from "../components/tabs/BillingTab";
import { DischargeTab } from "../components/tabs/DischargeTab";
import { ConsentsTab } from "../components/tabs/ConsentsTab";
import { MediclaimTab } from "../components/tabs/MediclaimTab";
import { WhatsAppTab } from "../components/tabs/WhatsAppTab";
import { useWhatsAppConfig } from "../../whatsapp/hooks";
import type { AdmissionDetail } from "../../../types/ipd";

type Props = NativeStackScreenProps<IpdStackParamList, "IpdAdmissionDetail">;
type Tab = "registration" | "emr" | "billing" | "discharge" | "documents" | "mediclaim" | "whatsapp";

/** Replaces the generic "Admission" title once data loads — patient/admission summary lives in the header, not the body. */
function HeaderTitle({ admission }: { admission: AdmissionDetail }) {
  return (
    <View style={{ maxWidth: 240 }}>
      <Text numberOfLines={1} className="text-base font-semibold text-foreground">
        {admission.patient_name}
      </Text>
      <Text numberOfLines={1} className="text-xs text-muted-foreground">
        {admission.admission_id} · {admission.ward_name}
        {admission.bed_number ? ` / Bed ${admission.bed_number}` : ""}
      </Text>
    </View>
  );
}

export function IpdAdmissionDetailScreen({ route, navigation }: Props) {
  const { admissionId, initialTab } = route.params;
  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? "registration");
  const admission = useAdmission(admissionId);
  const encounterForms = useEncounterForms("ipd_admission", admissionId);
  const whatsAppConfig = useWhatsAppConfig();
  const [formCode, setFormCode] = useState<string | null>(null);

  useEffect(() => {
    if (!formCode && encounterForms.data && encounterForms.data.length > 0) {
      setFormCode(encounterForms.data[0].form.code);
    }
  }, [encounterForms.data, formCode]);

  const a = admission.data;

  useLayoutEffect(() => {
    if (!a) return;
    navigation.setOptions({
      headerTitle: () => <HeaderTitle admission={a} />,
      headerRight: () => (
        <View className="pr-1">
          <Badge label={a.status} variant={ADMISSION_STATUS_VARIANT[a.status]} />
        </View>
      ),
    });
  }, [navigation, a]);

  if (admission.isLoading || !a) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "registration", label: "Registration" },
    { key: "emr", label: "EMR" },
    { key: "billing", label: "Billing" },
    { key: "discharge", label: "Discharge" },
    { key: "documents", label: "Consents" },
    ...(a.has_mediclaim ? [{ key: "mediclaim" as const, label: "Mediclaim" }] : []),
    ...(whatsAppConfig.configured ? [{ key: "whatsapp" as const, label: "WhatsApp" }] : []),
  ];
  const activeTab = tabs.some((t) => t.key === tab) ? tab : "registration";

  return (
    <View className="flex-1 bg-background">
      <View className="py-2.5 border-b border-border bg-card shadow-sm shadow-black/5 z-10">
        <TabStrip tabs={tabs} activeKey={activeTab} onChange={setTab} scrollable />
      </View>

      {activeTab === "registration" ? <RegistrationTab admissionId={admissionId} /> : null}

      {activeTab === "emr" ? (
        <View className="flex-1">
          {formCode ? (
            <EmrWorkspace
              encounterType="ipd_admission"
              encounterId={admissionId}
              formCode={formCode}
              onSelectForm={setFormCode}
              encounterContext={{
                uhid: a.patient_id_display,
                ipd_no: a.admission_id,
                doa: a.admission_date,
                consulting_doctor: a.doctor_id,
              }}
              banner={{
                patientName: a.patient_name,
                patientId: a.patient_id_display,
                encounterLabel: a.admission_id,
                date: a.admission_date,
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
        </View>
      ) : null}

      {activeTab === "billing" ? <BillingTab admissionId={admissionId} /> : null}
      {activeTab === "discharge" ? <DischargeTab admission={a} /> : null}
      {activeTab === "documents" ? <ConsentsTab admissionId={admissionId} /> : null}
      {activeTab === "mediclaim" && a.has_mediclaim ? <MediclaimTab admission={a} /> : null}
      {activeTab === "whatsapp" && whatsAppConfig.configured ? (
        <WhatsAppTab phone={a.patient_mobile} patientName={a.patient_name} />
      ) : null}
    </View>
  );
}
