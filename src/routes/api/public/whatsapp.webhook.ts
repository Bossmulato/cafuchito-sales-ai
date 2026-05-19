import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { evoFetch, callGroq, buildSystemPrompt, wantsPhotos, sendWhatsAppImage, type ProductData } from "@/lib/bot.server";

type WebhookPayload = {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
    };
  };
};

function extractText(msg: WebhookPayload["data"]): string | null {
  const m = msg?.message;
  if (!m) return null;
  return m.conversation ?? m.extendedTextMessage?.text ?? null;
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: WebhookPayload;
        try {
          payload = (await request.json()) as WebhookPayload;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const event = payload.event ?? "";
        const instanceName = payload.instance ?? "";
        if (!instanceName) return new Response("ok");

        // Find owning user
        const { data: inst } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("user_id, status")
          .eq("instance_name", instanceName)
          .maybeSingle();
        if (!inst) return new Response("ok");
        const userId = inst.user_id as string;

        if (event === "connection.update" || event === "CONNECTION_UPDATE") {
          // best-effort status sync
          try {
            const state = await evoFetch(`/instance/connectionState/${instanceName}`, { method: "GET" });
            const inner = (state.instance as { state?: string } | undefined) ?? state;
            const raw = String((inner as { state?: string }).state ?? "");
            const status = raw === "open" ? "connected" : raw === "connecting" ? "qr" : "disconnected";
            await supabaseAdmin.from("whatsapp_instances")
              .update({ status }).eq("user_id", userId);
          } catch {
            // ignore
          }
          return new Response("ok");
        }

        if (event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
          return new Response("ok");
        }

        const data = payload.data;
        if (!data || data.key?.fromMe) return new Response("ok");

        const remoteJid = data.key?.remoteJid ?? "";
        if (!remoteJid || remoteJid.endsWith("@g.us")) return new Response("ok");
        const text = extractText(data);
        if (!text) return new Response("ok");

        const phone = remoteJid.split("@")[0];

        // Load product
        const { data: product } = await supabaseAdmin
          .from("products").select("*").eq("user_id", userId)
          .order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (!product) return new Response("ok");

        // Load history
        const { data: history } = await supabaseAdmin
          .from("bot_conversations")
          .select("role, content")
          .eq("user_id", userId)
          .eq("contact_phone", phone)
          .order("created_at", { ascending: true })
          .limit(20);

        const messages = [
          ...(history ?? []).map((h) => ({
            role: h.role as "user" | "assistant",
            content: h.content as string,
          })),
          { role: "user" as const, content: text },
        ];

        let reply: string;
        try {
          reply = await callGroq(buildSystemPrompt(product as ProductData), messages);
        } catch (err) {
          console.error("Groq error", err);
          return new Response("ok");
        }

        // Persist
        await supabaseAdmin.from("bot_conversations").insert([
          { user_id: userId, contact_phone: phone, role: "user", content: text },
          { user_id: userId, contact_phone: phone, role: "assistant", content: reply },
        ]);

        // Send reply via Evolution
        try {
          await evoFetch(`/message/sendText/${instanceName}`, {
            method: "POST",
            body: JSON.stringify({ number: phone, text: reply }),
          });
        } catch (err) {
          console.error("Evolution send error", err);
        }

        // If customer asked for photos/models/colors, send product images
        if (wantsPhotos(text)) {
          const { data: imgs } = await supabaseAdmin
            .from("product_images")
            .select("image_url, label")
            .eq("product_id", (product as { id: string }).id)
            .order("sort_order", { ascending: true })
            .limit(6);
          for (const img of imgs ?? []) {
            try {
              await sendWhatsAppImage(instanceName, phone, img.image_url as string, (img.label as string) || undefined);
              await new Promise((r) => setTimeout(r, 600));
            } catch (err) {
              console.error("Evolution send image error", err);
            }
          }
        }

        return new Response("ok");
      },
      GET: async () =>
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    },
  },
});
