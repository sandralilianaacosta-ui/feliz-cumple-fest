import { Church, MapPin, Calendar, Clock } from 'lucide-react';
import type { Settings } from '@/lib/store';

interface Props { settings: Settings }

export default function MisaInvitation({ settings }: Props) {
  const dateLabel = (() => {
    try {
      return new Date(settings.birthdayDate + 'T00:00:00').toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return settings.birthdayDate; }
  })();

  return (
    <section id="misa" className="py-16 px-4">
      <div className="max-w-2xl mx-auto glass rounded-3xl p-8 sm:p-10 text-center animate-fade-in-up">
        <Church className="mx-auto mb-4 text-primary" size={40} />
        <p className="text-muted-foreground text-sm tracking-widest uppercase mb-2">⛪ Invitación Especial</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
          Misa de 15 Años
        </h2>
        <p className="font-heading text-xl text-primary italic mb-6">
          {settings.name}
        </p>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Con inmensa alegría, te invitamos a acompañarnos en la ceremonia religiosa
          en agradecimiento por estos hermosos 15 años. Tu presencia hará este momento aún más especial.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
          <div className="bg-background/50 rounded-xl p-4">
            <Calendar className="text-primary mb-2" size={20} />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha</p>
            <p className="font-medium capitalize">{dateLabel}</p>
          </div>
          <div className="bg-background/50 rounded-xl p-4">
            <Clock className="text-primary mb-2" size={20} />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Hora</p>
            <p className="font-medium">19:00 hs</p>
          </div>
          <div className="bg-background/50 rounded-xl p-4">
            <MapPin className="text-primary mb-2" size={20} />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Lugar</p>
            <p className="font-medium">Parroquia Nuestra Señora</p>
          </div>
        </div>

        <p className="font-heading text-lg text-primary italic">
          "Te esperamos para compartir este momento de fe y alegría"
        </p>
      </div>
    </section>
  );
}
