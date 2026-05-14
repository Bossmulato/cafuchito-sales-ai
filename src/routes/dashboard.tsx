import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Package, MessageCircle, LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  const items = [
    { to: "/dashboard", label: "Produto", icon: Package, exact: true },
    { to: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageCircle, exact: false },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-gold/20 bg-card/60 p-6 md:block">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display text-base font-bold">Auto Vendas IA</span>
        </Link>
        <nav className="space-y-1">
          {items.map((it) => {
            const active = it.exact ? location.pathname === it.to : location.pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/login" });
          }}
          className="mt-10 flex w-full items-center gap-2 rounded-md border border-gold/20 px-3 py-2 text-sm text-muted-foreground hover:text-primary transition"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </aside>

      <main className="flex-1 px-6 py-10 md:px-12">
        <div className="mb-6 flex md:hidden gap-2">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="rounded-md border border-gold/20 px-3 py-1 text-xs">
              {it.label}
            </Link>
          ))}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
