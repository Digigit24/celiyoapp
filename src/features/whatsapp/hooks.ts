import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChatHistory, sendWhatsAppText } from "../../lib/api/whatsapp";
import { getTenantMe } from "../../lib/api/tenant";
import { useAuth } from "../../store/AuthContext";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export function useWhatsAppConfig() {
  const enabled = useSignedIn();
  const query = useQuery({
    queryKey: ["whatsapp", "tenant-config"],
    queryFn: getTenantMe,
    enabled,
    staleTime: 5 * 60_000,
  });
  const settings = query.data?.settings;
  const configured = Boolean(settings?.whatsapp_vendor_uid && settings?.whatsapp_api_token);
  return { ...query, configured };
}

export function useWhatsAppChat(phone: string | null | undefined) {
  const enabled = useSignedIn() && Boolean(phone);
  return useQuery({
    queryKey: ["whatsapp", "chat", phone ?? ""],
    queryFn: () => getChatHistory(phone as string, 1, 50),
    enabled,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useSendWhatsAppText(phone: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, name }: { text: string; name?: string }) => sendWhatsAppText(phone, text, name),
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ["whatsapp", "chat", phone] }), 1500);
    },
  });
}
