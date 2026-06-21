import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { store, type Wish } from '@/lib/store';
import { ArrowDown } from 'lucide-react';

interface Props { name: string; onContinue: () => void }

export default function CelebrationScreen({ name, onContinue }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const firedRef = useRef(false);

  useEffect(() => {
    setWishes(store.getWishes().filter(w => w.approved));
    if (firedRef.current) return;
    firedRef.current = true;
    const end = Date.now() + 5000;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#d4618c', '#d4a24e', '#f0c8d8', '#ffffff'] });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#d4618c', '#d4a24e', '#f0c8d8', '#ffffff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 via-background to-card">
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-12 animate-fade-in-up">
        <p className="text-muted-foreground text-sm tracking-widest uppercase mb-4">✨ 18 de Agosto de 2026 ✨</p>
        <h1 className="font-heading text-5xl sm:text-7xl font-bold mb-2">¡Feliz Cumpleaños!</h1>
        <h2 className="font-heading text-3xl sm:text-5xl font-semibold text-primary italic mb-6">{name}</h2>
        <p className="text-lg text-muted-foreground max-w-xl mb-10">
          Hoy es tu gran día 🎉 Mirá todos los saludos que dejaron tus amigos y familia para vos.
        </p>
        <div className="glass rounded-2xl px-6 py-3 inline-flex items-center gap-2 animate-pulse-glow">
          <span className="font-heading text-xl text-primary font-bold">{wishes.length} saludos para vos</span>
        </div>
        <ArrowDown className="mt-10 text-primary animate-bounce" size={32} />
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-10">💌 Tus Saludos</h3>
          {wishes.length === 0 ? (
            <p className="text-center text-muted-foreground">Todavía no hay saludos publicados.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {wishes.map(w => (
                <div key={w.id} className="glass rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <span className="text-3xl mb-2 block">{w.emoji}</span>
                  <p className="text-foreground mb-3 leading-relaxed">"{w.message}"</p>
                  <p className="text-sm text-muted-foreground font-medium">— {w.author}</p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button onClick={onContinue}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:opacity-90 transition">
              Ver fotos, dejar un saludo y más ✨
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
