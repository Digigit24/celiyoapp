/**
 * digicrm's WhatsApp chat contract (Laravel adapter passthrough — digicrm
 * does zero shape transformation, so this is the wire contract, not a
 * digicrm-authored schema). Some fields may legitimately be absent
 * depending on the Laravel build in front of a given tenant.
 */

export interface TemplateComponent {
  type?: string; // "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
  format?: string;
  text?: string;
  buttons?: Array<{ type?: string; text?: string }>;
  parameters?: Record<string, unknown> | unknown[];
  [key: string]: unknown;
}

export interface ChatMessageMeta {
  template_proforma?: { name?: string; language?: string; components?: TemplateComponent[] };
  template_components?: TemplateComponent[];
  template_component_values?: TemplateComponent[];
  template_name?: string;
  media_values?: { type?: string; url?: string; link?: string; caption?: string; [key: string]: unknown };
  interaction_message_data?: {
    interactive_type?: string;
    body?: { text?: string };
    body_text?: string;
    header_text?: string;
    footer_text?: string;
    buttons?: Record<string, string>;
  };
  options?: { interaction_message_data?: { body_text?: string; header_text?: string } };
}

export interface ChatMessage extends ChatMessageMeta {
  id: string;
  phone: string;
  direction: "inbound" | "outbound";
  /** Delivery status: sent | delivered | read | failed | ... (only read/delivered/failed are specially rendered). */
  status: string;
  message: string | null;
  timestamp: string;
  meta?: ChatMessageMeta;
  text?: string;
}

export interface ChatHistoryResponse {
  result?: string;
  phone?: string;
  total?: number;
  page?: number;
  per_page?: number;
  messages?: ChatMessage[];
  data?: ChatMessage[];
  reply_window_open?: boolean;
  reply_window_expires_at?: string | null;
  requires_template?: boolean;
  contact?: {
    reply_window_open?: boolean;
    reply_window_expires_at?: string | null;
    requires_template?: boolean;
  };
}

export interface SendTextResult {
  detail?: string;
  wa_message_id?: string;
  [key: string]: unknown;
}
