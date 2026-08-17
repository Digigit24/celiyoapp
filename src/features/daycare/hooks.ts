/**
 * Daycare hooks — thin wrappers around the real IPD admission hooks
 * (`features/ipd/hooks.ts`) with `admission_type=daycare` baked in. There is
 * no separate Daycare backend or API module: a daycare session IS an
 * `/api/ipd/admissions` row, so we reuse `useAdmissions`/`useAdmission`/
 * `useCreateAdmission`/`useUpdateRegistration`/`useDischargeAdmission`
 * rather than reimplementing admission mutations from scratch.
 */
import { useQueryClient } from "@tanstack/react-query";
import type { AdmissionListParams } from "../../lib/api/ipd";
import {
  ipdKeys,
  useAdmission,
  useAdmissions,
  useCreateAdmission,
  useDischargeAdmission,
  useUpdateRegistration,
} from "../ipd/hooks";
import type { AdmissionCreatePayload, DischargePayload } from "../../types/ipd";

export interface DaycareListParams
  extends Omit<AdmissionListParams, "admission_type"> {}

/** Admission list, always forced to `admission_type=daycare`. */
export function useDaycareList(params?: DaycareListParams) {
  return useAdmissions({ ...params, admission_type: "daycare" });
}

/** Admission detail by id — same resource/endpoint as IPD, no daycare-specific filtering. */
export function useDaycareSession(id: number | null | undefined) {
  return useAdmission(id);
}

/**
 * Create a daycare admission. `AdmissionCreatePayload` has no `admission_type`
 * field (the create endpoint doesn't accept one) — matching
 * `NewIpdAdmissionScreen`'s pattern, the type is set with a follow-up
 * `PATCH .../registration` call after the admission is created.
 */
export function useCreateDaycareAdmission() {
  const createAdmission = useCreateAdmission();
  const updateRegistration = useUpdateRegistration();
  const qc = useQueryClient();

  async function mutateAsync(payload: AdmissionCreatePayload) {
    const admission = await createAdmission.mutateAsync(payload);
    try {
      await updateRegistration.mutateAsync({
        id: admission.id,
        payload: { admission_type: "daycare" },
      });
    } finally {
      qc.invalidateQueries({ queryKey: ipdKeys.detail(admission.id) });
      qc.invalidateQueries({ queryKey: ["ipd", "admissions", "list"] });
    }
    return admission;
  }

  return {
    mutateAsync,
    isPending: createAdmission.isPending || updateRegistration.isPending,
  };
}

/** Discharge a daycare admission — identical mutation to IPD's discharge. */
export function useDischargeDaycareAdmission() {
  return useDischargeAdmission();
}

export type { DischargePayload };
