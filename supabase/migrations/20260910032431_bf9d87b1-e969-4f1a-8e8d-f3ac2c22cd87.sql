-- 1. Allow trusted internal functions to move host_status, while still blocking users.
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _privileged boolean := coalesce(current_setting('app.privileged_profile_update', true), '') = 'on';
BEGIN
  IF NEW.host_status IS DISTINCT FROM OLD.host_status
     AND NOT _privileged AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Host status can only be changed by NestNepal staff';
  END IF;
  IF NEW.is_host IS DISTINCT FROM OLD.is_host
     AND NOT _privileged AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Host flag can only be changed by NestNepal staff';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile id is immutable';
  END IF;
  RETURN NEW;
END; $function$;

-- 2. The application trigger marks the account pending under that trusted flag.
CREATE OR REPLACE FUNCTION public.sync_host_status_on_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config('app.privileged_profile_update', 'on', true);
  UPDATE public.profiles SET host_status = 'pending'
   WHERE id = NEW.user_id AND host_status IN ('not_host','rejected');
  PERFORM set_config('app.privileged_profile_update', 'off', true);
  RETURN NEW;
END; $function$;

-- 3. Reviews also run under the flag (they already require staff).
CREATE OR REPLACE FUNCTION public.review_host_application(_application_id uuid, _decision text, _note text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _target uuid; _prev text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _decision NOT IN ('approved','rejected','suspended') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  SELECT user_id INTO _target FROM public.host_applications WHERE id = _application_id;
  IF _target IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  SELECT host_status INTO _prev FROM public.profiles WHERE id = _target;
  UPDATE public.host_applications
     SET status = CASE WHEN _decision = 'suspended' THEN 'rejected' ELSE _decision END,
         decision_note = _note, reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _application_id;
  PERFORM set_config('app.privileged_profile_update', 'on', true);
  UPDATE public.profiles
     SET host_status = _decision, is_host = (_decision = 'approved')
   WHERE id = _target;
  PERFORM set_config('app.privileged_profile_update', 'off', true);
  INSERT INTO public.moderation_actions (actor_id, action, target_user_id, previous_value, new_value, notes)
  VALUES (auth.uid(), 'host_' || _decision, _target, _prev, _decision, _note);
END; $function$;

CREATE OR REPLACE FUNCTION public.set_host_status(_user_id uuid, _status text, _note text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _prev text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _status NOT IN ('not_host','pending','approved','rejected','suspended') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT host_status INTO _prev FROM public.profiles WHERE id = _user_id;
  PERFORM set_config('app.privileged_profile_update', 'on', true);
  UPDATE public.profiles SET host_status = _status, is_host = (_status = 'approved') WHERE id = _user_id;
  PERFORM set_config('app.privileged_profile_update', 'off', true);
  INSERT INTO public.moderation_actions (actor_id, action, target_user_id, previous_value, new_value, notes)
  VALUES (auth.uid(), 'host_status_change', _user_id, _prev, _status, _note);
END; $function$;

-- 4. One open request at a time, but re-applying after a rejection is allowed.
ALTER TABLE public.host_applications DROP CONSTRAINT IF EXISTS host_applications_user_id_key;
DROP INDEX IF EXISTS public.host_applications_user_id_key;

-- 5. One consistent set of status values.
ALTER TABLE public.host_applications DROP CONSTRAINT IF EXISTS host_applications_status_check;
ALTER TABLE public.host_applications
  ADD CONSTRAINT host_applications_status_check CHECK (status IN ('pending','approved','rejected'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_host_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_host_status_check CHECK (host_status IN ('not_host','pending','approved','rejected','suspended'));