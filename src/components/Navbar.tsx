import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '#misa', label: '⛪ Misa' },
  { href: '#fotos', label: '📸 Fotos' },
  { href: '#deseos', label: '💌 Deseos' },
  { href: '#qr', label: '🔗 Compartir' },
  { href: '#regalos', label: '🎁 Regalos' },
  { href: '#recuerdos', label: '🕰️ Recuerdos' },
  { href: '#contacto', label: '📞 Contacto' },
];

export default function Navbar({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <a href="#" className="font-heading text-lg font-bold text-primary">🎂 {name}</a>
        <div className="hidden sm:flex gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition">{l.label}</a>
          ))}
        </div>
        <button className="sm:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <div className="sm:hidden glass border-t border-border px-4 pb-4 space-y-2">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">{l.label}</a>
          ))}
        </div>
      )}
    </nav>
  );
}
