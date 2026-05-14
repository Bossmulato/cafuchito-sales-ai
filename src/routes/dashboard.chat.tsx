import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/chat")({
  component: ChatSimulator,
});

type Msg = { role: "user" | "assistant"; content: string };

type Product = {
  name: string; description: string; price_kz: number;
  benefits: string; faq: string; payment_data: string;
};

function buildSystemPrompt(p: Product): string {
  return `Você é o assistente virtual da Auto Vendas IA no WhatsApp. Apresente-se como "assistente da Auto Vendas IA" quando perguntado. Responda em português de Angola, de forma cordial, persuasiva e curta (3-6 linhas). Use emojis com moderação. Feche a venda guiando o cliente para o pagamento.

PRODUTO: ${p.name}
DESCRIÇÃO: ${p.description}
PREÇO: ${p.price_kz} Kz
BENEFÍCIOS:
${p.benefits}

FAQ:
${p.faq}

DADOS DE PAGAMENTO (Multicaixa/Unitel Money):
${p.payment_data}

Regras:
- Nunca invente informações que não estão acima.
- Se perguntarem como pagar, partilhe os dados de pagamento.
- Se a pergunta não tiver resposta no FAQ, diga que vai verificar com a equipa.`;
}

function ChatSimulator() {
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [groqKey, setGroqKey] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("products").select("*").eq("user_id", user.id)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("user_settings").select("groq_api_key").eq("user_id", user.id).maybeSingle(),
    ]).then(([p, s]) => {
      if (p.data) setProduct(p.data as Product);
      if (s.data) setGroqKey(s.data.groq_api_key);
    });
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!product) { toast.error("Configure o produto primeiro."); return; }
    if (!groqKey) { toast.error("Adicione a GROQ_API_KEY em IA Groq."); return; }

    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: buildSystemPrompt(product) },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Groq ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? "(sem resposta)";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Simulador de Chat</h1>
          <p className="text-sm text-muted-foreground">
            {product ? `Bot a responder sobre: ${product.name}` : "Configure o produto para começar"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-gold/30 bg-card/70 p-6 shadow-luxe">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            Escreva uma pergunta para testar o seu bot de vendas.
          </div>
        )}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-gradient-gold text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm border border-gold/20"
              }`}>
                {m.content.split("\n").map((l, j) => <p key={j}>{l}</p>)}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-gold/20 bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Olá, queria saber o preço..."
          className="flex-1 rounded-md border border-gold/30 bg-input/40 px-4 py-3 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-3 font-semibold text-primary-foreground shadow-gold hover:opacity-90 disabled:opacity-50 transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
