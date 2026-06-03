
ALTER TABLE public.user_settings DROP COLUMN IF EXISTS groq_api_key;

CREATE POLICY "owner_delete_conversations" ON public.bot_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "owner_delete_settings" ON public.user_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Owner list product-images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
