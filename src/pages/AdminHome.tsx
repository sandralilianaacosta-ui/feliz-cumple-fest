import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { slugify } from '@/lib/party';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Party = Database['public']['Tables']['parties']['Row'];
type Sub = Database['public']['Tables']['subscriptions']['Row'];

export default function AdminHome() {
  const { user, roles, loading, signOut } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [tab, setTab] = useState<'parties' | 'subs'>('parties');
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    const [p, s] = await Promise.all([
      supabase.from('parties').select('*').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    ]);
    setParties(p.data ?? []);
    setSubs(s.data ?? []);
  };
  useEffect(() => { if (roles.includes('super_admin')) load(); }, [roles]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!roles.includes('super_admin')) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p>No tenés permisos de super administrador.</p>
      <Link to="/" className="text-primary underline">Volver</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold">🛠️ Panel Super Admin</h1>
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">Salir</button>
        </header>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('parties')} className={`px-4 py-2 rounded-lg ${tab === 'parties' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Fiestas ({parties.length})</button>
          <button onClick={() => setTab('subs')} className={`px-4 py-2 rounded-lg ${tab === 'subs' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Suscripciones ({subs.length})</button>
        </div>

        {tab === 'parties' && (
          <>
            <button onClick={() => setShowNew(true)} className="mb-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg">+ Nueva fiesta</button>
            {showNew && <NewPartyForm onClose={() => setShowNew(false)} onCreated={load} />}
            <div className="space-y-3">
              {parties.map(p => <PartyCard key={p.id} party={p} onChange={load} onNewSub={load} />)}
              {parties.length === 0 && <p className="text-muted-foreground text-center py-8">Aún no hay fiestas. Creá la primera.</p>}
            </div>
          </>
        )}

        {tab === 'subs' && (
          <div className="space-y-3">
            {subs.map(s => {
              const party = parties.find(p => p.id === s.party_id);
              return (
                <div key={s.id} className="glass rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{party?.name ?? '—'} · {s.plan}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.status} · {s.starts_at} → {s.expires_at ?? 'sin vencimiento'} · ${s.amount}
                    </p>
                    {s.notes && <p className="text-xs text-muted-foreground italic mt-1">{s.notes}</p>}
                  </div>
                  <button onClick={async () => {
                    await supabase.from('subscriptions').delete().eq('id', s.id);
                    toast.success('Suscripción eliminada'); load();
                  }} className="text-destructive text-sm">Eliminar</button>
                </div>
              );
            })}
            {subs.length === 0 && <p className="text-muted-foreground text-center py-8">Sin suscripciones aún.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function PartyCard({ party, onChange, onNewSub }: { party: Party; onChange: () => void; onNewSub: () => void }) {
  const [showSub, setShowSub] = useState(false);
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-lg">🎂 {party.name}</p>
          <p className="text-xs text-muted-foreground">Fecha: {party.birthday_date} · Slug: <code>{party.slug}</code></p>
          <p className="text-xs text-muted-foreground">Owner: {party.owner_id}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/fiesta/${party.slug}`} className="text-primary text-sm underline">Ver</Link>
          <button onClick={() => setShowSub(!showSub)} className="text-secondary-foreground text-sm underline">+ Suscripción</button>
          <button onClick={async () => {
            if (!confirm('¿Eliminar fiesta y todos sus datos?')) return;
            await supabase.from('parties').delete().eq('id', party.id);
            toast.success('Fiesta eliminada'); onChange();
          }} className="text-destructive text-sm">Eliminar</button>
        </div>
      </div>
      {showSub && <NewSubForm partyId={party.id} onDone={() => { setShowSub(false); onNewSub(); }} />}
    </div>
  );
}

function NewPartyForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Find user by email
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', ownerEmail).maybeSingle();
    if (!profile) {
      toast.error('No existe un usuario con ese email. Que primero cree su cuenta en /auth.');
      setBusy(false); return;
    }
    const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
    const { error } = await supabase.from('parties').insert({
      name, birthday_date: date, slug, owner_id: profile.id, hero_message: `¡Vamos a celebrar los 15 de ${name}!`,
    });
    if (error) { toast.error(error.message); setBusy(false); return; }
    // Assign quinceanera role
    await supabase.from('user_roles').insert({ user_id: profile.id, role: 'quinceanera' });
    toast.success('Fiesta creada');
    setBusy(false); onCreated(); onClose();
  };

  return (
    <form onSubmit={create} className="glass rounded-xl p-4 mb-4 space-y-3">
      <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la quinceañera"
        className="w-full px-3 py-2 rounded border border-border bg-background" />
      <input required type="date" value={date} onChange={e => setDate(e.target.value)}
        className="w-full px-3 py-2 rounded border border-border bg-background" />
      <input required type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="Email de la quinceañera (ya registrado)"
        className="w-full px-3 py-2 rounded border border-border bg-background" />
      <div className="flex gap-2">
        <button disabled={busy} className="bg-primary text-primary-foreground px-4 py-2 rounded">{busy ? '…' : 'Crear'}</button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-muted">Cancelar</button>
      </div>
    </form>
  );
}

function NewSubForm({ partyId, onDone }: { partyId: string; onDone: () => void }) {
  const [plan, setPlan] = useState('Básico');
  const [amount, setAmount] = useState('0');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  const create = async () => {
    const { error } = await supabase.from('subscriptions').insert({
      party_id: partyId, plan, amount: Number(amount), expires_at: expiresAt || null, notes,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Suscripción agregada'); onDone();
  };

  return (
    <div className="mt-3 p-3 bg-muted/40 rounded space-y-2">
      <input value={plan} onChange={e => setPlan(e.target.value)} placeholder="Plan" className="w-full px-2 py-1 rounded border border-border bg-background text-sm" />
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monto" className="w-full px-2 py-1 rounded border border-border bg-background text-sm" />
      <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full px-2 py-1 rounded border border-border bg-background text-sm" />
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas" className="w-full px-2 py-1 rounded border border-border bg-background text-sm" />
      <button onClick={create} className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">Guardar</button>
    </div>
  );
}
