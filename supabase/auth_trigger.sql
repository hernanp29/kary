-- ============================================================
-- Trigger: crear fila en profiles automáticamente al registrarse
-- Correr esto en el SQL Editor de Supabase, después del schema.sql
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'cliente'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Para convertirte en admin: registrate normalmente en la web,
-- y después corré esto UNA VEZ acá en el SQL Editor
-- (reemplazá el mail por el tuyo):
--
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'tu-mail@ejemplo.com');
-- ------------------------------------------------------------
