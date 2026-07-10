import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Party = Database['public']['Tables']['parties']['Row'];
type Guest = Database['public']['Tables']['guests']['Row'];
type Wish = Database['public']['Tables']['wishes']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

export default function MyParty() {
  const { user, roles, loading, signOut } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tab, setTab] = useState<'countdown' | 'invitados' | 'deseos' | 'fotos' | 'config'>('countdown');
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase.from('parties').select('*').eq('owner_id', user.id).maybeSingle();
    setParty(p);
    if (p) {
      const [g, w, ph] = await Promise.all([
        supabase.from('guests').select('*').eq('party_id', p.id).order('name'),
        supabase.from('wishes').select('*').eq('party_id', p.id).order('created_at', { ascending: false }),
        supabase.from('photos').select('*').eq('party_id', p.id).order('created_at', { ascending: false }),
      ]);
      setGuests(g.data ?? []); setWishes(w.data ?? []); setPhotos(ph.data ?? []);
    }
  };
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!party) return;
    const target = new Date(party.birthday_date + 'T00:00:00').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [party]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!roles.includes('quinceanera') && !roles.includes('super_admin')) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p>Tu cuenta no está asignada a una fiesta todavía.</p>
      <p className="text-sm text-muted-foreground">Pedile al administrador que cree tu fiesta.</p>
      <Link to="/" className="text-primary underline">Volver</Link>
    </div>
  );
  if (!party) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p>No encontramos tu fiesta.</p>
      <button onClick={signOut} className="text-muted-foreground text-sm">Salir</button>
    </div>
  );

  const daysToGo = countdown.d;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">🎂 Mi Fiesta</h1>
            <p className="text-sm text-muted-foreground">{party.name} · {party.birthday_date}</p>
          </div>
          <div className="flex gap-3">
            <Link to={`/fiesta/${party.slug}`} className="text-sm text-primary underline">Ver mi página pública</Link>
            <button onClick={signOut} className="text-sm text-muted-foreground">Salir</button>
          </div>
        </header>

        <div className="flex gap-2 flex-wrap mb-6">
          {(['countdown', 'invitados', 'deseos', 'fotos', 'config'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg capitalize text-sm ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {t === 'countdown' ? '⏳ Countdown' : t === 'invitados' ? `👥 Invitados (${guests.length})` : t === 'deseos' ? `💌 Deseos (${wishes.length})` : t === 'fotos' ? `📸 Fotos (${photos.length})` : '⚙️ Config'}
            </button>
          ))}
        </div>

        {tab === 'countdown' && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Faltan para tus 15 ✨</p>
            <div className="flex justify-center gap-4">
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
            {daysToGo === 0 && <p className="mt-6 text-primary font-heading text-xl">🎉 ¡Es hoy! 🎉</p>}
          </div>
        )}

        {tab === 'invitados' && <GuestsPanel partyId={party.id} guests={guests} onChange={load} />}

        {tab === 'deseos' && (
          <div>
            <div className="glass rounded-xl p-4 mb-4 bg-secondary/20">
              <p className="text-sm">🔒 Los deseos se publican automáticamente el <strong>{party.birthday_date}</strong>. Podés verlos y moderarlos desde acá.</p>
            </div>
            <div className="space-y-2">
              {wishes.map(w => (
                <div key={w.id} className="glass rounded-xl p-4 flex justify-between items-start">
                  <div className="flex gap-3 items-start">
                    <span className="text-2xl">{w.emoji}</span>
                    <div>
                      <p className="text-sm">"{w.message}"</p>
                      <p className="text-xs text-muted-foreground mt-1">— {w.author} · {w.approved ? '✅ Aprobado' : '⏳ Pendiente'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!w.approved && (
                      <button onClick={async () => {
                        await supabase.from('wishes').update({ approved: true }).eq('id', w.id);
                        toast.success('Aprobado'); load();
                      }} className="text-accent-foreground bg-accent px-2 py-1 rounded text-xs">Aprobar</button>
                    )}
                    <button onClick={async () => {
                      await supabase.from('wishes').delete().eq('id', w.id); load();
                    }} className="text-destructive text-xs">Eliminar</button>
                  </div>
                </div>
              ))}
              {wishes.length === 0 && <p className="text-muted-foreground text-center py-8">Sin deseos aún.</p>}
            </div>
          </div>
        )}

        {tab === 'fotos' && (
          <div className="space-y-2">
            {photos.map(p => (
              <div key={p.id} className="glass rounded-xl p-4 flex items-center gap-4">
                <img src={p.url} className="w-20 h-20 object-cover rounded" alt="" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{p.author}</p>
                  <p className="text-xs text-muted-foreground">{p.approved ? '✅ Aprobada' : '⏳ Pendiente'}</p>
                </div>
                <div className="flex gap-2">
                  {!p.approved && (
                    <button onClick={async () => {
                      await supabase.from('photos').update({ approved: true }).eq('id', p.id); load();
                    }} className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs">Aprobar</button>
                  )}
                  <button onClick={async () => {
                    await supabase.from('photos').delete().eq('id', p.id); load();
                  }} className="text-destructive text-xs">Eliminar</button>
                </div>
              </div>
            ))}
            {photos.length === 0 && <p className="text-muted-foreground text-center py-8">Sin fotos aún.</p>}
          </div>
        )}

        {tab === 'config' && <ConfigPanel party={party} onSaved={load} />}
      </div>
    </div>
  );
}

function GuestsPanel({ partyId, guests, onChange }: { partyId: string; guests: Guest[]; onChange: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from('guests').insert({ party_id: partyId, name: name.trim(), email: email || null, phone: phone || null });
    if (error) { toast.error(error.message); return; }
    setName(''); setEmail(''); setPhone(''); onChange();
  };

  return (
    <div>
      <form onSubmit={add} className="glass rounded-xl p-4 mb-4 grid sm:grid-cols-4 gap-2">
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="px-3 py-2 rounded border border-border bg-background text-sm" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 rounded border border-border bg-background text-sm" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono" className="px-3 py-2 rounded border border-border bg-background text-sm" />
        <button className="bg-primary text-primary-foreground rounded text-sm">+ Agregar</button>
      </form>
      <div className="space-y-2">
        {guests.map(g => (
          <div key={g.id} className="glass rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-sm">{g.name}</p>
              <p className="text-xs text-muted-foreground">{g.email} {g.phone && `· ${g.phone}`}</p>
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs flex items-center gap-1">
                <input type="checkbox" checked={g.confirmed} onChange={async e => {
                  await supabase.from('guests').update({ confirmed: e.target.checked }).eq('id', g.id); onChange();
                }} /> Confirmó
              </label>
              <button onClick={async () => { await supabase.from('guests').delete().eq('id', g.id); onChange(); }} className="text-destructive text-xs">×</button>
            </div>
          </div>
        ))}
        {guests.length === 0 && <p className="text-muted-foreground text-center py-8">Aún no cargaste invitados.</p>}
      </div>
    </div>
  );
}

function ConfigPanel({ party, onSaved }: { party: Party; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: party.name,
    birthday_date: party.birthday_date,
    hero_message: party.hero_message,
    transfer_alias: party.transfer_alias,
    transfer_cbu: party.transfer_cbu,
    mercado_pago_link: party.mercado_pago_link,
  });
  const save = async () => {
    const { error } = await supabase.from('parties').update(form).eq('id', party.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Guardado'); onSaved();
  };

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 rounded border border-border bg-background" />
    </div>
  );

  return (
    <div className="glass rounded-2xl p-6 space-y-3">
      {field('name', 'Nombre')}
      {field('birthday_date', 'Fecha', 'date')}
      {field('hero_message', 'Mensaje principal')}
      {field('transfer_alias', 'Alias')}
      {field('transfer_cbu', 'CBU')}
      {field('mercado_pago_link', 'Link Mercado Pago')}
      <button onClick={save} className="w-full bg-primary text-primary-foreground py-2 rounded">Guardar</button>
    </div>
  );
}
