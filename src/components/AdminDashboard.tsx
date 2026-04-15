import { useState } from 'react';
import { store, type Photo, type Wish, type GiftConfirmation, type Settings, ADMIN_PASSWORD } from '@/lib/store';
import { Check, Trash2, Lock, LogOut, Image, MessageSquare, Gift, Settings as SettingsIcon } from 'lucide-react';

interface Props { onUpdate: () => void }

export default function AdminDashboard({ onUpdate }: Props) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'photos' | 'wishes' | 'gifts' | 'settings'>('photos');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [gifts, setGifts] = useState<GiftConfirmation[]>([]);
  const [settings, setSettings] = useState<Settings>(store.getSettings());

  const refresh = () => {
    setPhotos(store.getPhotos());
    setWishes(store.getWishes());
    setGifts(store.getGifts());
    setSettings(store.getSettings());
  };

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setError(''); refresh(); }
    else setError('Contraseña incorrecta');
  };

  if (!authed) {
    return (
      <section id="admin" className="py-16 px-4">
        <div className="max-w-sm mx-auto glass rounded-2xl p-8 text-center">
          <Lock className="mx-auto mb-4 text-primary" size={32} />
          <h2 className="font-heading text-2xl font-bold mb-4">Panel de Admin</h2>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Contraseña" className="w-full px-4 py-2 rounded-lg border border-border bg-background mb-3 focus:ring-2 focus:ring-primary/30 outline-none" />
          {error && <p className="text-destructive text-sm mb-3">{error}</p>}
          <button onClick={login} className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium">Ingresar</button>
          <p className="text-xs text-muted-foreground mt-3">Demo: cumple2026</p>
        </div>
      </section>
    );
  }

  const tabs = [
    { key: 'photos' as const, icon: Image, label: 'Fotos', count: photos.filter(p => !p.approved).length },
    { key: 'wishes' as const, icon: MessageSquare, label: 'Deseos', count: wishes.filter(w => !w.approved).length },
    { key: 'gifts' as const, icon: Gift, label: 'Regalos', count: gifts.length },
    { key: 'settings' as const, icon: SettingsIcon, label: 'Config', count: 0 },
  ];

  return (
    <section id="admin" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">⚙️ Panel de Admin</h2>
          <button onClick={() => setAuthed(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><LogOut size={16} /> Salir</button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); refresh(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              <t.icon size={16} /> {t.label} {t.count > 0 && <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'photos' && (
          <div className="space-y-3">
            {photos.length === 0 && <p className="text-muted-foreground text-center">No hay fotos</p>}
            {photos.map(p => (
              <div key={p.id} className="glass rounded-xl p-4 flex items-center gap-4">
                <img src={p.dataUrl} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-medium">{p.author}</p>
                  <p className="text-xs text-muted-foreground">{p.approved ? '✅ Aprobada' : '⏳ Pendiente'}</p>
                </div>
                <div className="flex gap-2">
                  {!p.approved && <button onClick={() => { store.approvePhoto(p.id); refresh(); onUpdate(); }} className="p-2 bg-accent rounded-lg text-accent-foreground"><Check size={16} /></button>}
                  <button onClick={() => { store.deletePhoto(p.id); refresh(); onUpdate(); }} className="p-2 bg-destructive/10 rounded-lg text-destructive"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'wishes' && (
          <div className="space-y-3">
            {wishes.length === 0 && <p className="text-muted-foreground text-center">No hay deseos</p>}
            {wishes.map(w => (
              <div key={w.id} className="glass rounded-xl p-4 flex items-start gap-4">
                <span className="text-2xl">{w.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm">"{w.message}"</p>
                  <p className="text-xs text-muted-foreground mt-1">— {w.author} {w.approved ? '✅' : '⏳'}</p>
                </div>
                <div className="flex gap-2">
                  {!w.approved && <button onClick={() => { store.approveWish(w.id); refresh(); onUpdate(); }} className="p-2 bg-accent rounded-lg text-accent-foreground"><Check size={16} /></button>}
                  <button onClick={() => { store.deleteWish(w.id); refresh(); onUpdate(); }} className="p-2 bg-destructive/10 rounded-lg text-destructive"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'gifts' && (
          <div className="space-y-3">
            {gifts.length === 0 && <p className="text-muted-foreground text-center">No hay regalos confirmados</p>}
            {gifts.map(g => (
              <div key={g.id} className="glass rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="font-medium">{g.author}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{g.type}</span>
                </div>
                {g.message && <p className="text-sm text-muted-foreground mt-1">{g.message}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre de la cumpleañera</label>
              <input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de cumpleaños</label>
              <input type="date" value={settings.birthdayDate} onChange={e => setSettings({ ...settings, birthdayDate: e.target.value })}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Mensaje del hero</label>
              <input value={settings.heroMessage} onChange={e => setSettings({ ...settings, heroMessage: e.target.value })}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Alias de transferencia</label>
              <input value={settings.transferAlias} onChange={e => setSettings({ ...settings, transferAlias: e.target.value })}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">CBU</label>
              <input value={settings.transferCBU} onChange={e => setSettings({ ...settings, transferCBU: e.target.value })}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Link Mercado Pago</label>
              <input value={settings.mercadoPagoLink} onChange={e => setSettings({ ...settings, mercadoPagoLink: e.target.value })}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <button onClick={() => { store.updateSettings(settings); onUpdate(); }}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium">Guardar cambios</button>
          </div>
        )}
      </div>
    </section>
  );
}
