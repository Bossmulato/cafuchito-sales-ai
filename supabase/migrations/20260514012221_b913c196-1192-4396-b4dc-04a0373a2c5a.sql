
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_kz NUMERIC NOT NULL DEFAULT 0,
  benefits TEXT NOT NULL DEFAULT '',
  faq TEXT NOT NULL DEFAULT '',
  payment_data TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_delete_products" ON public.products FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.user_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  groq_api_key TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER products_touch BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER user_settings_touch BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
