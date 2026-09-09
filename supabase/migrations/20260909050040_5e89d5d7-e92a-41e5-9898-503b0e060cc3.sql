CREATE OR REPLACE FUNCTION public.property_blocked_dates(_property_id text)
RETURNS SETOF date
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d::date
  FROM public.bookings b,
       generate_series(b.check_in, b.check_out - 1, interval '1 day') d
  WHERE b.property_id = _property_id
    AND b.status <> 'cancelled'
$$;

REVOKE ALL ON FUNCTION public.property_blocked_dates(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_blocked_dates(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_booking_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status text;
  _from date;
  _blocked_days integer[];
  _hits integer;
BEGIN
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in';
  END IF;

  SELECT property_status, availability_from, booked_days
    INTO _status, _from, _blocked_days
  FROM public.properties WHERE id = NEW.property_id;

  IF FOUND THEN
    IF _status <> 'published' THEN
      RAISE EXCEPTION 'These dates are no longer available. Please choose different dates.';
    END IF;
    IF _from IS NOT NULL AND NEW.check_in < _from THEN
      RAISE EXCEPTION 'These dates are no longer available. Please choose different dates.';
    END IF;
    SELECT count(*) INTO _hits
    FROM generate_series(NEW.check_in, NEW.check_out - 1, interval '1 day') d
    WHERE extract(day FROM d)::int = ANY(COALESCE(_blocked_days, '{}'::integer[]));
    IF _hits > 0 THEN
      RAISE EXCEPTION 'These dates are no longer available. Please choose different dates.';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.property_id = NEW.property_id
      AND b.id IS DISTINCT FROM NEW.id
      AND b.status <> 'cancelled'
      AND daterange(b.check_in, b.check_out, '[)') && daterange(NEW.check_in, NEW.check_out, '[)')
  ) THEN
    RAISE EXCEPTION 'These dates are no longer available. Please choose different dates.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_booking_dates() FROM PUBLIC;

DROP TRIGGER IF EXISTS bookings_validate_dates ON public.bookings;
CREATE TRIGGER bookings_validate_dates
BEFORE INSERT OR UPDATE OF check_in, check_out, status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_dates();

CREATE UNIQUE INDEX IF NOT EXISTS host_applications_one_pending
ON public.host_applications (user_id) WHERE status = 'pending';