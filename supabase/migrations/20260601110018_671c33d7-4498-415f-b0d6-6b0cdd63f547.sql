
-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  product_id UUID,
  product_name TEXT NOT NULL DEFAULT '',
  amount_kz NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | shipped | cancelled
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_select_orders ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY owner_insert_orders ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY owner_update_orders ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY owner_delete_orders ON public.orders FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX idx_orders_user_created ON public.orders(user_id, created_at DESC);

-- AI TRAINING
CREATE TABLE public.ai_training (
  user_id UUID PRIMARY KEY,
  tone TEXT NOT NULL DEFAULT '',
  rules TEXT NOT NULL DEFAULT '',
  objections TEXT NOT NULL DEFAULT '',
  custom_responses TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_training TO authenticated;
GRANT ALL ON public.ai_training TO service_role;
ALTER TABLE public.ai_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_select_ai ON public.ai_training FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY owner_insert_ai ON public.ai_training FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY owner_update_ai ON public.ai_training FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER ai_training_touch BEFORE UPDATE ON public.ai_training FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- USER SETTINGS extra columns
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'Auto Vendas IA',
  ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'Kz',
  ADD COLUMN IF NOT EXISTS default_greeting TEXT NOT NULL DEFAULT '';

-- PRODUCTS extra columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sku TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '';

-- CUSTOMER STATUS (per contact phone)
CREATE TABLE public.customer_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new', -- new | interested | negotiating | paid | lost
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, contact_phone)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_status TO authenticated;
GRANT ALL ON public.customer_status TO service_role;
ALTER TABLE public.customer_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_select_cs ON public.customer_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY owner_insert_cs ON public.customer_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY owner_update_cs ON public.customer_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY owner_delete_cs ON public.customer_status FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER cs_touch BEFORE UPDATE ON public.customer_status FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Allow bot (service_role already has access; also let owner insert conversations they may seed)
CREATE POLICY owner_insert_conv ON public.bot_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
