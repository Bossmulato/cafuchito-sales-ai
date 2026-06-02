import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  MessageSquare,
  Users,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Sparkles,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

type Order = { amount_kz: number; status: string; created_at: string };
type Conv = { contact_phone: string; role: string; created_at: string };

function formatKz(n: number) {
  return new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(n) + " Kz";
}

function lastNDays(n: number) {
  const arr: { date: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    arr.push({ date: key, label: d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }) });
  }
  return arr;
}

function DashboardOverview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      const [{ data: o }, { data: c }] = await Promise.all([
        supabase.from("orders").select("amount_kz,status,created_at").eq("user_id", user.id),
        supabase
          .from("bot_conversations")
          .select("contact_phone,role,created_at")
          .eq("user_id", user.id)
          .gte("created_at", since.toISOString()),
      ]);
      setOrders((o as Order[]) ?? []);
      setConvs((c as Conv[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const kpis = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid");
    const revenue = paid.reduce((s, o) => s + Number(o.amount_kz || 0), 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthly = paid
      .filter((o) => new Date(o.created_at) >= monthStart)
      .reduce((s, o) => s + Number(o.amount_kz || 0), 0);
    const uniqueContacts = new Set(convs.map((c) => c.contact_phone)).size;
    const totalMessages = convs.length;
    const conversionRate = uniqueContacts > 0 ? (paid.length / uniqueContacts) * 100 : 0;
    return {
      revenue,
      monthly,
      paidCount: paid.length,
      uniqueContacts,
      totalMessages,
      conversionRate,
    };
  }, [orders, convs]);

  const chartData = useMemo(() => {
    const days = lastNDays(14);
    return days.map((d) => {
      const sales = orders
        .filter((o) => o.status === "paid" && o.created_at.startsWith(d.date))
        .reduce((s, o) => s + Number(o.amount_kz || 0), 0);
      const messages = convs.filter((c) => c.created_at.startsWith(d.date)).length;
      return { label: d.label, vendas: sales, mensagens: messages };
    });
  }, [orders, convs]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar métricas...
      </div>
    );
  }

  const cards = [
    { label: "Receita Total", value: formatKz(kpis.revenue), icon: Wallet, hint: "Pedidos pagos" },
    { label: "Receita do Mês", value: formatKz(kpis.monthly), icon: TrendingUp, hint: "Mês corrente" },
    { label: "Pedidos Pagos", value: String(kpis.paidCount), icon: ShoppingBag, hint: "Total acumulado" },
    {
      label: "Taxa de Conversão",
      value: `${kpis.conversionRate.toFixed(1)}%`,
      icon: Sparkles,
      hint: "Pagos / contactos",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground">
            Tudo o que está a acontecer com o seu bot de vendas em tempo real.
          </p>
        </div>
        <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Atualizado agora
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/30 hover:shadow-gold"
          >
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
            <div className="relative flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            </div>
            <div className="relative mt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6">
        <div className="rounded-2xl border border-primary/10 bg-card/60 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Vendas (14 dias)</h3>
              <p className="text-xs text-muted-foreground">Receita diária dos pedidos pagos</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.16 165)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.16 165)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.78 0.16 165 / 0.12)" />
                <XAxis dataKey="label" stroke="oklch(0.7 0.02 170)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 170)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.02 165)",
                    border: "1px solid oklch(0.78 0.16 165 / 0.3)",
                    borderRadius: 8,
                  }}
                />
                <Area type="monotone" dataKey="vendas" stroke="oklch(0.78 0.16 165)" strokeWidth={2} fill="url(#gVendas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
