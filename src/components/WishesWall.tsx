import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EMOJIS = ['🎂', '🥳', '💖', '🌟', '🎉', '🎈', '🎁', '✨', '💐', '🦋'];

export interface WishItem { id: string; message: string; author: string; emoji: string; approved: boolean }

interface Props { partyId: string; wishes: WishItem[]; birthdayDate: string; onUpdate: () => void }

export default function WishesWall({ partyId, wishes, birthdayDate, onUpdate }: Props) {
  const [msg, setMsg] = useState('');
  const [author, setAuthor] = useState('');
  const [emoji, setEmoji] = useState('💖');
  const [busy, setBusy] = useState(false);

  const isBirthday = new Date().toISOString().slice(0, 10) >= birthdayDate;
  const visible = wishes.filter(w => w.approved);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !author.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('wishes').insert({
      party_id: partyId, message: msg.trim(), author: author.trim(), emoji, approved: false,
    });
    setBusy(false);
    if (error) { toast.error('No se pudo enviar el deseo'); return; }
    toast.success('¡Deseo enviado! Se publicará el día del cumpleaños.');
    setMsg(''); setAuthor('');
    onUpdate();
  };

  return (
    <section id="deseos" className="py-16 px-4 bg-card">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-2">💌 Muro de Deseos</h2>
        <p className="text-muted-foreground text-center mb-8">
          {isBirthday
            ? 'Dejá tu mensaje especial para la cumpleañera'
            : 'Dejá tu mensaje. Todos los saludos se revelarán el día del cumpleaños ✨'}
        </p>

        <form onSubmit={submit} className="glass rounded-2xl p-6 mb-10 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => setEmoji(e)}
                className={`text-2xl p-2 rounded-lg transition ${emoji === e ? 'bg-primary/20 scale-110' : 'hover:bg-muted'}`}>{e}</button>
            ))}
          </div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Tu mensaje de felicitación..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none resize-none" rows={3} />
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Tu nombre" className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            <button type="submit" disabled={busy} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
              {busy ? 'Enviando…' : `Enviar deseo ${emoji}`}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {isBirthday ? 'Tu mensaje será revisado antes de publicarse ✨' : '🔒 Los deseos se mantienen ocultos hasta el día del cumpleaños'}
          </p>
        </form>

        {isBirthday && visible.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {visible.map(w => (
              <div key={w.id} className="glass rounded-xl p-5 hover:shadow-lg transition-shadow">
                <span className="text-3xl mb-2 block">{w.emoji}</span>
                <p className="text-foreground mb-3 leading-relaxed">"{w.message}"</p>
                <p className="text-sm text-muted-foreground font-medium">— {w.author}</p>
              </div>
            ))}
          </div>
        ) : !isBirthday ? (
          <p className="text-center text-muted-foreground italic">🎁 Los saludos se revelarán el día del cumpleaños</p>
        ) : (
          <p className="text-center text-muted-foreground">Sé el primero en dejar un deseo 💫</p>
        )}
      </div>
    </section>
  );
}
