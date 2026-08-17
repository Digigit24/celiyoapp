/**
 * dghms Pharmacy API types (/api/pharmacy/prescriptions/*).
 *
 * Resource is `Prescription`/`PrescriptionItem` — NOT the same as
 * `src/hooks/masters.ts`'s `PharmacyProduct` (`/pharmacy/products`), which is
 * an unrelated sale catalog left untouched by this module.
 *
 * Confirmed against dghms source (apps/pharmacy):
 * - Items are ALWAYS eagerly embedded on both list and detail — no lightweight
 *   list serializer variant.
 * - `dispensed_quantity` / `is_dispensed` / `dispensed_at` exist on the
 *   backend model but are CONFIRMED to never appear in any API response
 *   (list, detail, add_item, update_item, or dispense's own response).
 *   Only `quantity` (ordered) is orderable data — don't build an
 *   ordered-vs-dispensed column client-side, there's no data source for it.
 * - `doctor_user_id` is a raw UUID with no display-name lookup in this
 *   contract — show the UUID or omit the row, never invent a name join.
 */

export type PrescriptionStatus =
  | "pending"
  | "partially_dispensed"
  | "dispensed"
  | "cancelled";

/** Aliases the backend accepts for `encounter_type` on create/list filters. */
export type EncounterTypeAlias = "opd" | "opd.visit" | "ipd" | "ipd.admission";

export interface PrescriptionItem {
  id: number;
  prescription: number;
  inventory_item: number | null;
  source_row_key: string | null;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  inventory_item_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: number;
  tenant_id: string;
  visit_id: number | null;
  encounter_type_label: string;
  encounter_id_value: number | null;
  doctor_user_id: string;
  status: PrescriptionStatus;
  notes: string;
  patient_id: number;
  patient_name: string;
  items: PrescriptionItem[];
  created_at: string;
  updated_at: string;
}

/** `POST /pharmacy/prescriptions` — items can't be included inline. */
export interface PrescriptionCreatePayload {
  visit_id?: number;
  encounter_type?: EncounterTypeAlias;
  encounter_id?: number;
  notes?: string;
}

/** `POST /pharmacy/prescriptions/{id}/add_item/` — one of inventory_item/drug_name required. */
export interface AddPrescriptionItemPayload {
  inventory_item?: number;
  drug_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
}

/** `POST /pharmacy/prescriptions/{id}/update_item/` */
export interface UpdatePrescriptionItemPayload {
  item_id: number;
  inventory_item?: number;
  drug_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
}

/**
 * `POST /pharmacy/prescriptions/{id}/dispense/` — omit `item_id` to dispense
 * all pending items. Only pass `quantity` together with a specific `item_id`;
 * the UI never sends `quantity` alone (backend applies it to every item).
 */
export interface DispensePayload {
  item_id?: number;
  quantity?: number;
}

export interface DispenseError {
  item_id: number;
  message: string;
}

export interface DispenseResult {
  success: boolean;
  message: string;
  data: {
    dispensed: PrescriptionItem[];
    errors: DispenseError[];
  };
}
