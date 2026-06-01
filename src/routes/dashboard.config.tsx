import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Settings, Save, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/config")({
  component: SettingsPage,
});

type S = { business_name: string; logo_url: string; currency: string; default_greeting: string };
const empty: S = { business_name: "Auto Vendas IA", logo_url: "", currency: "Kz", default_greeting: "" };

function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<S>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("business_name,logo_url,currency,default_greeting")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm(data as S);
        setLoading(false);
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...form }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações guardadas");
  };

  const uploadLogo = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    toast.success("Logo carregado — clique em Guardar");
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar...
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-primary/15 bg-input/40 px-4 py-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configurações do negócio</h1>
          <p className="text-sm text-muted-foreground">Identidade da empresa e preferências do bot.</p>
        </div>
      </header>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-primary/10 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-input/40">
            {form.logo_url ? (
              <img src={form.logo_url} alt="logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">Logo</span>
            )}
          </div>
          <label className="cursor-pointer rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20">
            Carregar logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Nome do negócio
            </label>
            <input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Moeda</label>
            <input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className={field}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
            Mensagem de boas-vindas (opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Olá! 👋 Sou o assistente da sua loja, em que posso ajudar?"
            value={form.default_greeting}
            onChange={(e) => setForm({ ...form, default_greeting: e.target.value })}
            className={field}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
      </form>
    </div>
  );
}
