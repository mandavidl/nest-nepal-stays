import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_WHATSAPP_FALLBACK = "9779761715925";

const message = `🔔 New NestNepal Host Verification Request

A user has submitted a request to become a verified host.

Please log in to the NestNepal Admin Dashboard to review and approve/reject the request.`;

/**
 * Notifies the NestNepal owner on WhatsApp that a host verification request
 * arrived. Approval always happens in the admin dashboard, never here.
 * Returns { sent: false } when the WhatsApp Business API is not configured yet —
 * a failed notification never blocks the request itself.
 */
export const notifyOwnerHostRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ sent: boolean; reason?: string }> => {
    const token = process.env["WHATSAPP_ACCESS_TOKEN"];
    const phoneId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
    const to = process.env["OWNER_WHATSAPP_NUMBER"] ?? OWNER_WHATSAPP_FALLBACK;
    if (!token || !phoneId) return { sent: false, reason: "not_configured" };

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      });
      if (!res.ok) {
        console.error("WhatsApp notification failed", res.status, await res.text());
        return { sent: false, reason: "provider_error" };
      }
      return { sent: true };
    } catch (error) {
      console.error("WhatsApp notification error", error);
      return { sent: false, reason: "network_error" };
    }
  });
