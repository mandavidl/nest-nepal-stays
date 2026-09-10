CREATE OR REPLACE FUNCTION public.block_redundant_host_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _status text;
BEGIN
  SELECT host_status INTO _status FROM public.profiles WHERE id = NEW.user_id;
  IF _status = 'pending' THEN
    RAISE EXCEPTION 'Your host verification request is already being reviewed.';
  ELSIF _status = 'approved' THEN
    RAISE EXCEPTION 'You are already a verified host.';
  ELSIF _status = 'suspended' THEN
    RAISE EXCEPTION 'Your hosting access is suspended. Please contact NestNepal.';
  END IF;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS host_applications_block_redundant ON public.host_applications;
CREATE TRIGGER host_applications_block_redundant
BEFORE INSERT ON public.host_applications
FOR EACH ROW EXECUTE FUNCTION public.block_redundant_host_application();

REVOKE EXECUTE ON FUNCTION public.block_redundant_host_application() FROM PUBLIC, anon, authenticated;