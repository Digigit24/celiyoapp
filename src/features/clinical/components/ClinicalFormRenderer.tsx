/**
 * Ported from celiyohms/src/features/clinical/components/ClinicalFormRenderer.tsx.
 * Stateless w.r.t. the record — values/onChange flow from the parent
 * (EmrWorkspace); this component owns only UI state (collapse, active tab).
 * Mobile always renders a single-column stacked layout — the web's
 * full/half/third per-section width system has no equivalent here.
 *
 * Out of scope for this port (see the plan's scope decisions):
 * `custom_component: "short_round_note"` form-level override, `type:
 * "component"` tabs (IPD history/certificates/chart upload panels), and the
 * `pull`-from-another-form button. Sections/fields using these still render
 * via the generic path (or a placeholder) rather than crashing.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../../components/ui";
import type {
  ClinicalFormField,
  ClinicalFormSection,
  ClinicalFormStructure,
} from "../../../types/clinical";
import { evaluateVisibility, readVisibilityRule } from "../lib/visibility";
import { getRuntimeFieldKey } from "../lib/fieldMapping";
import { SectionCard } from "./SectionCard";
import {
  BodyDiagramField,
  BooleanField,
  CalculatedField,
  DataRefField,
  HeadingField,
  NumberField,
  PainFacesField,
  SignatureField,
  TextField,
  YesNoField,
} from "./fields/SimpleFields";
import { DateTimeField } from "./fields/DateTimeField";
import { ApiSelectField, MultiSelectField, PicklistField } from "./fields/PickerFields";
import { GridField, InvestigationGridField, PrescriptionGridField } from "./fields/GridFields";

interface ClinicalFormRendererProps {
  structure: ClinicalFormStructure | null | undefined;
  values?: Record<string, unknown>;
  onChange?: (fieldKey: string, value: unknown, opts?: { isDefaultApply?: boolean }) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  emptyTitle?: string;
  emptyDescription?: string;
  encounter?: Record<string, unknown>;
}

function sectionRole(section: ClinicalFormSection): string | undefined {
  const role = section.config?.role;
  return typeof role === "string" ? role : undefined;
}

function Field({
  section,
  field,
  values,
  onChange,
  disabled,
  error,
  encounter,
}: {
  section: ClinicalFormSection;
  field: ClinicalFormField;
  values: Record<string, unknown>;
  onChange?: ClinicalFormRendererProps["onChange"];
  disabled?: boolean;
  error?: string;
  encounter?: Record<string, unknown>;
}) {
  const runtimeKey = getRuntimeFieldKey(section, field);
  const value = values[runtimeKey] ?? values[field.field_key] ?? field.default_value ?? "";
  const handleChange = (v: unknown, opts?: { isDefaultApply?: boolean }) => onChange?.(runtimeKey, v, opts);
  const commonProps = { field, value, onChange: handleChange, disabled, error, values, encounter };

  switch (field.field_type) {
    case "text":
    case "textarea":
    case "rich_text":
      return <TextField {...commonProps} />;
    case "number":
      return <NumberField {...commonProps} />;
    case "boolean":
      return <BooleanField {...commonProps} />;
    case "date":
    case "datetime":
    case "time":
      return <DateTimeField {...commonProps} />;
    case "picklist":
      return <PicklistField {...commonProps} />;
    case "multiselect":
      return <MultiSelectField {...commonProps} />;
    case "api_select":
      return <ApiSelectField {...commonProps} />;
    case "calculated":
      return <CalculatedField {...commonProps} />;
    case "yes_no":
      return <YesNoField {...commonProps} />;
    case "grid": {
      const role = sectionRole(section);
      if (role === "prescription") return <PrescriptionGridField {...commonProps} />;
      if (role === "investigation") return <InvestigationGridField {...commonProps} />;
      return <GridField {...commonProps} />;
    }
    case "pain_faces":
      return <PainFacesField {...commonProps} />;
    case "body_diagram":
      return <BodyDiagramField {...commonProps} />;
    case "heading":
      return <HeadingField {...commonProps} />;
    case "data_ref":
      return <DataRefField {...commonProps} />;
    case "signature":
      return <SignatureField {...commonProps} />;
    case "file":
      return <DataRefField {...commonProps} />;
    default:
      return null;
  }
}

function SectionFields({
  section,
  values,
  onChange,
  disabled,
  errors,
  encounter,
}: {
  section: ClinicalFormSection;
  values: Record<string, unknown>;
  onChange?: ClinicalFormRendererProps["onChange"];
  disabled?: boolean;
  errors?: Record<string, string>;
  encounter?: Record<string, unknown>;
}) {
  const fields = (section.section_fields ?? [])
    .filter((f) => f.is_active !== false && evaluateVisibility(readVisibilityRule(f.config), values))
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <SectionCard section={section}>
      {fields.map((field) => {
        const runtimeKey = getRuntimeFieldKey(section, field);
        return (
          <Field
            key={field.id}
            section={section}
            field={field}
            values={values}
            onChange={onChange}
            disabled={disabled}
            error={errors?.[runtimeKey] ?? errors?.[field.field_key]}
            encounter={encounter}
          />
        );
      })}
    </SectionCard>
  );
}

export function ClinicalFormRenderer({
  structure,
  values = {},
  onChange,
  disabled,
  errors,
  emptyTitle = "No form selected",
  emptyDescription = "Choose a form to start filling it in.",
  encounter,
}: ClinicalFormRendererProps) {
  const tabs = useMemo(() => {
    const raw = structure?.config?.tabs;
    return Array.isArray(raw)
      ? (raw as Array<{ key: string; label: string; type?: string; component?: string }>)
      : [];
  }, [structure]);
  const [activeTab, setActiveTab] = useState<string | null>(tabs[0]?.key ?? null);

  const visibleSections = useMemo(() => {
    if (!structure) return [];
    return structure.sections
      .filter(
        (s) =>
          s.is_active !== false && evaluateVisibility(readVisibilityRule(s.config, s.visibility_rule), values)
      )
      .sort((a, b) => a.display_order - b.display_order);
  }, [structure, values]);

  if (!structure) {
    return <EmptyState icon="document-text-outline" title={emptyTitle} message={emptyDescription} />;
  }

  if (visibleSections.length === 0) {
    return <EmptyState icon="document-text-outline" title="Nothing to fill in" message="This form has no visible sections." />;
  }

  const currentTab = tabs.find((t) => t.key === activeTab);
  const sectionsForTab =
    tabs.length > 0 && currentTab?.type !== "component"
      ? visibleSections.filter((s) => (s.config?.tab ?? tabs[0]?.key) === (currentTab?.key ?? tabs[0]?.key))
      : visibleSections;

  return (
    <View className="gap-3">
      {tabs.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-none">
          <View className="flex-row gap-2 pb-1">
            {tabs.map((tab) => {
              const active = tab.key === (activeTab ?? tabs[0]?.key);
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="button"
                  onPress={() => setActiveTab(tab.key)}
                  className={["rounded-full px-3.5 py-2", active ? "bg-primary" : "bg-secondary"].join(" ")}
                >
                  <Text className={["text-sm font-medium", active ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {currentTab?.type === "component" ? (
        <EmptyState
          icon="construct-outline"
          title={currentTab.label}
          message="This panel isn't available on mobile yet — use the web app."
        />
      ) : (
        sectionsForTab.map((section) => (
          <SectionFields
            key={`${section.placement_id ?? section.id}-${section.instance_key ?? ""}`}
            section={section}
            values={values}
            onChange={onChange}
            disabled={disabled}
            errors={errors}
            encounter={encounter}
          />
        ))
      )}
    </View>
  );
}
