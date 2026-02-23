
-- 1. Restore owner roles for all affected users
UPDATE public.organization_members
SET role = 'owner'
WHERE id IN (
  'b7bb018e-a859-4dd5-a495-1e94e1ac78dc',
  'd7f47312-e612-4704-8fe3-67f0999d5a6e',
  '9d12e6b7-1426-4d5f-8c09-89d0a24331d4',
  'b290108f-345b-4657-a0c1-84cc3c7fbc3d'
);

-- 2. Create trigger to prevent org owners from having their role changed
CREATE OR REPLACE FUNCTION public.prevent_owner_role_change()
RETURNS TRIGGER AS $$
DECLARE
  _owner_id uuid;
BEGIN
  -- Get the owner of this organization
  SELECT owner_id INTO _owner_id
  FROM public.organizations
  WHERE id = NEW.organization_id;

  -- If this user is the org owner, force role to 'owner'
  IF NEW.user_id = _owner_id THEN
    IF TG_OP = 'UPDATE' AND NEW.role != 'owner' THEN
      RAISE EXCEPTION 'Cannot change the role of the organization owner. The owner must always have the "owner" role.';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.role != 'owner' THEN
      RAISE EXCEPTION 'Organization owner cannot be added with a non-owner role.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_prevent_owner_role_change
BEFORE INSERT OR UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.prevent_owner_role_change();
