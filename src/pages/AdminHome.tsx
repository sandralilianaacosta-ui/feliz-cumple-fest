import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Evento = Database['public']['Tables']['eventos']['Row'];
type Usuario = Database['public']['Tables']['usuarios']['Row'];

export default function AdminHome() {
  const { user, rol, loading, signOut } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    const [e, u] = await Promise.all([
      supabase.from('eventos').select('*').order('created_at', { ascending: false }),
      supabase.from('usuarios').select('*').order('created_at', { ascending: false }),
    ]);
    setEventos(e.data ?? []);
    setUsuarios(u.data ?? []);
  };
  useEffect(() => { if (rol === 'admin') load(); }, [rol]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (rol !== 'admin') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p>No tenés permisos de administrador.</p>
      <Link to="/" className="text-primary underline">Volver</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold">🛠️ Panel Admin</h1>
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">Salir</button>
        </header>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Eventos ({eventos.length})</h2>
            <button onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm">+ Nuevo evento</button>
          </div>
          {showNew && (
            <NewEventoForm usuarios={usuarios} onClose={() => setShowNew(false)} onCreated={load} />
          )}
          <div className="space-y-3">
            {eventos.map(e => {
              const owner = usuarios.find(u => u.id === e.cumpleanera_id);
              return (
                <div key={e.id} className="glass rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-lg">🎂 {e.nombre_evento || '(sin nombre)'}</p>
                    <p className="text-xs text-muted-foreground">
                      Fecha: {new Date(e.fecha_cumpleanos).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cumpleañera: {owner?.nombre || owner?.email || e.cumpleanera_id}
                    </p>
                  </div>
                  <button onClick={async () => {
                    if (!confirm('¿Eliminar evento y todos sus datos?')) return;
                    const { error } = await supabase.from('eventos').delete().eq('id', e.id);
                    if (error) { toast.error(error.message); return; }
                    toast.success('Evento eliminado'); load();
                  }} className="text-destructive text-sm">Eliminar</button>
                </div>
              );
            })}
            {eventos.length === 0 && <p className="text-muted-foreground text-center py-8">Aún no hay eventos.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">Usuarios ({usuarios.length})</h2>
          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="glass rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{u.nombre || '(sin nombre)'}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · <span className="uppercase">{u.rol}</span></p>
                </div>
                {u.id !== user.id && (
                  <select value={u.rol} onChange={async e => {
                    const { error } = await supabase.from('usuarios').update({ rol: e.target.value as 'admin' | 'cumpleanera' }).eq('id', u.id);
                    if (error) { toast.error(error.message); return; }
                    load();
                  }} className="text-xs bg-background border border-border rounded px-2 py-1">
                    <option value="cumpleanera">cumpleanera</option>
                    <option value="admin">admin</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function NewEventoForm({ usuarios, onClose, onCreated }: { usuarios: Usuario[]; onClose: () => void; onCreated: () => void }) {
  const cumpleaneras = usuarios.filter(u => u.rol === 'cumpleanera');
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [ownerId, setOwnerId] = useState(cumpleaneras[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId) { toast.error('Elegí una cumpleañera'); return; }
    setBusy(true);
    const { error } = await supabase.from('eventos').insert({
      nombre_evento: nombre,
      fecha_cumpleanos: new Date(fecha).toISOString(),
      cumpleanera_id: ownerId,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Evento creado'); onCreated(); onClose();
  };

  return (
    <form onSubmit={create} className="glass rounded-xl p-4 mb-4 space-y-3">
      <input required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del evento (ej: Los 15 de Victoria)"
        className="w-full px-3 py-2 rounded border border-border bg-background" />
      <input required type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)}
        className="w-full px-3 py-2 rounded border border-border bg-background" />
      <select required value={ownerId} onChange={e => setOwnerId(e.target.value)}
        className="w-full px-3 py-2 rounded border border-border bg-background">
        <option value="">Elegí la cumpleañera</option>
        {cumpleaneras.map(u => (
          <option key={u.id} value={u.id}>{u.nombre || u.email}</option>
        ))}
      </select>
      {cumpleaneras.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No hay usuarias con rol cumpleañera. Primero que se registren en /auth.
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={busy} className="bg-primary text-primary-foreground px-4 py-2 rounded">{busy ? '…' : 'Crear'}</button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-muted">Cancelar</button>
      </div>
    </form>
  );
}
