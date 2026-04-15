import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { store, type Settings } from '@/lib/store';

interface Props { settings: Settings; onUpdate: () => void }

export default function GiftSection({ settings, onUpdate }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [envelopeName, setEnvelopeName] = useState('');
  const [envelopeMsg, setEnvelopeMsg] = useState('');
  const [sent, setSent] = useState(false);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const confirmEnvelope = () => {
    if (!envelopeName.trim()) return;
    store.addGift({ type: 'envelope', author: envelopeName.trim(), message: envelopeMsg || 'Regalo en sobre' });
    setEnvelopeName(''); setEnvelopeMsg('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    onUpdate();
  };

  return (
    <section id="regalos" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-2">🎁 Regalos</h2>
        <p className="text-muted-foreground text-center mb-10">Si querés agasajar a {settings.name}, acá van algunas opciones</p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Transfer */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading text-xl font-semibold">💳 Transferencia</h3>
            <div>
              <label className="text-xs text-muted-foreground">Alias</label>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="flex-1 font-mono text-sm">{settings.transferAlias}</span>
                <button onClick={() => copy(settings.transferAlias, 'alias')} className="text-primary">
                  {copied === 'alias' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">CBU</label>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="flex-1 font-mono text-xs break-all">{settings.transferCBU}</span>
                <button onClick={() => copy(settings.transferCBU, 'cbu')} className="text-primary">
                  {copied === 'cbu' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mercado Pago */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading text-xl font-semibold">📱 Mercado Pago</h3>
            <p className="text-sm text-muted-foreground">Podés enviar tu regalo por Mercado Pago de forma rápida y segura.</p>
            <a href={settings.mercadoPagoLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[hsl(200,80%,50%)] text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition w-full">
              <ExternalLink size={18} /> Ir a Mercado Pago
            </a>
          </div>

          {/* Wishlist */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading text-xl font-semibold">📋 Lista de Deseos</h3>
            <ul className="space-y-2">
              {settings.wishlistItems.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Envelope */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading text-xl font-semibold">💌 Regalo en Sobre</h3>
            <p className="text-sm text-muted-foreground">¿Vas a traer un sobre al evento? Avisanos así lo esperamos.</p>
            <input value={envelopeName} onChange={e => setEnvelopeName(e.target.value)} placeholder="Tu nombre"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none text-sm" />
            <input value={envelopeMsg} onChange={e => setEnvelopeMsg(e.target.value)} placeholder="Mensaje (opcional)"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none text-sm" />
            <button onClick={confirmEnvelope} className="w-full bg-accent text-accent-foreground py-2 rounded-lg font-medium hover:opacity-90 transition">
              {sent ? '✅ ¡Confirmado!' : 'Confirmar sobre'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
