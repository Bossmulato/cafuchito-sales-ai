import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, MessageCircle, Bot, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold tracking-wide">Grupo Cafuchito AI</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition">Entrar</Link>
          <Link
            to="/login"
            className="rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold hover:opacity-90 transition"
          >
            Começar
          </Link>
        </nav>
      </header>

      <section className="container mx-auto px-6 pt-16 pb-24 text-center">
        <p className="mb-4 inline-block rounded-full border border-gold/40 bg-card/40 px-4 py-1 text-xs uppercase tracking-[0.2em] text-primary">
          Vendas automatizadas · WhatsApp · IA
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl md:text-6xl font-bold leading-tight">
          Transforme conversas em <span className="text-gradient-gold">vendas de ouro</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Configure o seu produto, conecte a Groq e deixe a nossa IA fechar vendas no WhatsApp 24 horas por dia.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/login"
            className="rounded-md bg-gradient-gold px-8 py-3 font-semibold text-primary-foreground shadow-gold hover:scale-[1.02] transition"
          >
            Aceder ao Painel
          </Link>
        </div>
      </section>

      <section className="container mx-auto grid gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: Bot, title: "IA Treinada", desc: "Responde com base no seu catálogo, FAQ e dados de pagamento." },
          { icon: MessageCircle, title: "Simulador", desc: "Teste o bot antes de o colocar a falar com clientes reais." },
          { icon: ShieldCheck, title: "Seguro", desc: "Os seus dados e chaves ficam isolados por lojista." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-gold/20 bg-card/60 p-6 shadow-luxe backdrop-blur">
            <f.icon className="mb-4 h-7 w-7 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-gold/10 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Grupo Cafuchito AI · Luanda, Angola
      </footer>
    </div>
  );
}
