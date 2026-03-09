create or replace function public.track_first_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _new_row jsonb;
  _actor_id uuid;
begin
  _new_row := to_jsonb(new);

  if _new_row ? 'user_id' and coalesce(_new_row->>'user_id', '') <> '' then
    _actor_id := (_new_row->>'user_id')::uuid;
  elsif _new_row ? 'created_by' and coalesce(_new_row->>'created_by', '') <> '' then
    _actor_id := (_new_row->>'created_by')::uuid;
  else
    return new;
  end if;

  update public.profiles
  set first_action_at = now()
  where id = _actor_id
    and first_action_at is null;

  return new;
exception
  when invalid_text_representation then
    return new;
end;
$$;