import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Brain,
  MessageCircle,
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/dashboard/produto", label: "Produto & IA", icon: Package },
  { to: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/dashboard/analytics", label: "Analítica", icon: BarChart3 },
  { to: "/dashboard/config", label: "Configurações", icon: Settings },
];

function DashboardLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar painel...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-dark">
      <aside className="hidden w-64 shrink-0 border-r border-primary/10 bg-card/40 px-4 py-6 backdrop-blur-xl md:flex md:flex-col">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold">Auto Vendas</span>
            <span className="text-[10px] uppercase tracking-widest text-primary">IA Suite</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map((it) => {
            const active = it.exact ? location.pathname === it.to : location.pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.78_0.16_165_/_0.3)]"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <it.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Plano PRO</p>
          <p>Tudo desbloqueado para o seu negócio.</p>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="border-b border-primary/10 bg-card/30 px-6 py-3 backdrop-blur-xl md:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {nav.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-card/60 px-3 py-1.5 text-xs"
              >
                <it.icon className="h-3 w-3" />
                {it.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="px-6 py-8 md:px-10 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
