import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

export default function MusicToggle() {
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    setPlaying(!playing);
    // In production, integrate with an <audio> element
  };

  return (
    <button onClick={toggle}
      className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition"
      aria-label={playing ? 'Silenciar música' : 'Reproducir música'}>
      {playing ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  );
}
