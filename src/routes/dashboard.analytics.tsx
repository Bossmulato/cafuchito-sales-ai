import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

type Order = { product_name: string; amount_kz: number; status: string; created_at: string };

function formatKz(n: number) {
  return new Intl.NumberFormat("pt-PT").format(n) + " Kz";
}

function AnalyticsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("product_name,amount_kz,status,created_at")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const paid = useMemo(() => orders.filter((o) => o.status === "paid"), [orders]);

  const byProduct = useMemo(() => {
    const m: Record<string, { product: string; receita: number; pedidos: number }> = {};
    for (const o of paid) {
      const k = o.product_name || "Sem nome";
      if (!m[k]) m[k] = { product: k, receita: 0, pedidos: 0 };
      m[k].receita += Number(o.amount_kz || 0);
      m[k].pedidos += 1;
    }
    return Object.values(m).sort((a, b) => b.receita - a.receita).slice(0, 8);
  }, [paid]);

  const byHour = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ h: `${h}h`, vendas: 0 }));
    for (const o of paid) arr[new Date(o.created_at).getHours()].vendas += 1;
    return arr;
  }, [paid]);

  const byMonth = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of paid) {
      const d = new Date(o.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m[k] = (m[k] ?? 0) + Number(o.amount_kz || 0);
    }
    return Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => ({ mes: k, receita: v }));
  }, [paid]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar...
      </div>
    );
  }

  const tooltip = {
    contentStyle: {
      background: "oklch(0.17 0.02 165)",
      border: "1px solid oklch(0.78 0.16 165 / 0.3)",
      borderRadius: 8,
    },
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Analítica</h1>
          <p className="text-sm text-muted-foreground">Insights sobre as suas vendas e produtos.</p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-primary/10 bg-card/60 p-6 backdrop-blur-xl">
          <h3 className="mb-4 font-semibold">Produtos mais vendidos</h3>
          {byProduct.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {byProduct.map((p, i) => (
                <li key={p.product} className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {i + 1}
                    </span>
                    {p.product}
                  </span>
                  <span className="text-sm font-semibold">{formatKz(p.receita)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-primary/10 bg-card/60 p-6 backdrop-blur-xl">
          <h3 className="mb-4 font-semibold">Vendas por hora do dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.78 0.16 165 / 0.12)" />
                <XAxis dataKey="h" stroke="oklch(0.7 0.02 170)" fontSize={10} />
                <YAxis stroke="oklch(0.7 0.02 170)" fontSize={11} />
                <Tooltip {...tooltip} />
                <Bar dataKey="vendas" fill="oklch(0.78 0.16 165)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/10 bg-card/60 p-6 backdrop-blur-xl">
        <h3 className="mb-4 font-semibold">Receita por mês (últimos 12)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.78 0.16 165 / 0.12)" />
              <XAxis dataKey="mes" stroke="oklch(0.7 0.02 170)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.02 170)" fontSize={11} />
              <Tooltip {...tooltip} />
              <Line type="monotone" dataKey="receita" stroke="oklch(0.78 0.16 165)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
