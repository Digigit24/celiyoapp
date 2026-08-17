/**
 * MRD (Medical Records Department) module — shared display helpers.
 *
 * Rebuilt around the real backend concept: MRD staff assembling a printable
 * document packet for a patient (worklist → dossier → export), not a
 * physical-file custody tracker. See `src/types/mrd.ts` and
 * `src/lib/api/mrd.ts` for the verified contract this was built from.
 */
import type { ChipVariant } from "../../components/ui";
import type { MrdEncounterType } from "../../types/mrd";

export const MRD_ENCOUNTER_LABELS: Record<MrdEncounterType, string> = {
  ipd: "IPD",
  opd: "OPD",
  daycare: "Daycare",
};

export const MRD_ENCOUNTER_CHIP_VARIANT: Record<MrdEncounterType, ChipVariant> = {
  ipd: "info",
  opd: "success",
  daycare: "warning",
};

/** Compact "17 Aug 2026" display for an ISO date/datetime string. Returns "—" if unparseable. */
export function formatMrdDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
