import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhotoItem { id: string; url: string; author: string; approved: boolean }

interface Props { partyId: string; photos: PhotoItem[]; onUpdate: () => void }

export default function PhotoGallery({ partyId, photos, onUpdate }: Props) {
  const [author, setAuthor] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const approved = photos.filter(p => p.approved);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!preview || !author.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('photos').insert({
      party_id: partyId, url: preview, author: author.trim(), approved: false,
    });
    setBusy(false);
    if (error) { toast.error('No se pudo enviar la foto'); return; }
    toast.success('Foto enviada. Será revisada antes de publicarse.');
    setPreview(null); setAuthor('');
    onUpdate();
  };

  return (
    <section id="fotos" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center text-foreground mb-2">📸 Galería de Fotos</h2>
        <p className="text-muted-foreground text-center mb-8">Compartí tus mejores momentos de la celebración</p>

        <div className="glass rounded-2xl p-6 mb-10">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Tu nombre" className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg font-medium text-secondary-foreground hover:opacity-80 transition">
              <Upload size={18} /> Galería
            </button>
            <button onClick={() => cameraRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg font-medium text-primary-foreground hover:opacity-80 transition">
              <Camera size={18} /> Cámara
            </button>
          </div>
          {preview && (
            <div className="space-y-3">
              <img src={preview} alt="Vista previa" className="w-full max-h-64 object-contain rounded-lg" />
              <div className="flex gap-2">
                <button onClick={submit} disabled={busy} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar foto'}</button>
                <button onClick={() => setPreview(null)} className="px-4 py-2 bg-muted rounded-lg text-muted-foreground">Cancelar</button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Tu foto será revisada antes de publicarse ✨</p>
            </div>
          )}
        </div>

        {approved.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {approved.map(p => (
              <button key={p.id} onClick={() => setLightbox(p.url)} className="group relative aspect-square rounded-xl overflow-hidden">
                <img src={p.url} alt={`Foto de ${p.author}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                  <span className="text-xs text-primary-foreground font-medium">{p.author}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Sé el primero en compartir una foto 📷</p>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-primary-foreground" onClick={() => setLightbox(null)}><X size={32} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-xl" />
        </div>
      )}
    </section>
  );
}
