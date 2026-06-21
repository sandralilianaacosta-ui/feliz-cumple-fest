import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Copy, Check } from 'lucide-react';

export default function QRScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin + window.location.pathname;
  const celebrationUrl = baseUrl + '?celebration=1';

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, celebrationUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#d4618c',
          light: '#ffffff',
        },
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
          text: 'Escaneá este QR para ver todos los saludos de cumpleaños de Victoria 🎉',
          url: celebrationUrl,
        });
      } catch { /* ignore */ }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 via-background to-card flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        <p className="text-muted-foreground text-sm tracking-widest uppercase mb-4">✨ 18 de Agosto de 2026 ✨</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2">QR de Celebración</h1>
        <h2 className="font-heading text-xl sm:text-2xl font-semibold text-primary italic mb-6">Victoria</h2>
        <p className="text-muted-foreground mb-8">
          Escaneá este código para acceder directamente a la pantalla de saludos el día del cumpleaños.
        </p>

        <div className="bg-white rounded-3xl p-6 shadow-xl inline-block mb-8">
          <canvas ref={canvasRef} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition"
          >
            <Download size={18} /> Descargar QR
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 bg-card text-foreground border border-border px-5 py-2.5 rounded-full font-medium hover:bg-muted transition"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
          {navigator.share && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-card text-foreground border border-border px-5 py-2.5 rounded-full font-medium hover:bg-muted transition"
            >
              <Share2 size={18} /> Compartir
            </button>
          )}
        </div>

        <div className="glass rounded-2xl p-4 text-left">
          <p className="text-sm text-muted-foreground mb-2 font-medium">Link directo:</p>
          <code className="block text-xs bg-muted rounded-lg p-3 break-all text-foreground">
            {celebrationUrl}
          </code>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Ideal para compartir por WhatsApp, TikTok o imprimir en la invitación.
        </p>
      </div>
    </div>
  );
}
