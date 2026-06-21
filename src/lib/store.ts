// localStorage-based store (replace with Lovable Cloud for production)

export interface Photo {
  id: string;
  dataUrl: string;
  author: string;
  timestamp: number;
  approved: boolean;
}

export interface Wish {
  id: string;
  message: string;
  author: string;
  emoji: string;
  timestamp: number;
  approved: boolean;
}

export interface GiftConfirmation {
  id: string;
  type: 'transfer' | 'mercadopago' | 'wishlist' | 'envelope';
  author: string;
  message: string;
  timestamp: number;
}

export interface Settings {
  name: string;
  birthdayDate: string;
  heroMessage: string;
  transferAlias: string;
  transferCBU: string;
  mercadoPagoLink: string;
  wishlistItems: string[];
  musicEnabled: boolean;
}

const KEYS = {
  photos: 'birthday_photos',
  wishes: 'birthday_wishes',
  gifts: 'birthday_gifts',
  settings: 'birthday_settings',
};

function get<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const defaultSettings: Settings = {
  name: 'Victoria',
  birthdayDate: '2026-05-15',
  heroMessage: '¡Estamos celebrando un día muy especial!',
  transferAlias: 'maria.cumple.2026',
  transferCBU: '0000003100000000000001',
  mercadoPagoLink: 'https://link.mercadopago.com.ar/ejemplo',
  wishlistItems: ['Libro de cocina', 'Set de aromaterapia', 'Entrada al teatro', 'Experiencia spa'],
  musicEnabled: false,
};

export const store = {
  getPhotos: (): Photo[] => get(KEYS.photos, []),
  addPhoto: (p: Omit<Photo, 'id' | 'timestamp' | 'approved'>) => {
    const photos = get<Photo[]>(KEYS.photos, []);
    photos.push({ ...p, id: crypto.randomUUID(), timestamp: Date.now(), approved: false });
    set(KEYS.photos, photos);
  },
  approvePhoto: (id: string) => {
    const photos = get<Photo[]>(KEYS.photos, []);
    const i = photos.findIndex(p => p.id === id);
    if (i >= 0) { photos[i].approved = true; set(KEYS.photos, photos); }
  },
  deletePhoto: (id: string) => {
    set(KEYS.photos, get<Photo[]>(KEYS.photos, []).filter(p => p.id !== id));
  },

  getWishes: (): Wish[] => get(KEYS.wishes, []),
  addWish: (w: Omit<Wish, 'id' | 'timestamp' | 'approved'>) => {
    const wishes = get<Wish[]>(KEYS.wishes, []);
    wishes.push({ ...w, id: crypto.randomUUID(), timestamp: Date.now(), approved: false });
    set(KEYS.wishes, wishes);
  },
  approveWish: (id: string) => {
    const wishes = get<Wish[]>(KEYS.wishes, []);
    const i = wishes.findIndex(w => w.id === id);
    if (i >= 0) { wishes[i].approved = true; set(KEYS.wishes, wishes); }
  },
  deleteWish: (id: string) => {
    set(KEYS.wishes, get<Wish[]>(KEYS.wishes, []).filter(w => w.id !== id));
  },

  getGifts: (): GiftConfirmation[] => get(KEYS.gifts, []),
  addGift: (g: Omit<GiftConfirmation, 'id' | 'timestamp'>) => {
    const gifts = get<GiftConfirmation[]>(KEYS.gifts, []);
    gifts.push({ ...g, id: crypto.randomUUID(), timestamp: Date.now() });
    set(KEYS.gifts, gifts);
  },

  getSettings: (): Settings => get(KEYS.settings, defaultSettings),
  updateSettings: (s: Partial<Settings>) => {
    set(KEYS.settings, { ...get(KEYS.settings, defaultSettings), ...s });
  },
};

export const ADMIN_PASSWORD = 'cumple2026';
