import { useState } from 'react';
import { store, type Wish } from '@/lib/store';

const EMOJIS = ['🎂', '🥳', '💖', '🌟', '🎉', '🎈', '🎁', '✨', '💐', '🦋'];

interface Props { wishes: Wish[]; onUpdate: () => void }

export default function WishesWall({ wishes, onUpdate }: Props) {
  const [msg, setMsg] = useState('');
  const [author, setAuthor] = useState('');
  const [emoji, setEmoji] = useState('💖');

  const approved = wishes.filter(w => w.approved);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !author.trim()) return;
    store.addWish({ message: msg.trim(), author: author.trim(), emoji });
    setMsg(''); setAuthor('');
    onUpdate();
  };

  return (
    <section id="deseos" className="py-16 px-4 bg-card">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-2">💌 Muro de Deseos</h2>
        <p className="text-muted-foreground text-center mb-8">Dejá tu mensaje especial para la cumpleañera</p>

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
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition">Enviar deseo {emoji}</button>
          </div>
          <p className="text-xs text-muted-foreground text-center">Tu mensaje será revisado antes de publicarse ✨</p>
        </form>

        {approved.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {approved.map(w => (
              <div key={w.id} className="glass rounded-xl p-5 hover:shadow-lg transition-shadow">
                <span className="text-3xl mb-2 block">{w.emoji}</span>
                <p className="text-foreground mb-3 leading-relaxed">"{w.message}"</p>
                <p className="text-sm text-muted-foreground font-medium">— {w.author}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Sé el primero en dejar un deseo 💫</p>
        )}
      </div>
    </section>
  );
}
