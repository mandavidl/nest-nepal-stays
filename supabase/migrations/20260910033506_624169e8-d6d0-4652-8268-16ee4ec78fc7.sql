CREATE OR REPLACE FUNCTION public.sync_property_status_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.status := CASE WHEN NEW.property_status = 'published' THEN 'published' ELSE 'draft' END;
  NEW.approval_status := CASE
    WHEN NEW.property_status = 'published' THEN 'approved'
    WHEN NEW.property_status = 'rejected' THEN 'rejected'
    ELSE 'pending' END;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS properties_sync_status ON public.properties;
CREATE TRIGGER properties_sync_status
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.sync_property_status_fields();

CREATE OR REPLACE FUNCTION public.review_property(_property_id text, _status text, _note text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _prev text; _host uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _status NOT IN ('published','rejected','suspended','removed','pending_approval') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT property_status, host_id INTO _prev, _host FROM public.properties WHERE id = _property_id;
  IF _prev IS NULL THEN RAISE EXCEPTION 'Property not found'; END IF;
  IF _host = auth.uid() THEN RAISE EXCEPTION 'You cannot moderate your own listing'; END IF;
  UPDATE public.properties
     SET property_status = _status, decision_note = _note
   WHERE id = _property_id;
  INSERT INTO public.moderation_actions (actor_id, action, target_property_id, target_user_id, previous_value, new_value, notes)
  VALUES (auth.uid(), 'property_' || _status, _property_id, _host, _prev, _status, _note);
END; $function$;