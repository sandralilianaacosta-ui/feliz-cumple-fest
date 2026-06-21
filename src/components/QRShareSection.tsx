import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Copy, Check } from 'lucide-react';

export default function QRShareSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin + window.location.pathname;
  const celebrationUrl = baseUrl + '?celebration=1';

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, celebrationUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#d4618c', light: '#ffffff' },
      }).catch(() => {});
    }
  }, [celebrationUrl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qr-celebracion-victoria.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(celebrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Celebración de Victoria ✨',
          text: 'Escaneá este QR para dejarle tu saludo a Victoria 🎉',
          url: celebrationUrl,
        });
      } catch { /* ignore */ }
    }
  };

  return (
    <section id="qr" className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-heading italic text-4xl sm:text-5xl mb-3 text-primary">Compartí con amigos</h2>
        <p className="text-muted-foreground italic mb-8">
          Escaneá o compartí este código para que tus amigos y familia dejen sus saludos
        </p>

        <div className="bg-white rounded-3xl p-6 shadow-xl inline-block mb-6">
          <canvas ref={canvasRef} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition"
          >
            <Download size={18} /> Descargar
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 bg-white/70 text-foreground border border-border px-5 py-2.5 rounded-full font-medium hover:bg-white transition"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
          {typeof navigator !== 'undefined' && (navigator as Navigator).share && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-white/70 text-foreground border border-border px-5 py-2.5 rounded-full font-medium hover:bg-white transition"
            >
              <Share2 size={18} /> WhatsApp / TikTok
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
