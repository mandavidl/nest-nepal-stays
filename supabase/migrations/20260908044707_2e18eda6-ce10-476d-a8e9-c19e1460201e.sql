-- Internal trigger functions: not callable by clients at all
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_property_listing() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_privileges() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_property_status() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_host_status_on_application() FROM anon, authenticated;

-- Helper predicates used inside RLS policies: signed-in only, never anonymous
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_approved_host(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.my_permissions() FROM anon;

-- Privileged moderation entry points: signed-in callers only; each verifies the caller's role internally
REVOKE ALL ON FUNCTION public.review_host_application(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.set_host_status(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.review_property(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.assign_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.remove_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.review_host_application(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_host_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_property(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_host(uuid) TO authenticated;