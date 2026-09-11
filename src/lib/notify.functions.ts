import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RECIPIENT_FALLBACK = "9779761715925";

const message = `🔔 New NestNepal Host Verification Request

A user has submitted a request to become a verified host.

Please log in to the NestNepal Admin Dashboard to review and approve/reject the request.`;

function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("977")) return digits;
  return `977${digits.replace(/^0+/, "")}`;
}

/**
 * Notifies the NestNepal owner on WhatsApp that a host verification request
 * arrived. Approval always happens in the admin dashboard, never here.
 *
 * SECURITY: the Meta credentials are read from server-side environment secrets
 * inside the handler only. Handler bodies never ship to the browser bundle, and
 * nothing here returns or logs the token. Returns { sent: false } when the
 * WhatsApp Business API is not configured yet — a failed notification never
 * blocks or rolls back the verification request itself.
 */
export const notifyOwnerHostRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ sent: boolean; reason?: string }> => {
    const token = process.env["WHATSAPP_ACCESS_TOKEN"];
    const phoneId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
    const recipient =
      process.env["WHATSAPP_RECIPIENT_PHONE"] ??
      process.env["OWNER_WHATSAPP_NUMBER"] ??
      RECIPIENT_FALLBACK;

    if (!token || !phoneId) {
      const missing = [
        ...(!token ? ["WHATSAPP_ACCESS_TOKEN"] : []),
        ...(!phoneId ? ["WHATSAPP_PHONE_NUMBER_ID"] : []),
      ].join(", ");
      // Names only — never values.
      console.warn(`[whatsapp] notification skipped, missing secret(s): ${missing}`);
      return { sent: false, reason: "not_configured" };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toWhatsAppNumber(recipient),
          type: "text",
          text: { preview_url: false, body: message },
        }),
      });
      if (!res.ok) {
        // Provider errors echo the request but never the token; still keep the
        // log to a status code plus a trimmed, redacted body.
        const body = (await res.text()).slice(0, 500).replaceAll(token, "[redacted]");
        console.error(`[whatsapp] send failed with status ${res.status}: ${body}`);
        return { sent: false, reason: "provider_error" };
      }
      return { sent: true };
    } catch {
      console.error("[whatsapp] send failed: network error");
      return { sent: false, reason: "network_error" };
    }
  });
