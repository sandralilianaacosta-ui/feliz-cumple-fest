import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { partyToSettings, type PartyRow } from '@/lib/party';
import HeroSection from '@/components/HeroSection';
import MisaInvitation from '@/components/MisaInvitation';
import PhotoGallery, { type PhotoItem } from '@/components/PhotoGallery';
import WishesWall, { type WishItem } from '@/components/WishesWall';
import QRShareSection from '@/components/QRShareSection';
import GiftSection from '@/components/GiftSection';
import Timeline from '@/components/Timeline';
import ContactSection from '@/components/ContactSection';
import MusicToggle from '@/components/MusicToggle';
import CelebrationScreen from '@/components/CelebrationScreen';

export default function PartyView() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const [party, setParty] = useState<PartyRow | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [rev, setRev] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skipCelebration, setSkipCelebration] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: p } = await supabase.from('parties').select('*').eq('slug', slug).maybeSingle();
      setParty(p);
      if (p) {
        const [ph, wi] = await Promise.all([
          supabase.from('photos').select('id,url,author,approved').eq('party_id', p.id).eq('approved', true),
          supabase.from('wishes').select('id,message,author,emoji,approved').eq('party_id', p.id).eq('approved', true),
        ]);
        setPhotos(ph.data ?? []);
        setWishes(wi.data ?? []);
      }
      setLoading(false);
    })();
  }, [slug, rev]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando…</div>;
  if (!party) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <p className="text-xl mb-4">Fiesta no encontrada 🥺</p>
      <button onClick={() => nav('/')} className="text-primary underline">Volver al inicio</button>
    </div>
  );

  const settings = partyToSettings(party);
  const isBirthday = new Date().toISOString().slice(0, 10) >= party.birthday_date;
  const forceCelebration = new URLSearchParams(window.location.search).has('celebration');

  if ((isBirthday || forceCelebration) && !skipCelebration) {
    return <CelebrationScreen name={party.name} partyId={party.id} onContinue={() => setSkipCelebration(true)} />;
  }

  const refresh = () => setRev(r => r + 1);

  return (
    <div className="min-h-screen">
      <HeroSection settings={settings} />
      <MisaInvitation settings={settings} />
      <PhotoGallery partyId={party.id} photos={photos} onUpdate={refresh} />
      <WishesWall partyId={party.id} wishes={wishes} birthdayDate={party.birthday_date} onUpdate={refresh} />
      <QRShareSection slug={party.slug} name={party.name} />
      <GiftSection partyId={party.id} settings={settings} onUpdate={refresh} />
      <Timeline />
      <ContactSection />
      <MusicToggle />
    </div>
  );
}
