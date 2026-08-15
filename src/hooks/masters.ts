/**
 * Read-only master/reference-data hooks for dropdowns.
 * Masters management stays web-only — mobile never writes these.
 *
 * Endpoint shapes confirmed against dghms (apps/doctors, apps/ipd,
 * apps/pharmacy). StandardPagination envelope: {success, count, next,
 * previous, results}; specialties return {success, data} unpaginated.
 */
import { useQuery } from "@tanstack/react-query";
import { hmsGet, type Paginated } from "../lib/api/hmsClient";
import { useAuth } from "../store/AuthContext";

// ─── Types (list-serializer fields only) ─────────────────────────────────────

export interface Doctor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  specialties: Array<{ id: string; name: string }>;
  consultation_fee: string;
  status: string;
}

export interface Specialty {
  id: string;
  name: string;
  code: string;
  description: string;
  department: string;
  is_active: boolean;
  doctors_count: number;
}

export interface Ward {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  floor: string;
  total_beds: number;
  available_beds_count: number;
  occupied_beds_count: number;
}

export interface Bed {
  id: string;
  ward: string;
  ward_name: string;
  bed_number: string;
  bed_type: string;
  daily_charge: string;
  is_occupied: boolean;
  status: string;
  is_active: boolean;
  has_oxygen: boolean;
  has_ventilator: boolean;
}

export interface PharmacyProduct {
  id: string;
  product_name: string;
  category: { id: string; name: string } | null;
  category_id: string | null;
  company: string;
  batch_no: string;
  mrp: string;
  selling_price: string;
  quantity: number;
  minimum_stock_level: number;
  expiry_date: string;
  is_in_stock: boolean;
  low_stock_warning: boolean;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

const STALE_TIME = 5 * 60_000; // reference data changes rarely

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export function useDoctors(search?: string) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["masters", "doctors", search ?? ""],
    queryFn: () =>
      hmsGet<Paginated<Doctor>>("/doctors/profiles", {
        params: { status: "active", page_size: 200, ...(search ? { search } : {}) },
      }).then((r) => r.results),
    staleTime: STALE_TIME,
    enabled,
  });
}

export function useSpecialties() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["masters", "specialties"],
    queryFn: async () => {
      // SpecialtyViewSet bypasses pagination: {success, data}
      const res = await hmsGet<
        { success: boolean; data: Specialty[] } | Paginated<Specialty>
      >("/doctors/specialties", { params: { is_active: true } });
      return "results" in res ? res.results : res.data;
    },
    staleTime: STALE_TIME,
    enabled,
  });
}

export function useWards() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["masters", "wards"],
    queryFn: () =>
      hmsGet<Paginated<Ward>>("/ipd/wards", { params: { page_size: 200 } }).then(
        (r) => r.results
      ),
    staleTime: STALE_TIME,
    enabled,
  });
}

export function useBeds(wardId?: string) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["masters", "beds", wardId ?? "all"],
    queryFn: () =>
      hmsGet<Paginated<Bed>>("/ipd/beds", {
        params: {
          page_size: 200,
          is_active: true,
          ...(wardId ? { ward: wardId } : {}),
        },
      }).then((r) => r.results),
    staleTime: STALE_TIME,
    enabled,
  });
}

export function usePharmacyProducts(search?: string) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["masters", "pharmacy-products", search ?? ""],
    queryFn: () =>
      hmsGet<Paginated<PharmacyProduct>>("/pharmacy/products", {
        params: { page_size: 200, ...(search ? { search } : {}) },
      }).then((r) => r.results),
    staleTime: STALE_TIME,
    enabled,
  });
}
