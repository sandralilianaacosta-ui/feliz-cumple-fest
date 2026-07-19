import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'cumpleanera';

interface UsuarioRow {
  id: string;
  nombre: string;
  email: string | null;
  rol: AppRole;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  usuario: UsuarioRow | null;
  rol: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, usuario: null, rol: null, loading: true,
  signOut: async () => {}, refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<UsuarioRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUsuario = async (uid: string | undefined) => {
    if (!uid) { setUsuario(null); return; }
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol')
      .eq('id', uid)
      .maybeSingle();
    setUsuario((data as UsuarioRow) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setTimeout(() => loadUsuario(s?.user?.id), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadUsuario(data.session?.user?.id).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{
      session,
      user: session?.user ?? null,
      usuario,
      rol: usuario?.rol ?? null,
      loading,
      signOut: async () => { await supabase.auth.signOut(); },
      refresh: async () => loadUsuario(session?.user?.id),
    }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
