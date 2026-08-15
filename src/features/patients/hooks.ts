import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPatient, getPatient, listPatients, type PatientListParams } from "../../lib/api/patients";
import { useAuth } from "../../store/AuthContext";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export function usePatients(params?: PatientListParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["patients", "list", params ?? {}],
    queryFn: () => listPatients(params),
    enabled,
  });
}

export function usePatient(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: ["patients", "detail", id ?? 0],
    queryFn: () => getPatient(id as number),
    enabled,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients", "list"] }),
  });
}
