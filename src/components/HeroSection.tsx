import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import heroBg from '@/assets/hero-bg.jpg';
import type { Settings } from '@/lib/store';

interface Props {
  settings: Settings;
}

export default function HeroSection({ settings }: Props) {
  const [countdown, setCountdown] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const target = new Date(settings.birthdayDate + 'T00:00:00').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        if (!firedRef.current) {
          firedRef.current = true;
          const end = Date.now() + 3000;
          const frame = () => {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#d4618c', '#d4a24e', '#f0c8d8'] });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#d4618c', '#d4a24e', '#f0c8d8'] });
            if (Date.now() < end) requestAnimationFrame(frame);
          };
          frame();
        }
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown({ days, hours, mins, secs });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings.birthdayDate]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background/80" />
      <div className="relative z-10 text-center px-4 animate-fade-in-up max-w-2xl">
        <p className="text-muted-foreground font-body text-sm tracking-widest uppercase mb-4">✨ Celebración Especial ✨</p>
        <h1 className="font-heading text-5xl sm:text-7xl font-bold text-foreground mb-2">
          ¡Feliz Cumpleaños!
        </h1>
        <h2 className="font-heading text-3xl sm:text-5xl font-semibold text-primary italic mb-6">
          {settings.name}
        </h2>
        <p className="text-muted-foreground text-lg mb-8">{settings.heroMessage}</p>

        {countdown ? (
          <div className="flex justify-center gap-4">
            {[
              { val: countdown.days, label: 'Días' },
              { val: countdown.hours, label: 'Horas' },
              { val: countdown.mins, label: 'Min' },
              { val: countdown.secs, label: 'Seg' },
            ].map(({ val, label }) => (
              <div key={label} className="glass rounded-xl px-4 py-3 min-w-[70px]">
                <div className="font-heading text-2xl sm:text-3xl font-bold text-primary">{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl px-8 py-4 inline-block animate-pulse-glow">
            <span className="font-heading text-2xl text-primary font-bold">🎉 ¡Hoy es el gran día! 🎉</span>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="#fotos" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">📸 Subir Fotos</a>
          <a href="#deseos" className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">💌 Dejar Deseos</a>
          <a href="#regalos" className="bg-accent text-accent-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">🎁 Regalos</a>
        </div>
      </div>
    </section>
  );
}
