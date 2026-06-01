import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Users, Search, Loader2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/clientes")({
  component: ClientsPage,
});

type Conv = { contact_phone: string; created_at: string; content: string; role: string };
type Status = { contact_phone: string; status: string; contact_name: string; notes: string };

const STATUSES = [
  { v: "new", label: "Novo", cls: "bg-blue-500/15 text-blue-400 border-blue-400/30" },
  { v: "interested", label: "Interessado", cls: "bg-amber-500/15 text-amber-400 border-amber-400/30" },
  { v: "negotiating", label: "Negociação", cls: "bg-purple-500/15 text-purple-400 border-purple-400/30" },
  { v: "paid", label: "Pago", cls: "bg-primary/15 text-primary border-primary/30" },
  { v: "lost", label: "Perdido", cls: "bg-rose-500/15 text-rose-400 border-rose-400/30" },
];

function ClientsPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase
          .from("bot_conversations")
          .select("contact_phone,created_at,content,role")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("customer_status").select("*").eq("user_id", user.id),
      ]);
      setConvs((c as Conv[]) ?? []);
      const map: Record<string, Status> = {};
      for (const row of (s as Status[]) ?? []) map[row.contact_phone] = row;
      setStatuses(map);
      setLoading(false);
    })();
  }, [user]);

  const customers = useMemo(() => {
    const byPhone: Record<string, { phone: string; last: string; lastMessage: string; count: number }> = {};
    for (const c of convs) {
      if (!byPhone[c.contact_phone]) {
        byPhone[c.contact_phone] = { phone: c.contact_phone, last: c.created_at, lastMessage: c.content, count: 0 };
      }
      byPhone[c.contact_phone].count += 1;
    }
    return Object.values(byPhone)
      .map((c) => ({ ...c, status: statuses[c.phone] }))
      .filter((c) => {
        if (filter !== "all" && (c.status?.status ?? "new") !== filter) return false;
        if (!q) return true;
        const ql = q.toLowerCase();
        return c.phone.includes(ql) || (c.status?.contact_name ?? "").toLowerCase().includes(ql);
      })
      .sort((a, b) => +new Date(b.last) - +new Date(a.last));
  }, [convs, statuses, q, filter]);

  const updateStatus = async (phone: string, newStatus: string) => {
    if (!user) return;
    const existing = statuses[phone];
    const payload = {
      user_id: user.id,
      contact_phone: phone,
      status: newStatus,
      contact_name: existing?.contact_name ?? "",
      notes: existing?.notes ?? "",
    };
    const { error } = await supabase.from("customer_status").upsert(payload, { onConflict: "user_id,contact_phone" });
    if (error) return toast.error(error.message);
    setStatuses((p) => ({ ...p, [phone]: { ...payload } }));
    toast.success("Status atualizado");
  };

  const updateName = async (phone: string, name: string) => {
    if (!user) return;
    const existing = statuses[phone];
    const payload = {
      user_id: user.id,
      contact_phone: phone,
      status: existing?.status ?? "new",
      contact_name: name,
      notes: existing?.notes ?? "",
    };
    await supabase.from("customer_status").upsert(payload, { onConflict: "user_id,contact_phone" });
    setStatuses((p) => ({ ...p, [phone]: { ...payload } }));
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar clientes...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">{customers.length} contactos detectados pelo bot.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar por nome ou telefone..."
            className="w-full rounded-lg border border-primary/15 bg-card/60 py-2 pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              filter === "all" ? "border-primary bg-primary/15 text-primary" : "border-primary/15 text-muted-foreground"
            }`}
          >
            Todos
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.v}
              onClick={() => setFilter(s.v)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
                filter === s.v ? s.cls : "border-primary/15 text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="bg-card/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Última interação</th>
              <th className="px-4 py-3">Mensagens</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <MessageCircle className="mx-auto mb-2 h-6 w-6" />
                  Nenhum cliente ainda. Quando o bot receber mensagens aparecem aqui.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.phone} className="border-t border-primary/5 transition hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <input
                      defaultValue={c.status?.contact_name ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (c.status?.contact_name ?? "")) updateName(c.phone, e.target.value);
                      }}
                      placeholder="Sem nome"
                      className="w-full bg-transparent text-foreground outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.last).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">{c.count}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status?.status ?? "new"}
                      onChange={(e) => updateStatus(c.phone, e.target.value)}
                      className="rounded-md border border-primary/15 bg-input/40 px-2 py-1 text-xs outline-none focus:border-primary"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.v} value={s.v}>
                          {s.label}
                        </option>
                      ))}
                    </select>
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
