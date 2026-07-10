
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'quinceanera', 'invitado');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PARTIES ============
CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  birthday_date DATE NOT NULL,
  hero_message TEXT NOT NULL DEFAULT '',
  transfer_alias TEXT NOT NULL DEFAULT '',
  transfer_cbu TEXT NOT NULL DEFAULT '',
  mercado_pago_link TEXT NOT NULL DEFAULT '',
  wishlist_items TEXT[] NOT NULL DEFAULT '{}',
  music_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.parties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parties TO authenticated;
GRANT ALL ON public.parties TO service_role;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads parties" ON public.parties FOR SELECT USING (true);
CREATE POLICY "Owner manages own party" ON public.parties FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER parties_updated BEFORE UPDATE ON public.parties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages subs" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Owner views own subs" ON public.subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND p.owner_id = auth.uid()));
CREATE TRIGGER subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ GUESTS ============
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin manages guests" ON public.guests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));

-- ============ PHOTOS ============
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  author TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sees approved photos" ON public.photos FOR SELECT USING (approved = true);
CREATE POLICY "Owner sees all photos" ON public.photos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Anyone submits photos" ON public.photos FOR INSERT WITH CHECK (approved = false);
CREATE POLICY "Owner manages photos" ON public.photos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Owner deletes photos" ON public.photos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));

-- ============ WISHES ============
CREATE TABLE public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  author TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💖',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.wishes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishes TO authenticated;
GRANT ALL ON public.wishes TO service_role;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
-- public sees approved wishes ONLY if the party's birthday date has arrived
CREATE POLICY "Public sees wishes on day" ON public.wishes FOR SELECT USING (
  approved = true AND EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND CURRENT_DATE >= p.birthday_date)
);
CREATE POLICY "Owner previews all wishes" ON public.wishes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Anyone submits wish" ON public.wishes FOR INSERT WITH CHECK (approved = false);
CREATE POLICY "Owner manages wishes" ON public.wishes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Owner deletes wishes" ON public.wishes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));

-- ============ GIFTS ============
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  author TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.gifts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views gifts" ON public.gifts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Anyone submits gift" ON public.gifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner deletes gifts" ON public.gifts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));
