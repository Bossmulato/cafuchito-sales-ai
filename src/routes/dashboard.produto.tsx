import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Package, Save, Pencil, CheckCircle2, Sparkles, Trash2, ImagePlus, X, Image as ImageIcon, Brain } from "lucide-react";

export const Route = createFileRoute("/dashboard/produto")({
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

type Training = {
  tone: string;
  rules: string;
  objections: string;
  custom_responses: string;
};

const empty: Product = { name: "", description: "", price_kz: 0, benefits: "", faq: "", payment_data: "" };
const emptyT: Training = { tone: "", rules: "", objections: "", custom_responses: "" };

type ProductImage = { id: string; image_url: string; storage_path: string | null; label: string; sort_order: number };

function ProductPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Product>(empty);
  const [training, setTraining] = useState<Training>(emptyT);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setForm(data as Product);
          setLastSaved((data as any).updated_at ?? null);
          const { data: imgs } = await supabase
            .from("product_images").select("*")
            .eq("product_id", (data as any).id)
            .order("sort_order", { ascending: true });
          setImages((imgs as ProductImage[]) ?? []);
        }
        const { data: t } = await supabase
          .from("ai_training").select("tone,rules,objections,custom_responses")
          .eq("user_id", user.id).maybeSingle();
        if (t) setTraining(t as Training);
        setLoaded(true);
      });
  }, [user]);

  const uploadImages = async (files: FileList | null) => {
    if (!files || !user || !form.id) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${form.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        const { data: row, error: insErr } = await supabase.from("product_images").insert({
          product_id: form.id,
          user_id: user.id,
          image_url: pub.publicUrl,
          storage_path: path,
          label: "",
          sort_order: images.length,
        }).select().single();
        if (insErr) throw insErr;
        setImages((prev) => [...prev, row as ProductImage]);
      }
      toast.success("Fotos carregadas!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (img: ProductImage) => {
    try {
      if (img.storage_path) {
        await supabase.storage.from("product-images").remove([img.storage_path]);
      }
      await supabase.from("product_images").delete().eq("id", img.id);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      toast.success("Foto removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  const updateImageLabel = async (id: string, label: string) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, label } : i)));
    await supabase.from("product_images").update({ label }).eq("id", id);
  };

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
      const { error: tErr } = await supabase
        .from("ai_training")
        .upsert({ user_id: user.id, ...training }, { onConflict: "user_id" });
      if (tErr) throw tErr;
      toast.success("Produto e treino da IA guardados!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!user || !form.id) return;
    if (!window.confirm("Tem a certeza que quer eliminar o produto? Esta ação não pode ser desfeita.")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", form.id);
      if (error) throw error;
      setForm(empty);
      setLastSaved(null);
      toast.success("Produto eliminado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar");
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

        <div className="rounded-xl border border-gold/30 bg-background/40 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Fotos do produto ({images.length})
              </h3>
            </div>
            <label
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition ${
                hasProduct
                  ? "cursor-pointer border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  : "cursor-not-allowed border-muted-foreground/20 bg-muted/20 text-muted-foreground"
              }`}
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? "A carregar..." : "Adicionar fotos"}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                disabled={uploading || !hasProduct}
                onChange={(e) => { uploadImages(e.target.files); e.target.value = ""; }}
              />
            </label>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Quando o cliente pedir <span className="font-medium text-foreground">fotos, modelos ou cores</span>, o bot envia automaticamente estas imagens. Use a legenda para identificar cor/modelo.
          </p>
          {!hasProduct ? (
            <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-6 text-center text-sm text-foreground">
              👉 Guarde primeiro o produto (botão abaixo) para poder carregar as fotos.
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-md border border-dashed border-gold/30 p-6 text-center text-sm text-muted-foreground">
              Sem fotos. Clique em <span className="font-medium text-foreground">"Adicionar fotos"</span> para o bot mostrar ao cliente.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gold/30 bg-card/40">
                  <img src={img.image_url} alt={img.label || "produto"} className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img)}
                    className="absolute right-1 top-1 rounded-full bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                    title="Remover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <input
                    type="text"
                    placeholder="Ex: Cor preta, Modelo XL"
                    defaultValue={img.label}
                    onBlur={(e) => updateImageLabel(img.id, e.target.value)}
                    className="w-full border-t border-gold/20 bg-input/40 px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving || !loaded}
            className="flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 font-semibold text-primary-foreground shadow-gold hover:opacity-90 disabled:opacity-50 transition"
          >
            {hasProduct ? <Pencil className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {saving ? "A guardar..." : hasProduct ? "Atualizar Produto" : "Guardar Produto"}
          </button>
          {hasProduct && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="flex items-center gap-2 rounded-md border border-destructive/40 px-6 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Produto
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
