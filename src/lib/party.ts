import type { Database } from '@/integrations/supabase/types';

export type PartyRow = Database['public']['Tables']['parties']['Row'];

export interface LegacySettings {
  name: string;
  birthdayDate: string;
  heroMessage: string;
  transferAlias: string;
  transferCBU: string;
  mercadoPagoLink: string;
  wishlistItems: string[];
  musicEnabled: boolean;
}

export const partyToSettings = (p: PartyRow): LegacySettings => ({
  name: p.name,
  birthdayDate: p.birthday_date,
  heroMessage: p.hero_message ?? '',
  transferAlias: p.transfer_alias ?? '',
  transferCBU: p.transfer_cbu ?? '',
  mercadoPagoLink: p.mercado_pago_link ?? '',
  wishlistItems: p.wishlist_items ?? [],
  musicEnabled: p.music_enabled ?? false,
});

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
