import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Store, Package, Sparkles, Rocket, Trash2, ImagePlus, X, Image as ImageIcon, Loader2, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/produto")({
  component: ProductPage,
});

type Business = {
  business_name: string;
  category: string;
  city: string;
  whatsapp_number: string;
  payment_methods: string;
  delivery_methods: string;
};

type Product = {
  id?: string;
  name: string;
  description: string;
  price_kz: number;
  benefits: string;
};

type ProductImage = { id: string; image_url: string; storage_path: string | null; label: string; sort_order: number };

const emptyB: Business = {
  business_name: "",
  category: "",
  city: "",
  whatsapp_number: "",
  payment_methods: "",
  delivery_methods: "",
};
const emptyP: Product = { name: "", description: "", price_kz: 0, benefits: "" };

function ProductPage() {
  const { user } = useAuth();
  const [biz, setBiz] = useState<Business>(emptyB);
  const [prod, setProd] = useState<Product>(emptyP);
  const [extraInfo, setExtraInfo] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: p }, { data: t }] = await Promise.all([
        supabase
          .from("user_settings")
          .select("business_name,category,city,whatsapp_number,payment_methods,delivery_methods")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("products")
          .select("id,name,description,price_kz,benefits")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("ai_training").select("extra_info").eq("user_id", user.id).maybeSingle(),
      ]);
      if (s) setBiz({ ...emptyB, ...(s as Partial<Business>) });
      if (p) {
        setProd(p as Product);
        const { data: imgs } = await supabase
          .from("product_images")
          .select("id,image_url,storage_path,label,sort_order")
          .eq("product_id", (p as { id: string }).id)
          .order("sort_order", { ascending: true });
        setImages((imgs as ProductImage[]) ?? []);
      }
      if (t) setExtraInfo((t as { extra_info?: string }).extra_info ?? "");
      setLoading(false);
    })();
  }, [user]);

  const uploadImages = async (files: FileList | null) => {
    if (!files || !user || !prod.id) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${prod.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        const { data: row, error: insErr } = await supabase
          .from("product_images")
          .insert({
            product_id: prod.id,
            user_id: user.id,
            image_url: pub.publicUrl,
            storage_path: path,
            label: "",
            sort_order: images.length,
          })
          .select()
          .single();
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
      if (img.storage_path) await supabase.storage.from("product-images").remove([img.storage_path]);
      await supabase.from("product_images").delete().eq("id", img.id);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!biz.business_name.trim()) return toast.error("Diga o nome do seu negócio");
    if (!prod.name.trim()) return toast.error("Diga o nome do produto");
    setSaving(true);
    try {
      // 1. Business
      const { error: bErr } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, ...biz }, { onConflict: "user_id" });
      if (bErr) throw bErr;

      // 2. Product
      if (prod.id) {
        const { error } = await supabase
          .from("products")
          .update({
            name: prod.name,
            description: prod.description,
            price_kz: prod.price_kz,
            benefits: prod.benefits,
          })
          .eq("id", prod.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            user_id: user.id,
            name: prod.name,
            description: prod.description,
            price_kz: prod.price_kz,
            benefits: prod.benefits,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setProd(data as Product);
      }

      // 3. AI extra info
      const { error: tErr } = await supabase
        .from("ai_training")
        .upsert({ user_id: user.id, extra_info: extraInfo }, { onConflict: "user_id" });
      if (tErr) throw tErr;

      toast.success("🚀 Vendedor IA ativado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!user || !prod.id) return;
    if (!window.confirm("Eliminar o produto? Esta ação não pode ser desfeita.")) return;
    setSaving(true);
    try {
      for (const img of images) {
        if (img.storage_path) await supabase.storage.from("product-images").remove([img.storage_path]);
      }
      await supabase.from("product_images").delete().eq("product_id", prod.id);
      const { error } = await supabase.from("products").delete().eq("id", prod.id);
      if (error) throw error;
      setProd(emptyP);
      setImages([]);
      toast.success("Produto eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
      </div>
    );
  }

  const hasProduct = !!prod.id;
  const input =
    "w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Configuração rápida
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ativar Vendedor IA</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Preencha os 3 blocos abaixo e a sua IA começa a vender no WhatsApp. Sem prompts, sem treinos manuais.
        </p>
      </header>

      <form onSubmit={save} className="space-y-6">
        {/* SECTION 1 — BUSINESS */}
        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">1. Dados do negócio</h2>
              <p className="text-xs text-muted-foreground">A IA usa isto para se apresentar ao cliente.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nome do negócio *</label>
              <input
                required
                value={biz.business_name}
                onChange={(e) => setBiz({ ...biz, business_name: e.target.value })}
                placeholder="Ex: Loja Estilo"
                className={input}
              />
            </div>
            <div>
              <label className={labelCls}>Categoria</label>
              <input
                value={biz.category}
                onChange={(e) => setBiz({ ...biz, category: e.target.value })}
                placeholder="Ex: Moda, Eletrónica, Cosmética"
                className={input}
              />
            </div>
            <div>
              <label className={labelCls}>Cidade</label>
              <input
                value={biz.city}
                onChange={(e) => setBiz({ ...biz, city: e.target.value })}
                placeholder="Ex: Luanda, Lisboa, São Paulo"
                className={input}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>WhatsApp de atendimento</label>
              <input
                value={biz.whatsapp_number}
                onChange={(e) => setBiz({ ...biz, whatsapp_number: e.target.value })}
                placeholder="+244 900 000 000"
                className={input}
              />
            </div>
            <div>
              <label className={labelCls}>Métodos de pagamento</label>
              <textarea
                rows={3}
                value={biz.payment_methods}
                onChange={(e) => setBiz({ ...biz, payment_methods: e.target.value })}
                placeholder="Ex: Transferência BAI, Multicaixa Express, MB Way, Pix"
                className={input}
              />
            </div>
            <div>
              <label className={labelCls}>Métodos de entrega</label>
              <textarea
                rows={3}
                value={biz.delivery_methods}
                onChange={(e) => setBiz({ ...biz, delivery_methods: e.target.value })}
                placeholder="Ex: Entrega ao domicílio, levantamento na loja, envio CTT"
                className={input}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2 — PRODUCT */}
        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">2. Produto</h2>
              <p className="text-xs text-muted-foreground">O produto que a IA vai vender.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nome do produto *</label>
              <input
                required
                value={prod.name}
                onChange={(e) => setProd({ ...prod, name: e.target.value })}
                placeholder="Ex: Ténis Premium"
                className={input}
              />
            </div>
            <div>
              <label className={labelCls}>Preço</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={prod.price_kz}
                onChange={(e) => setProd({ ...prod, price_kz: Number(e.target.value) })}
                className={input}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Descrição</label>
              <textarea
                rows={3}
                value={prod.description}
                onChange={(e) => setProd({ ...prod, description: e.target.value })}
                placeholder="O que é o produto, para quem é, o que resolve."
                className={input}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Benefícios principais</label>
              <textarea
                rows={3}
                value={prod.benefits}
                onChange={(e) => setProd({ ...prod, benefits: e.target.value })}
                placeholder="• Durável\n• Confortável\n• Entrega rápida"
                className={input}
              />
            </div>

            {/* Images */}
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" /> Imagens do produto ({images.length})
                </label>
                <label
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    hasProduct
                      ? "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                      : "cursor-not-allowed border border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploading ? "A carregar…" : "Adicionar"}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={uploading || !hasProduct}
                    onChange={(e) => {
                      uploadImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {!hasProduct ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                  Guarde primeiro o produto para carregar imagens.
                </p>
              ) : images.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                  Sem fotos. Adicione para a IA mostrar ao cliente automaticamente.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute right-1 top-1 rounded-full bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3 — AI BEHAVIOR */}
        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">3. Comportamento da IA</h2>
              <p className="text-xs text-muted-foreground">Opcional. Tudo o resto é automático.</p>
            </div>
          </div>

          <label className={labelCls}>Informações extras para a IA</label>
          <textarea
            rows={5}
            value={extraInfo}
            onChange={(e) => setExtraInfo(e.target.value)}
            placeholder="Escreva qualquer informação importante sobre o seu negócio, entregas, garantias, promoções ou regras especiais."
            className={input}
          />

          <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> A IA já faz tudo isto automaticamente
            </p>
            <ul className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <li>• Apresenta o negócio</li>
              <li>• Responde dúvidas sobre o produto</li>
              <li>• Cria FAQ automática</li>
              <li>• Explica preço e formas de pagamento</li>
              <li>• Trata da entrega</li>
              <li>• Tranquiliza sobre garantia</li>
              <li>• Responde a objeções</li>
              <li>• Fecha a venda</li>
            </ul>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-background/80 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          {hasProduct ? (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Eliminar produto
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Pronto a ativar.</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {saving ? "A ativar…" : "🚀 Ativar Vendedor IA"}
          </button>
        </div>
      </form>
    </div>
  );
}
