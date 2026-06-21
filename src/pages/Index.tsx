import { useState, useCallback, useEffect } from 'react';
import { store } from '@/lib/store';
import { seedDemoData } from '@/lib/seed';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PhotoGallery from '@/components/PhotoGallery';
import MisaInvitation from '@/components/MisaInvitation';
import WishesWall from '@/components/WishesWall';
import GiftSection from '@/components/GiftSection';
import Timeline from '@/components/Timeline';
import ContactSection from '@/components/ContactSection';
import MusicToggle from '@/components/MusicToggle';
import AdminDashboard from '@/components/AdminDashboard';
import CelebrationScreen from '@/components/CelebrationScreen';
import QRScreen from '@/components/QRScreen';

export default function Index() {
  const [rev, setRev] = useState(0);
  const refresh = useCallback(() => setRev(r => r + 1), []);
  const [skipCelebration, setSkipCelebration] = useState(false);

  useEffect(() => { seedDemoData(); }, []);

  const settings = store.getSettings();
  const photos = store.getPhotos();
  const wishes = store.getWishes();

  const isBirthday = Date.now() >= new Date(settings.birthdayDate + 'T00:00:00').getTime();

  const urlParams = new URLSearchParams(window.location.search);
  const forceCelebration = urlParams.has('celebration');
  const showQR = urlParams.has('qr');

  void rev;

  if (showQR) {
    return <QRScreen />;
  }

  if ((isBirthday || forceCelebration) && !skipCelebration) {
    return <CelebrationScreen name={settings.name} onContinue={() => setSkipCelebration(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar name={settings.name} />
      <HeroSection settings={settings} />
      <MisaInvitation settings={settings} />
      <PhotoGallery photos={photos} onUpdate={refresh} />
      <WishesWall wishes={wishes} onUpdate={refresh} />
      <GiftSection settings={settings} onUpdate={refresh} />
      <Timeline />
      <ContactSection />
      <AdminDashboard onUpdate={refresh} />
      <MusicToggle />
    </div>
  );
}

