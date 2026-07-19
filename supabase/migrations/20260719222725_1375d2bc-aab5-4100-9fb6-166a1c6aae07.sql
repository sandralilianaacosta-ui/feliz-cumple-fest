
-- 1) Drop old schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS grant_super_admin_on_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.grant_super_admin_for_owner_email() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.gifts CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.wishes CASCADE;
DROP TABLE IF EXISTS public.guests CASCADE;
DROP TABLE IF EXISTS public.parties CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2) usuarios
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  email text,
  rol text NOT NULL DEFAULT 'cumpleanera' CHECK (rol IN ('admin','cumpleanera')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.es_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.usuarios WHERE id = _uid AND rol = 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.es_admin(uuid) TO anon, authenticated;

CREATE POLICY "usuarios_select_self_or_admin" ON public.usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.es_admin(auth.uid()));
CREATE POLICY "usuarios_update_self_or_admin" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.es_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.es_admin(auth.uid()));
CREATE POLICY "usuarios_admin_insert" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (public.es_admin(auth.uid()));
CREATE POLICY "usuarios_admin_delete" ON public.usuarios
  FOR DELETE TO authenticated
  USING (public.es_admin(auth.uid()));

-- 3) eventos
CREATE TABLE public.eventos (
  id bigserial PRIMARY KEY,
  cumpleanera_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nombre_evento text NOT NULL DEFAULT '',
  fecha_cumpleanos timestamptz NOT NULL,
  diseno_invitacion_url text,
  qr_codigo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eventos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eventos_public_read" ON public.eventos
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "eventos_owner_update" ON public.eventos
  FOR UPDATE TO authenticated
  USING (cumpleanera_id = auth.uid() OR public.es_admin(auth.uid()))
  WITH CHECK (cumpleanera_id = auth.uid() OR public.es_admin(auth.uid()));
CREATE POLICY "eventos_admin_insert" ON public.eventos
  FOR INSERT TO authenticated
  WITH CHECK (public.es_admin(auth.uid()));
CREATE POLICY "eventos_admin_delete" ON public.eventos
  FOR DELETE TO authenticated
  USING (public.es_admin(auth.uid()));

-- 4) invitados
CREATE TABLE public.invitados (
  id bigserial PRIMARY KEY,
  evento_id bigint NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nombre_invitado text NOT NULL,
  confirmado boolean NOT NULL DEFAULT false,
  codigo_acceso text NOT NULL UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitados TO authenticated;
GRANT ALL ON public.invitados TO service_role;
ALTER TABLE public.invitados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitados_owner_or_admin" ON public.invitados
  FOR ALL TO authenticated
  USING (
    public.es_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.eventos e WHERE e.id = evento_id AND e.cumpleanera_id = auth.uid())
  )
  WITH CHECK (
    public.es_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.eventos e WHERE e.id = evento_id AND e.cumpleanera_id = auth.uid())
  );

-- 5) interacciones_fiesta
CREATE TABLE public.interacciones_fiesta (
  id bigserial PRIMARY KEY,
  invitado_id bigint NOT NULL REFERENCES public.invitados(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('mensaje','foto')),
  contenido text NOT NULL,
  creado_el timestamptz NOT NULL DEFAULT now(),
  aprobado boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT ON public.interacciones_fiesta TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interacciones_fiesta TO authenticated;
GRANT ALL ON public.interacciones_fiesta TO service_role;
ALTER TABLE public.interacciones_fiesta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inter_insert_public" ON public.interacciones_fiesta
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.invitados i WHERE i.id = invitado_id));

CREATE POLICY "inter_public_read_when_birthday" ON public.interacciones_fiesta
  FOR SELECT TO anon, authenticated
  USING (
    aprobado = true
    AND EXISTS (
      SELECT 1 FROM public.invitados i
      JOIN public.eventos e ON e.id = i.evento_id
      WHERE i.id = invitado_id AND e.fecha_cumpleanos <= now()
    )
  );

CREATE POLICY "inter_owner_manage" ON public.interacciones_fiesta
  FOR ALL TO authenticated
  USING (
    public.es_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.invitados i
      JOIN public.eventos e ON e.id = i.evento_id
      WHERE i.id = invitado_id AND e.cumpleanera_id = auth.uid()
    )
  )
  WITH CHECK (
    public.es_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.invitados i
      JOIN public.eventos e ON e.id = i.evento_id
      WHERE i.id = invitado_id AND e.cumpleanera_id = auth.uid()
    )
  );

-- 6) RPC validar_codigo_invitado
CREATE OR REPLACE FUNCTION public.validar_codigo_invitado(codigo text)
RETURNS TABLE (
  invitado_id bigint,
  nombre_invitado text,
  evento_id bigint,
  fecha_cumpleanos timestamptz,
  nombre_evento text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT i.id, i.nombre_invitado, e.id, e.fecha_cumpleanos, e.nombre_evento
  FROM public.invitados i
  JOIN public.eventos e ON e.id = i.evento_id
  WHERE i.codigo_acceso = codigo
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.validar_codigo_invitado(text) TO anon, authenticated;

-- 7) updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER usuarios_set_updated_at BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER eventos_set_updated_at BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8) Trigger on auth.users to create usuarios row
CREATE OR REPLACE FUNCTION public.handle_new_usuario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN lower(NEW.email) = 'sandralilianaacosta@gmail.com' THEN 'admin' ELSE 'cumpleanera' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_usuario();

-- 9) Seed existing auth users into usuarios
INSERT INTO public.usuarios (id, email, nombre, rol)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'nombre', ''),
  CASE WHEN lower(u.email) = 'sandralilianaacosta@gmail.com' THEN 'admin' ELSE 'cumpleanera' END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
