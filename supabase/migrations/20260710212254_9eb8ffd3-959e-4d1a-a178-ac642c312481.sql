
-- Restrict security definer functions
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;

-- Tighten permissive INSERT policies
DROP POLICY IF EXISTS "Anyone submits photos" ON public.photos;
CREATE POLICY "Anyone submits photos" ON public.photos FOR INSERT
  WITH CHECK (approved = false AND EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id));

DROP POLICY IF EXISTS "Anyone submits wish" ON public.wishes;
CREATE POLICY "Anyone submits wish" ON public.wishes FOR INSERT
  WITH CHECK (approved = false AND EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id));

DROP POLICY IF EXISTS "Anyone submits gift" ON public.gifts;
CREATE POLICY "Anyone submits gift" ON public.gifts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id));
