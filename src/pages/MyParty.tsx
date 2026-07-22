import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Evento = Database['public']['Tables']['eventos']['Row'];
type Invitado = Database['public']['Tables']['invitados']['Row'];
type Interaccion = Database['public']['Tables']['interacciones_fiesta']['Row'];

export default function MyParty() {
  const { user, rol, loading, signOut } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [tab, setTab] = useState<'countdown' | 'invitacion' | 'invitados' | 'interacciones'>('countdown');
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0, past: false });

  const load = async () => {
    if (!user) return;
    const { data: e } = await supabase
      .from('eventos').select('*').eq('cumpleanera_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    setEvento(e);
    if (e) {
      const { data: inv } = await supabase.from('invitados').select('*').eq('evento_id', e.id).order('nombre_invitado');
      setInvitados(inv ?? []);
      const ids = (inv ?? []).map(i => i.id);
      if (ids.length) {
        const { data: it } = await supabase
          .from('interacciones_fiesta').select('*').in('invitado_id', ids)
          .order('creado_el', { ascending: false });
        setInteracciones(it ?? []);
      } else setInteracciones([]);
    }
  };
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!evento) return;
    const target = new Date(evento.fecha_cumpleanos).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown({ d: 0, h: 0, m: 0, s: 0, past: true }); return; }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        past: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [evento]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (rol !== 'cumpleanera' && rol !== 'admin') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p>Tu cuenta no tiene un evento asignado todavía.</p>
      <Link to="/" className="text-primary underline">Volver</Link>
    </div>
  );
  if (!evento) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p>Todavía no tenés un evento creado.</p>
      <p className="text-sm text-muted-foreground">Pedile al administrador que cree tu fiesta.</p>
      <button onClick={signOut} className="text-muted-foreground text-sm">Salir</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">🎂 Mi Fiesta</h1>
            <p className="text-sm text-muted-foreground">{evento.nombre_evento} · {new Date(evento.fecha_cumpleanos).toLocaleString()}</p>
          </div>
          <button onClick={signOut} className="text-sm text-muted-foreground">Salir</button>
        </header>

        <div className="flex gap-2 flex-wrap mb-6">
          {([
            ['countdown', '⏳ Contador'],
            ['invitacion', '💌 Mi Invitación'],
            ['invitados', `👥 Invitados (${invitados.length})`],
            ['interacciones', `💌 Interacciones (${interacciones.length})`],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'countdown' && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Faltan para tus 15 ✨</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {[
                { v: countdown.d, l: 'Días' },
                { v: countdown.h, l: 'Horas' },
                { v: countdown.m, l: 'Min' },
                { v: countdown.s, l: 'Seg' },
              ].map(({ v, l }) => (
                <div key={l} className="bg-primary/10 rounded-xl px-4 py-3 min-w-[80px]">
                  <div className="font-heading text-3xl font-bold text-primary">{v}</div>
                  <div className="text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            {countdown.past && <p className="mt-6 text-primary font-heading text-2xl">🎉 ¡Es tu día! Los mensajes ya se pueden ver 🎉</p>}
          </div>
        )}

        {tab === 'invitados' && (
          <InvitadosPanel eventoId={evento.id} invitados={invitados} onChange={load} origin={origin} />
        )}

        {tab === 'interacciones' && (
          <InteraccionesPanel
            interacciones={interacciones}
            invitados={invitados}
            revealDate={new Date(evento.fecha_cumpleanos)}
            onChange={load}
          />
        )}
      </div>
    </div>
  );
}

function InvitadosPanel({ eventoId, invitados, onChange, origin }: {
  eventoId: number; invitados: Invitado[]; onChange: () => void; origin: string;
}) {
  const [nombre, setNombre] = useState('');
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const { error } = await supabase.from('invitados').insert({ evento_id: eventoId, nombre_invitado: nombre.trim() });
    if (error) { toast.error(error.message); return; }
    setNombre(''); onChange();
  };

  return (
    <div>
      <form onSubmit={add} className="glass rounded-xl p-4 mb-4 flex gap-2">
        <input required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del invitado"
          className="flex-1 px-3 py-2 rounded border border-border bg-background text-sm" />
        <button className="bg-primary text-primary-foreground rounded px-4 text-sm">+ Agregar</button>
      </form>
      <div className="space-y-2">
        {invitados.map(g => {
          const link = `${origin}/invitado/${g.codigo_acceso}`;
          return (
            <div key={g.id} className="glass rounded-xl p-3 flex flex-wrap justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm">{g.nombre_invitado} {g.confirmado && '✅'}</p>
                <p className="text-xs text-muted-foreground truncate">Código: <code>{g.codigo_acceso}</code></p>
                <a href={link} target="_blank" rel="noreferrer" className="text-xs text-primary underline break-all">{link}</a>
              </div>
              <div className="flex gap-3 items-center">
                <button onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copiado'); }} className="text-xs text-primary">Copiar link</button>
                <label className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={g.confirmado} onChange={async e => {
                    await supabase.from('invitados').update({ confirmado: e.target.checked }).eq('id', g.id);
                    onChange();
                  }} /> Confirmó
                </label>
                <button onClick={async () => {
                  await supabase.from('invitados').delete().eq('id', g.id); onChange();
                }} className="text-destructive text-xs">×</button>
              </div>
            </div>
          );
        })}
        {invitados.length === 0 && <p className="text-muted-foreground text-center py-8">Aún no cargaste invitados.</p>}
      </div>
    </div>
  );
}

function InteraccionesPanel({ interacciones, invitados, revealDate, onChange }: {
  interacciones: Interaccion[]; invitados: Invitado[]; revealDate: Date; onChange: () => void;
}) {
  const isBirthday = Date.now() >= revealDate.getTime();
  const invMap = useMemo(() => Object.fromEntries(invitados.map(i => [i.id, i])), [invitados]);

  return (
    <div>
      <div className="glass rounded-xl p-4 mb-4 bg-secondary/20">
        <p className="text-sm">
          {isBirthday
            ? '🎉 Ya es el día del cumpleaños: los mensajes/fotos aprobados son visibles públicamente.'
            : `🔒 Los mensajes/fotos aprobados se revelarán el ${revealDate.toLocaleString()}. Podés moderarlos ahora.`}
        </p>
      </div>
      <div className="space-y-2">
        {interacciones.map(it => (
          <div key={it.id} className="glass rounded-xl p-4 flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">
                {it.tipo === 'foto' ? '📸 Foto' : '💌 Mensaje'} · {invMap[it.invitado_id]?.nombre_invitado ?? 'Invitado'} · {it.aprobado ? '✅ Aprobado' : '⏳ Pendiente'}
              </p>
              {it.tipo === 'foto'
                ? <img src={it.contenido} alt="" className="max-h-40 rounded" />
                : <p className="text-sm break-words">"{it.contenido}"</p>}
            </div>
            <div className="flex flex-col gap-1">
              {!it.aprobado && (
                <button onClick={async () => {
                  await supabase.from('interacciones_fiesta').update({ aprobado: true }).eq('id', it.id);
                  toast.success('Aprobado'); onChange();
                }} className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs">Aprobar</button>
              )}
              <button onClick={async () => {
                await supabase.from('interacciones_fiesta').delete().eq('id', it.id); onChange();
              }} className="text-destructive text-xs">Eliminar</button>
            </div>
          </div>
        ))}
        {interacciones.length === 0 && <p className="text-muted-foreground text-center py-8">Sin interacciones todavía.</p>}
      </div>
    </div>
  );
}
