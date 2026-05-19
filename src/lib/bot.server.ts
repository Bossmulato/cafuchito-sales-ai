// Server-only helpers for Groq + Evolution API.
// Do NOT import from client code.

const EVOLUTION_URL = "https://evolution-api-production-42f6.up.railway.app";

function evoHeaders() {
  const key = process.env.EVOLUTION_API_KEY;
  if (!key) throw new Error("EVOLUTION_API_KEY não configurada");
  return { "Content-Type": "application/json", apikey: key };
}

export async function evoFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    ...init,
    headers: { ...evoHeaders(), ...(init.headers || {}) },
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // keep as text
  }
  if (!res.ok) {
    throw new Error(
      `Evolution ${res.status}: ${typeof data === "string" ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200)}`,
    );
  }
  return data as Record<string, unknown>;
}

export type ProductData = {
  name: string;
  description: string;
  price_kz: number;
  benefits: string;
  faq: string;
  payment_data: string;
};

export function buildSystemPrompt(p: ProductData): string {
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
- Se o cliente pedir fotos, modelos ou cores, diga numa frase que vai enviar as imagens disponíveis (as fotos são enviadas automaticamente a seguir).
- Se a pergunta não tiver resposta no FAQ, diga que vai verificar com a equipa.`;
}

// Detect if user is asking for product photos / models / colors
export function wantsPhotos(text: string): boolean {
  const t = text.toLowerCase();
  return /(foto|fotos|imagem|imagens|ver o produto|mostrar|mostra|modelo|modelos|cor |cores|tamanho|tamanhos|disponiv|disponív)/i.test(t);
}

export async function sendWhatsAppImage(
  instanceName: string,
  number: string,
  imageUrl: string,
  caption?: string,
): Promise<void> {
  await evoFetch(`/message/sendMedia/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number,
      mediatype: "image",
      media: imageUrl,
      caption: caption ?? "",
      fileName: "produto.jpg",
    }),
  });
}


export async function callGroq(
  system: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY não configurada");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, ...history],
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "(sem resposta)";
}
