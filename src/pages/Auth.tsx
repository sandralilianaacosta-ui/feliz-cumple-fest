import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Auth() {
  const nav = useNavigate();
  const { usuario, rol, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);

  // Redirección automática si ya hay sesión activa al entrar a /auth
  useEffect(() => {
    if (!loading && rol) {
      nav(rol === 'admin' ? '/admin' : '/mi-fiesta', { replace: true });
    }
  }, [loading, rol, nav]);

  // Redirección automática después del login según el rol cargado
  useEffect(() => {
    if (rol) {
      nav(rol === 'admin' ? '/admin' : '/mi-fiesta', { replace: true });
    }
  }, [rol, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success('Cuenta creada. Revisá tu email para confirmar y acceder.');
          return;
        }
        toast.success('Cuenta creada. Redirigiendo…');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Ingresaste correctamente. Redirigiendo…');
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold text-center mb-2">
          {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          Acceso para administradores y quinceañeras
        </p>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nombre completo"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30" />
          )}
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30" />
          <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30" />
          <button disabled={busy} className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium disabled:opacity-50">
            {busy ? '…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-sm text-muted-foreground mt-4 hover:text-foreground">
          {mode === 'signin' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      </div>
    </div>
  );
}

