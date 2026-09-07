CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone_number TEXT,
  is_host BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number, is_host)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,'guest'), '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_host')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.properties (
  id TEXT PRIMARY KEY DEFAULT ('p-' || replace(gen_random_uuid()::text, '-', '')),
  host_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  property_category TEXT NOT NULL,
  type_label TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_per_night INTEGER NOT NULL DEFAULT 0,
  cleaning_fee INTEGER NOT NULL DEFAULT 0,
  max_guests INTEGER NOT NULL DEFAULT 1,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  beds INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  house_rules TEXT[] NOT NULL DEFAULT '{}',
  badges TEXT[] NOT NULL DEFAULT '{}',
  phone_number TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  rating_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  booked_days INTEGER[] NOT NULL DEFAULT '{}',
  photos TEXT[] NOT NULL DEFAULT '{}',
  cover_photo TEXT,
  pet_friendly BOOLEAN NOT NULL DEFAULT false,
  pet_types TEXT[] NOT NULL DEFAULT '{}',
  pet_rules TEXT,
  pet_fee INTEGER NOT NULL DEFAULT 0,
  availability_from DATE,
  cancellation_policy TEXT NOT NULL DEFAULT 'Free cancellation up to 5 days before check-in. 50% refund after that.',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'published',
  host_name TEXT NOT NULL DEFAULT '',
  host_initials TEXT NOT NULL DEFAULT '',
  host_since TEXT NOT NULL DEFAULT '2026',
  host_response_rate INTEGER NOT NULL DEFAULT 95,
  host_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT properties_category_check CHECK (property_category IN ('homes','hotels','rooms','homestays','cottages')),
  CONSTRAINT properties_approval_check CHECK (approval_status IN ('pending','approved','rejected')),
  CONSTRAINT properties_status_check CHECK (status IN ('published','draft'))
);
CREATE INDEX properties_host_idx ON public.properties (host_id);
CREATE INDEX properties_public_idx ON public.properties (approval_status, status);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_public_read" ON public.properties FOR SELECT TO anon, authenticated
  USING (approval_status = 'approved' AND status = 'published');
CREATE POLICY "properties_owner_read" ON public.properties FOR SELECT TO authenticated USING (host_id = auth.uid());
CREATE POLICY "properties_owner_insert" ON public.properties FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "properties_owner_update" ON public.properties FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "properties_owner_delete" ON public.properties FOR DELETE TO authenticated USING (host_id = auth.uid());

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_property_listing() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF btrim(NEW.property_name) = '' THEN RAISE EXCEPTION 'Property name is required'; END IF;
  IF btrim(NEW.address) = '' AND btrim(NEW.city) = '' THEN RAISE EXCEPTION 'Location is required'; END IF;
  IF btrim(NEW.description) = '' THEN RAISE EXCEPTION 'Description is required'; END IF;
  IF NEW.price_per_night <= 0 THEN RAISE EXCEPTION 'Price per night is required'; END IF;
  IF NEW.max_guests <= 0 THEN RAISE EXCEPTION 'Guest capacity is required'; END IF;
  IF NEW.phone_number IS NULL OR NEW.phone_number !~ '^(\+977[- ]?)?9[678][0-9]{8}$' THEN
    RAISE EXCEPTION 'A valid Nepal mobile number is required';
  END IF;
  IF NEW.approval_status = 'approved' THEN
    IF array_length(NEW.photos, 1) IS NULL OR array_length(NEW.photos, 1) < 3 THEN
      RAISE EXCEPTION 'At least 3 property photos are required';
    END IF;
    IF NEW.cover_photo IS NULL OR btrim(NEW.cover_photo) = '' THEN
      RAISE EXCEPTION 'A cover photo must be selected';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER properties_validate BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.validate_property_listing();

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL DEFAULT ('NN-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0')),
  guest_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  type_label TEXT NOT NULL DEFAULT '',
  image TEXT,
  host_name TEXT NOT NULL DEFAULT '',
  host_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  nights INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_status_check CHECK (status IN ('upcoming','completed','cancelled'))
);
CREATE INDEX bookings_guest_idx ON public.bookings (guest_id);
CREATE INDEX bookings_property_idx ON public.bookings (property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_guest_all" ON public.bookings FOR ALL TO authenticated
  USING (guest_id = auth.uid()) WITH CHECK (guest_id = auth.uid());
CREATE POLICY "bookings_host_read" ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = bookings.property_id AND p.host_id = auth.uid()));

CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());