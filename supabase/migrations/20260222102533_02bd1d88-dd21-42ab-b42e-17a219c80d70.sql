-- Insert superadmin role for the owner
INSERT INTO public.user_platform_roles (user_id, role)
VALUES ('abb86ae5-d5b0-4f9a-b679-1e514bcfdae7', 'superadmin')
ON CONFLICT DO NOTHING;