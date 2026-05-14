-- WhatsApp instances per user
CREATE TABLE public.whatsapp_instances (
  user_id UUID NOT NULL PRIMARY KEY,
  instance_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_wa" ON public.whatsapp_instances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_wa" ON public.whatsapp_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_wa" ON public.whatsapp_instances
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_delete_wa" ON public.whatsapp_instances
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER touch_whatsapp_instances
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Conversation memory for the bot
CREATE TABLE public.bot_conversations (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_phone TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_conv ON public.bot_conversations(user_id, contact_phone, created_at);

ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_conv" ON public.bot_conversations
  FOR SELECT USING (auth.uid() = user_id);