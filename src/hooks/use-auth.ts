import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const OWNER_EMAIL = "owner@autovendas.local";
const OWNER_PASSWORD = "AutoVendas#Owner-2026!";

let autoLoginPromise: Promise<void> | null = null;

async function ensureOwnerSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });
  if (error) {
    const { error: signUpError } = await supabase.auth.signUp({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });
    if (signUpError && !signUpError.message.toLowerCase().includes("registered")) {
      throw signUpError;
    }
    await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setSession(data.session);
        setLoading(false);
        return;
      }
      if (!autoLoginPromise) autoLoginPromise = ensureOwnerSession();
      try {
        await autoLoginPromise;
        const { data: after } = await supabase.auth.getSession();
        setSession(after.session);
      } catch (e) {
        console.error("Auto-login falhou:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}
