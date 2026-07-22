import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvitadoInfo {
  invitado_id: number;
  nombre_invitado: string;
  evento_id: number;
  fecha_cumpleanos: string;
  nombre_evento: string;
}

interface PublicInteraccion {
  id: number;
  tipo: 'mensaje' | 'foto';
  contenido: string;
  creado_el: string;
}

export default function GuestView() {
  const { codigo } = useParams<{ codigo: string }>();
  const [info, setInfo] = useState<InvitadoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publicItems, setPublicItems] = useState<PublicInteraccion[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!codigo) return;
    (async () => {
      const { data, error } = await supabase.rpc('validar_codigo_invitado', { codigo });
      if (error || !data || data.length === 0) { setInvalid(true); setLoading(false); return; }
      const row = data[0] as InvitadoInfo;
      setInfo(row);
      // Load public interactions (only visible after birthday date via RLS)
      const { data: pub } = await supabase
        .from('interacciones_fiesta')
        .select('id, tipo, contenido, creado_el, invitado_id, invitados!inner(evento_id)')
        .eq('invitados.evento_id', row.evento_id)
        .eq('aprobado', true)
        .order('creado_el', { ascending: false });
      setPublicItems((pub as unknown as PublicInteraccion[]) ?? []);
      setLoading(false);
    })();
  }, [codigo]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const enviarMensaje = async () => {
    if (!info || !mensaje.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('interacciones_fiesta').insert({
      invitado_id: info.invitado_id, tipo: 'mensaje', contenido: mensaje.trim(), aprobado: false,
    });
    setBusy(false);
    if (error) { toast.error('No se pudo enviar'); return; }
    toast.success('¡Mensaje enviado! Se publicará el día del cumpleaños.');
    setMensaje('');
  };

  const enviarFoto = async () => {
    if (!info || !preview) return;
    setBusy(true);
    const { error } = await supabase.from('interacciones_fiesta').insert({
      invitado_id: info.invitado_id, tipo: 'foto', contenido: preview, aprobado: false,
    });
    setBusy(false);
    if (error) { toast.error('No se pudo enviar la foto'); return; }
    toast.success('¡Foto enviada! Se publicará el día del cumpleaños.');
    setPreview(null);
  };

  const confirmar = async () => {
    if (!info) return;
    const { error } = await supabase.from('invitados').update({ confirmado: true }).eq('id', info.invitado_id);
    if (error) { toast.error(error.message); return; }
    toast.success('¡Confirmaste tu asistencia!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  if (invalid || !info) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-xl mb-2">Este código no es válido 🥺</p>
      <p className="text-muted-foreground text-sm">Pedile a la cumpleañera que te comparta el link correcto.</p>
    </div>
  );

  const isBirthday = new Date(info.fecha_cumpleanos).getTime() <= Date.now();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2">
            🎉 {info.nombre_evento || 'Fiesta de 15'} 🎉
          </h1>
          <p className="text-lg">¡Hola, <strong>{info.nombre_invitado}</strong>!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(info.fecha_cumpleanos).toLocaleString()}
          </p>
        </div>

     {/*  <div className="glass rounded-2xl p-6 mb-6 text-center">
          <button onClick={confirmar} className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium">
            ✨ Confirmar asistencia
          </button>
        </div>*/}

        <div className="glass rounded-2xl p-6 mb-6 space-y-3">
          <h2 className="font-heading text-2xl font-bold">💌 Dejale un mensaje</h2>
          <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={3}
            placeholder="Tu mensaje de felicitación…"
            className="w-full px-4 py-3 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          <button onClick={enviarMensaje} disabled={busy || !mensaje.trim()}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium disabled:opacity-50">
            {busy ? 'Enviando…' : 'Enviar mensaje'}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            {isBirthday ? 'Tu mensaje será revisado antes de publicarse ✨' : '🔒 Los mensajes se revelan el día del cumpleaños'}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 mb-6 space-y-3">
          <h2 className="font-heading text-2xl font-bold">📸 Subí una foto</h2>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()} className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg font-medium">
            Elegir foto
          </button>
          {preview && (
            <div className="space-y-2">
              <img src={preview} alt="" className="w-full max-h-64 object-contain rounded-lg" />
              <div className="flex gap-2">
                <button onClick={enviarFoto} disabled={busy} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium disabled:opacity-50">
                  {busy ? 'Enviando…' : 'Enviar foto'}
                </button>
                <button onClick={() => setPreview(null)} className="px-4 py-2 bg-muted rounded-lg">Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {isBirthday && publicItems.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl font-bold text-center mb-4">✨ Muro público</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {publicItems.map(it => (
                <div key={it.id} className="glass rounded-xl p-4">
                  {it.tipo === 'foto'
                    ? <img src={it.contenido} alt="" className="w-full rounded" />
                    : <p className="text-sm">"{it.contenido}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
