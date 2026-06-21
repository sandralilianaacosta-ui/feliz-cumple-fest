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

export default function Index() {
  const [rev, setRev] = useState(0);
  const refresh = useCallback(() => setRev(r => r + 1), []);

  useEffect(() => { seedDemoData(); }, []);

  const settings = store.getSettings();
  const photos = store.getPhotos();
  const wishes = store.getWishes();

  // suppress unused warning
  void rev;

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
