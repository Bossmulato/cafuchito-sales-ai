import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Bot, Key } from "lucide-react";

export const Route = createFileRoute("/dashboard/ia")({
  component: AISettings,
});

function AISettings() {
  const { user } = useAuth();
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("groq_api_key").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setKey(data.groq_api_key); });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_settings")
        .upsert({ user_id: user.id, groq_api_key: key });
      if (error) throw error;
      toast.success("Chave Groq guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <Bot className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Gestão de IA</h1>
          <p className="text-sm text-muted-foreground">Cole a sua GROQ_API_KEY para ativar o bot.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gold/30 bg-card/70 p-8 shadow-luxe">
        <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Key className="h-3 w-3" /> GROQ_API_KEY
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="gsk_..."
          className="w-full rounded-md border border-gold/30 bg-input/40 px-4 py-3 font-mono text-sm outline-none focus:border-primary"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Obtenha em <a className="text-primary underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">console.groq.com/keys</a>.
          A chave é guardada apenas para o seu utilizador.
        </p>
        <button
          onClick={save}
          disabled={saving}
          className="mt-6 rounded-md bg-gradient-gold px-6 py-3 font-semibold text-primary-foreground shadow-gold hover:opacity-90 disabled:opacity-50 transition"
        >
          {saving ? "A guardar..." : "Guardar Chave"}
        </button>
      </div>
    </div>
  );
}
