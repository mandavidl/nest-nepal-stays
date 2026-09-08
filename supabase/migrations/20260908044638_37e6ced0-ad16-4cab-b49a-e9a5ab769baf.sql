-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'))
$$;

CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- ============ PROFILES ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NPR',
  ADD COLUMN IF NOT EXISTS host_status text NOT NULL DEFAULT 'not_host';

UPDATE public.profiles SET host_status = 'approved' WHERE is_host = true AND host_status = 'not_host';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_host_status_check
  CHECK (host_status IN ('not_host','pending','approved','rejected','suspended'));

CREATE OR REPLACE FUNCTION public.is_approved_host(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND host_status = 'approved')
$$;

CREATE POLICY profiles_select_staff ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY profiles_update_staff ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.host_status IS DISTINCT FROM OLD.host_status AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Host status can only be changed by NestNepal staff';
  END IF;
  IF NEW.is_host IS DISTINCT FROM OLD.is_host AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Host flag can only be changed by NestNepal staff';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile id is immutable';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER profiles_guard_privileges BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

-- ============ OWNER BOOTSTRAP (server-side only) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number, is_host)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,'guest'), '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(COALESCE(NEW.email,'')) = 'mandavidhakal978@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner' FROM auth.users WHERE lower(email) = 'mandavidhakal978@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============ HOST APPLICATIONS ============
CREATE TABLE public.host_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  decision_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.host_applications TO authenticated;
GRANT ALL ON public.host_applications TO service_role;
ALTER TABLE public.host_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY host_apps_insert_own ON public.host_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY host_apps_select_own ON public.host_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER host_applications_updated_at BEFORE UPDATE ON public.host_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_host_status_on_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET host_status = 'pending' WHERE id = NEW.user_id AND host_status IN ('not_host','rejected');
  RETURN NEW;
END; $$;

CREATE TRIGGER host_applications_mark_pending AFTER INSERT ON public.host_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_host_status_on_application();

-- ============ PROPERTIES ============
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS original_price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_currency text NOT NULL DEFAULT 'NPR',
  ADD COLUMN IF NOT EXISTS decision_note text;

UPDATE public.properties SET property_status = CASE
  WHEN approval_status = 'approved' AND status = 'published' THEN 'published'
  WHEN approval_status = 'rejected' THEN 'rejected'
  ELSE 'pending_approval' END;
UPDATE public.properties SET original_price = price_per_night WHERE original_price = 0;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_property_status_check
  CHECK (property_status IN ('draft','pending_approval','published','rejected','suspended','removed'));

DROP POLICY IF EXISTS properties_public_read ON public.properties;
CREATE POLICY properties_public_read ON public.properties
  FOR SELECT TO anon, authenticated USING (property_status = 'published');
CREATE POLICY properties_staff_read ON public.properties
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY properties_staff_update ON public.properties
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS properties_owner_insert ON public.properties;
CREATE POLICY properties_owner_insert ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND public.is_approved_host(auth.uid())
    AND property_status IN ('draft','pending_approval')
  );

CREATE OR REPLACE FUNCTION public.guard_property_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.property_status IS DISTINCT FROM OLD.property_status
     AND NOT (NEW.property_status IN ('draft','pending_approval','removed')
              AND OLD.property_status IN ('draft','pending_approval','rejected')) THEN
    RAISE EXCEPTION 'Hosts cannot approve, publish or suspend their own listing';
  END IF;
  IF NEW.host_id IS DISTINCT FROM OLD.host_id THEN
    RAISE EXCEPTION 'Listing owner cannot be changed';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER properties_guard_status BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.guard_property_status();

CREATE OR REPLACE FUNCTION public.validate_property_listing()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF btrim(NEW.property_name) = '' THEN RAISE EXCEPTION 'Property name is required'; END IF;
  IF btrim(NEW.address) = '' AND btrim(NEW.city) = '' THEN RAISE EXCEPTION 'Location is required'; END IF;
  IF NEW.property_status <> 'draft' THEN
    IF btrim(NEW.description) = '' THEN RAISE EXCEPTION 'Description is required'; END IF;
    IF NEW.price_per_night <= 0 THEN RAISE EXCEPTION 'Price per night is required'; END IF;
    IF NEW.max_guests <= 0 THEN RAISE EXCEPTION 'Guest capacity is required'; END IF;
    IF NEW.phone_number IS NULL OR NEW.phone_number !~ '^(\+977[- ]?)?9[678][0-9]{8}$' THEN
      RAISE EXCEPTION 'A valid Nepal mobile number is required';
    END IF;
    IF array_length(NEW.photos, 1) IS NULL OR array_length(NEW.photos, 1) < 3 THEN
      RAISE EXCEPTION 'At least 3 property photos are required';
    END IF;
    IF NEW.cover_photo IS NULL OR btrim(NEW.cover_photo) = '' THEN
      RAISE EXCEPTION 'A cover photo must be selected';
    END IF;
  END IF;
  IF NEW.original_price = 0 THEN NEW.original_price := NEW.price_per_night; END IF;
  RETURN NEW;
END; $$;

-- ============ BOOKINGS CURRENCY ============
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS original_property_price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_currency text NOT NULL DEFAULT 'NPR',
  ADD COLUMN IF NOT EXISTS guest_currency text NOT NULL DEFAULT 'NPR',
  ADD COLUMN IF NOT EXISTS exchange_rate_used numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS converted_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rate_timestamp timestamptz;

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid,
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_public_read ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY reviews_update_own ON public.reviews FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY reviews_delete_own ON public.reviews FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REPORTS ============
CREATE TABLE public.property_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.property_reports TO authenticated;
GRANT ALL ON public.property_reports TO service_role;
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_insert_own ON public.property_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open');
CREATE POLICY reports_select_own ON public.property_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_staff(auth.uid()));

-- ============ MODERATION AUDIT LOG ============
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_user_id uuid,
  target_property_id text,
  previous_value text,
  new_value text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY moderation_select_staff ON public.moderation_actions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============ EXCHANGE RATE CACHE ============
CREATE TABLE public.exchange_rates (
  base text PRIMARY KEY,
  rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exchange_rates TO anon, authenticated;
GRANT ALL ON public.exchange_rates TO service_role;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY exchange_rates_read ON public.exchange_rates FOR SELECT TO anon, authenticated USING (true);

-- ============ PRIVILEGED ACTIONS ============
CREATE OR REPLACE FUNCTION public.review_host_application(_application_id uuid, _decision text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _target uuid; _prev text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _decision NOT IN ('approved','rejected','suspended') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  SELECT user_id INTO _target FROM public.host_applications WHERE id = _application_id;
  IF _target IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  SELECT host_status INTO _prev FROM public.profiles WHERE id = _target;
  UPDATE public.host_applications
     SET status = _decision, decision_note = _note, reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _application_id;
  UPDATE public.profiles
     SET host_status = _decision, is_host = (_decision = 'approved')
   WHERE id = _target;
  INSERT INTO public.moderation_actions (actor_id, action, target_user_id, previous_value, new_value, notes)
  VALUES (auth.uid(), 'host_' || _decision, _target, _prev, _decision, _note);
END; $$;

CREATE OR REPLACE FUNCTION public.set_host_status(_user_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _prev text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _status NOT IN ('not_host','pending','approved','rejected','suspended') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT host_status INTO _prev FROM public.profiles WHERE id = _user_id;
  UPDATE public.profiles SET host_status = _status, is_host = (_status = 'approved') WHERE id = _user_id;
  INSERT INTO public.moderation_actions (actor_id, action, target_user_id, previous_value, new_value, notes)
  VALUES (auth.uid(), 'host_status_change', _user_id, _prev, _status, _note);
END; $$;

CREATE OR REPLACE FUNCTION public.review_property(_property_id text, _status text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _prev text; _host uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _status NOT IN ('published','rejected','suspended','removed','pending_approval') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT property_status, host_id INTO _prev, _host FROM public.properties WHERE id = _property_id;
  IF _prev IS NULL THEN RAISE EXCEPTION 'Property not found'; END IF;
  IF _host = auth.uid() THEN RAISE EXCEPTION 'You cannot moderate your own listing'; END IF;
  UPDATE public.properties
     SET property_status = _status,
         decision_note = _note,
         approval_status = CASE WHEN _status = 'published' THEN 'approved' WHEN _status = 'rejected' THEN 'rejected' ELSE 'pending' END,
         status = CASE WHEN _status = 'published' THEN 'published' ELSE 'unpublished' END
   WHERE id = _property_id;
  INSERT INTO public.moderation_actions (actor_id, action, target_property_id, target_user_id, previous_value, new_value, notes)
  VALUES (auth.uid(), 'property_' || _status, _property_id, _host, _prev, _status, _note);
END; $$;

CREATE OR REPLACE FUNCTION public.assign_admin(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Only the NestNepal owner can assign administrators'; END IF;
  IF public.has_role(_user_id, 'owner') THEN RAISE EXCEPTION 'The owner role cannot be modified'; END IF;
  INSERT INTO public.user_roles (user_id, role, granted_by) VALUES (_user_id, 'admin', auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.moderation_actions (actor_id, action, target_user_id, previous_value, new_value)
  VALUES (auth.uid(), 'admin_assigned', _user_id, 'guest', 'admin');
END; $$;

CREATE OR REPLACE FUNCTION public.remove_admin(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Only the NestNepal owner can remove administrators'; END IF;
  IF public.has_role(_user_id, 'owner') THEN RAISE EXCEPTION 'The owner role cannot be removed'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  INSERT INTO public.moderation_actions (actor_id, action, target_user_id, previous_value, new_value)
  VALUES (auth.uid(), 'admin_removed', _user_id, 'admin', 'guest');
END; $$;

CREATE OR REPLACE FUNCTION public.my_permissions()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'is_owner', public.has_role(auth.uid(), 'owner'),
    'is_admin', public.has_role(auth.uid(), 'admin'),
    'is_staff', public.is_staff(auth.uid()),
    'host_status', COALESCE((SELECT host_status FROM public.profiles WHERE id = auth.uid()), 'not_host')
  )
$$;

REVOKE ALL ON FUNCTION public.review_host_application(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.set_host_status(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.review_property(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.assign_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.remove_admin(uuid) FROM anon;