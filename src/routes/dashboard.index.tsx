import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Package, Save, Pencil, CheckCircle2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: ProductPage,
});

type Product = {
  id?: string;
  name: string;
  description: string;
  price_kz: number;
  benefits: string;
  faq: string;
  payment_data: string;
};

const empty: Product = { name: "", description: "", price_kz: 0, benefits: "", faq: "", payment_data: "" };

function ProductPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Product>(empty);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm(data as Product);
          setLastSaved((data as any).updated_at ?? null);
        }
        setLoaded(true);
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase.from("products").update({
          name: form.name,
          description: form.description,
          price_kz: form.price_kz,
          benefits: form.benefits,
          faq: form.faq,
          payment_data: form.payment_data,
        }).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert({
          user_id: user.id,
          name: form.name,
          description: form.description,
          price_kz: form.price_kz,
          benefits: form.benefits,
          faq: form.faq,
          payment_data: form.payment_data,
        }).select().single();
        if (error) throw error;
        if (data) {
          setForm(data as Product);
          setLastSaved((data as any).updated_at ?? null);
        }
      }
      toast.success("Produto guardado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-md border border-gold/30 bg-input/40 px-4 py-3 text-foreground outline-none focus:border-primary";
  const hasProduct = !!form.id;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <Package className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">
            {hasProduct ? "Editar Produto" : "Configuração do Produto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasProduct
              ? "Altere os dados do seu produto e o bot atualiza automaticamente."
              : "Estes dados alimentam o bot de vendas."}
          </p>
        </div>
      </div>

      {hasProduct && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm text-foreground">
            <p className="font-semibold">Produto configurado</p>
            <p className="text-muted-foreground">
              {lastSaved
                ? `Última atualização: ${new Date(lastSaved).toLocaleString("pt-PT")}`
                : "Pode editar os campos abaixo e guardar as alterações."}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-gold/30 bg-card/70 p-8 shadow-luxe">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Nome do Produto</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Descrição</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Preço (Kz)</label>
          <input type="number" min={0} step="0.01" value={form.price_kz}
            onChange={(e) => setForm({ ...form, price_kz: Number(e.target.value) })} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Benefícios</label>
          <textarea rows={3} placeholder="• Entrega rápida..." value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">FAQ</label>
          <textarea rows={4} placeholder="P: ...\nR: ..." value={form.faq}
            onChange={(e) => setForm({ ...form, faq: e.target.value })} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Dados de Pagamento (Multicaixa / Unitel Money)</label>
          <textarea rows={3} placeholder="IBAN: ...\nUnitel Money: 9xx xxx xxx" value={form.payment_data}
            onChange={(e) => setForm({ ...form, payment_data: e.target.value })} className={field} />
        </div>
        <button
          type="submit"
          disabled={saving || !loaded}
          className="flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 font-semibold text-primary-foreground shadow-gold hover:opacity-90 disabled:opacity-50 transition"
        >
          {hasProduct ? <Pencil className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {saving ? "A guardar..." : hasProduct ? "Atualizar Produto" : "Guardar Produto"}
        </button>
      </form>
    </div>
  );
}
