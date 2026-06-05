
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_methods text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_methods text NOT NULL DEFAULT '';

ALTER TABLE public.ai_training
  ADD COLUMN IF NOT EXISTS extra_info text NOT NULL DEFAULT '';
