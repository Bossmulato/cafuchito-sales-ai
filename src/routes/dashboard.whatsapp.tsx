import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { connectWhatsApp, getMyInstance, refreshWhatsAppStatus, disconnectWhatsApp } from "@/lib/bot.functions";
import { toast } from "sonner";
import { MessageCircle, QrCode, Loader2, CheckCircle2, RefreshCw, LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard/whatsapp")({
  component: WhatsAppPage,
});

type Inst = { status: string; qr_code: string | null; phone_number: string | null } | null;

function WhatsAppPage() {
  const fetchInstance = useServerFn(getMyInstance);
  const connect = useServerFn(connectWhatsApp);
  const refresh = useServerFn(refreshWhatsAppStatus);
  const disconnect = useServerFn(disconnectWhatsApp);

  const [inst, setInst] = useState<Inst>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    fetchInstance().then((r) => {
      setInst(r.instance as Inst);
      setQr((r.instance as Inst)?.qr_code ?? null);
      setLoading(false);
    });
  }, [fetchInstance]);

  // Poll status while waiting for QR scan
  useEffect(() => {
    if (!inst || inst.status === "connected") return;
    const t = setInterval(async () => {
      const r = await refresh();
      if (r.status === "connected") {
        setInst((p) => (p ? { ...p, status: "connected" } : p));
        setQr(null);
        toast.success("WhatsApp ligado!");
      }
    }, 5000);
    return () => clearInterval(t);
  }, [inst, refresh]);

  const handleConnect = async () => {
    setWorking(true);
    try {
      const r = await connect();
      setQr(r.qrCode);
      setInst({ status: "qr", qr_code: r.qrCode, phone_number: null });
      toast.success("QR Code gerado. Leia com o seu WhatsApp.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    setWorking(true);
    try {
      await disconnect();
      setInst({ status: "disconnected", qr_code: null, phone_number: null });
      setQr(null);
      toast.success("WhatsApp desligado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  const connected = inst?.status === "connected";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Conectar WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Ligue o seu número e o bot começa a vender 24h por dia.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gold/30 bg-card/70 p-8 text-center shadow-luxe">
        {connected ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h2 className="mb-2 text-2xl font-bold">WhatsApp Ligado ✅</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              O seu bot já está a responder automaticamente às mensagens.
            </p>
            <button
              onClick={handleDisconnect}
              disabled={working}
              className="inline-flex items-center gap-2 rounded-md border border-gold/30 px-6 py-3 text-sm hover:bg-secondary transition disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" /> Desligar
            </button>
          </>
        ) : qr ? (
          <>
            <div className="mx-auto mb-4 inline-block rounded-xl bg-white p-4">
              <img src={qr} alt="QR Code WhatsApp" className="h-64 w-64" />
            </div>
            <p className="mb-2 font-semibold">Abra o WhatsApp → Aparelhos ligados → Ligar aparelho</p>
            <p className="mb-6 text-sm text-muted-foreground">A aguardar leitura do código...</p>
            <button
              onClick={handleConnect}
              disabled={working}
              className="inline-flex items-center gap-2 rounded-md border border-gold/30 px-4 py-2 text-sm hover:bg-secondary transition disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> Gerar novo QR
            </button>
          </>
        ) : (
          <>
            <QrCode className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h2 className="mb-2 text-2xl font-bold">Pronto para começar?</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Carregue no botão abaixo para gerar o QR Code e ligar o seu WhatsApp.
            </p>
            <button
              onClick={handleConnect}
              disabled={working}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-8 py-4 text-lg font-bold text-primary-foreground shadow-gold hover:opacity-90 transition disabled:opacity-50"
            >
              {working ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
              Gerar QR Code
            </button>
          </>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-gold/20 bg-card/40 p-5 text-sm text-muted-foreground">
        <p className="mb-2 font-semibold text-foreground">Como funciona</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Configure o seu produto na página <strong>Produto</strong>.</li>
          <li>Clique em <strong>Gerar QR Code</strong> e leia com o seu WhatsApp.</li>
          <li>O bot da Auto Vendas IA passa a responder a todas as mensagens automaticamente.</li>
        </ol>
      </div>
    </div>
  );
}
