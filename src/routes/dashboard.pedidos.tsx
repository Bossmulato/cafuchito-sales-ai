import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ShoppingBag, Plus, Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/pedidos")({
  component: OrdersPage,
});

type Order = {
  id: string;
  contact_name: string;
  contact_phone: string;
  product_name: string;
  amount_kz: number;
  status: string;
  created_at: string;
  notes: string;
};

const STATUSES = [
  { v: "pending", label: "Pendente", cls: "bg-amber-500/15 text-amber-400 border-amber-400/30" },
  { v: "paid", label: "Pago", cls: "bg-primary/15 text-primary border-primary/30" },
  { v: "shipped", label: "Enviado", cls: "bg-blue-500/15 text-blue-400 border-blue-400/30" },
  { v: "cancelled", label: "Cancelado", cls: "bg-rose-500/15 text-rose-400 border-rose-400/30" },
];

function statusCls(s: string) {
  return STATUSES.find((x) => x.v === s)?.cls ?? "";
}

function formatKz(n: number) {
  return new Intl.NumberFormat("pt-PT").format(n) + " Kz";
}

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    contact_name: "",
    contact_phone: "",
    product_name: "",
    amount_kz: 0,
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase
      .from("orders")
      .insert({ ...form, user_id: user.id })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setOrders((p) => [data as Order, ...p]);
    setShowForm(false);
    setForm({ contact_name: "", contact_phone: "", product_name: "", amount_kz: 0, status: "pending", notes: "" });
    toast.success("Pedido criado");
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success("Status atualizado");
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminar este pedido?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((p) => p.filter((o) => o.id !== id));
    toast.success("Pedido eliminado");
  };

  const list = orders.filter((o) => filter === "all" || o.status === filter);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar pedidos...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Pedidos</h1>
            <p className="text-sm text-muted-foreground">Gestão de vendas e estado de entrega.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo pedido
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={create}
          className="grid gap-3 rounded-2xl border border-primary/10 bg-card/60 p-5 backdrop-blur-xl sm:grid-cols-2"
        >
          <input
            required
            placeholder="Nome do cliente"
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            className="rounded-lg border border-primary/15 bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            required
            placeholder="Telefone"
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            className="rounded-lg border border-primary/15 bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            required
            placeholder="Produto"
            value={form.product_name}
            onChange={(e) => setForm({ ...form, product_name: e.target.value })}
            className="rounded-lg border border-primary/15 bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            required
            type="number"
            min={0}
            placeholder="Valor (Kz)"
            value={form.amount_kz}
            onChange={(e) => setForm({ ...form, amount_kz: Number(e.target.value) })}
            className="rounded-lg border border-primary/15 bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-lg border border-primary/15 bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {STATUSES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-lg border border-primary/15 bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold sm:col-span-2"
          >
            Guardar pedido
          </button>
        </form>
      )}

      <div className="flex gap-1 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            filter === "all" ? "border-primary bg-primary/15 text-primary" : "border-primary/15 text-muted-foreground"
          }`}
        >
          Todos ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const n = orders.filter((o) => o.status === s.v).length;
          return (
            <button
              key={s.v}
              onClick={() => setFilter(s.v)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
                filter === s.v ? s.cls : "border-primary/15 text-muted-foreground"
              }`}
            >
              {s.label} ({n})
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="bg-card/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Sem pedidos. Crie o primeiro acima.
                </td>
              </tr>
            ) : (
              list.map((o) => (
                <tr key={o.id} className="border-t border-primary/5 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.contact_name || "—"}</div>
                    <div className="font-mono text-xs text-muted-foreground">{o.contact_phone}</div>
                  </td>
                  <td className="px-4 py-3">{o.product_name}</td>
                  <td className="px-4 py-3 font-semibold">{formatKz(Number(o.amount_kz))}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`rounded-md border px-2 py-1 text-xs outline-none ${statusCls(o.status)}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.v} value={s.v} className="bg-card text-foreground">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(o.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
