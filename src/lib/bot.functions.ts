import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { evoFetch, callGroq, buildSystemPrompt, type ProductData } from "./bot.server";

function instanceNameFor(userId: string) {
  return `auto-vendas-${userId.slice(0, 8)}`;
}

function siteOrigin(): string {
  return process.env.SITE_URL || "https://project--c44a31c0-eae6-4371-acbd-9ac6b0645962.lovable.app";
}

// Simulator: chat with the global Groq using current user's product
export const chatWithBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      messages: z.array(
        z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }),
      ).min(1).max(40),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: product } = await supabase
      .from("products").select("*").eq("user_id", userId)
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();

    if (!product) throw new Error("Configure o produto antes de testar.");
    const reply = await callGroq(buildSystemPrompt(product as ProductData), data.messages);
    return { reply };
  });

// Get or create the user's WhatsApp instance row (DB only)
export const getMyInstance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("whatsapp_instances").select("*").eq("user_id", userId).maybeSingle();
    return { instance: data };
  });

// Create the Evolution instance + return QR
export const connectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const instanceName = instanceNameFor(userId);
    const webhookUrl = `${siteOrigin()}/api/public/whatsapp/webhook`;

    // Try to create; ignore "already exists" errors
    try {
      await evoFetch("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: {
            url: webhookUrl,
            byEvents: false,
            base64: true,
            events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
          },
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/already in use|exists|409/i.test(msg)) throw err;
    }

    // Fetch QR
    let qrBase64: string | null = null;
    try {
      const conn = await evoFetch(`/instance/connect/${instanceName}`, { method: "GET" });
      const raw = (conn.base64 ?? conn.qrcode ?? (conn as { code?: string }).code) as string | undefined;
      if (raw) qrBase64 = raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
    } catch {
      // ignore
    }

    await supabase.from("whatsapp_instances").upsert({
      user_id: userId,
      instance_name: instanceName,
      status: "qr",
      qr_code: qrBase64,
    });

    return { instanceName, qrCode: qrBase64 };
  });

// Refresh status from Evolution
export const refreshWhatsAppStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const instanceName = instanceNameFor(userId);
    try {
      const state = await evoFetch(`/instance/connectionState/${instanceName}`, { method: "GET" });
      const inner = (state.instance as { state?: string } | undefined) ?? state;
      const raw = String((inner as { state?: string }).state ?? "");
      const status = raw === "open" ? "connected" : raw === "connecting" ? "qr" : "disconnected";
      await supabase.from("whatsapp_instances")
        .update({ status }).eq("user_id", userId);
      return { status };
    } catch (err) {
      return { status: "disconnected", error: err instanceof Error ? err.message : "erro" };
    }
  });

export const disconnectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const instanceName = instanceNameFor(userId);
    try {
      await evoFetch(`/instance/logout/${instanceName}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    await supabase.from("whatsapp_instances")
      .update({ status: "disconnected", qr_code: null }).eq("user_id", userId);
    return { ok: true };
  });
