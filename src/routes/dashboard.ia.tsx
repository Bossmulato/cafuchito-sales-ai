import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Brain, Save, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/ia")({
  component: AITrainingPage,
});

type Training = {
  tone: string;
  rules: string;
  objections: string;
  custom_responses: string;
};

const empty: Training = { tone: "", rules: "", objections: "", custom_responses: "" };

function AITrainingPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Training>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ai_training")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm(data as Training);
        setLoading(false);
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("ai_training")
      .upsert({ user_id: user.id, ...form }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Treino da IA atualizado");
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar treino...
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-primary/15 bg-input/40 px-4 py-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Treino da IA</h1>
          <p className="text-sm text-muted-foreground">
            Ensine o assistente a responder como a sua marca. Tudo é injetado no prompt automaticamente.
          </p>
        </div>
      </header>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-primary/10 bg-card/60 p-6 backdrop-blur-xl">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
            Tom de voz da marca
          </label>
          <textarea
            rows={2}
            placeholder="Ex: cordial, próximo, persuasivo, sem ser agressivo. Usa expressões angolanas."
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
            Regras de atendimento
          </label>
          <textarea
            rows={4}
            placeholder={"Ex:\n- Nunca dar descontos sem autorização\n- Sempre confirmar morada antes do envio\n- Cumprimentar pelo nome quando souber"}
            value={form.rules}
            onChange={(e) => setForm({ ...form, rules: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
            Objeções comuns e como responder
          </label>
          <textarea
            rows={5}
            placeholder={"Ex:\n- 'Está caro' → reforçar valor e qualidade\n- 'Vou pensar' → criar urgência (stock limitado)\n- 'Tenho medo de não chegar' → garantir entrega ou devolução"}
            value={form.objections}
            onChange={(e) => setForm({ ...form, objections: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
            Respostas personalizadas (FAQ avançado)
          </label>
          <textarea
            rows={5}
            placeholder={"P: Fazem entrega no domingo?\nR: Sim, em Luanda. Cobramos taxa extra de 1000 Kz."}
            value={form.custom_responses}
            onChange={(e) => setForm({ ...form, custom_responses: e.target.value })}
            className={field}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar treino
        </button>
      </form>
    </div>
  );
}
