-- ============================================================
-- MI JARDÍN SECRETO — Schema de Supabase
-- Secciones: Publicaciones (blog), Tienda, Talleres
-- ============================================================

-- ---------- PERFILES ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'cliente' check (role in ('admin', 'cliente')),
  created_at timestamptz not null default now()
);

-- ---------- PUBLICACIONES (BLOG) ----------
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  category text, -- ej: 'plantas medicinales', 'recetas', 'casos de uso'
  cover_image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- TIENDA ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null,
  image_url text,
  status text not null default 'disponible' check (status in ('disponible', 'agotado')),
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  customer_email text not null, -- soporta checkout como invitado
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado', 'enviado', 'cancelado')),
  total numeric(10,2) not null default 0,
  mp_payment_id text, -- referencia al pago de Mercado Pago
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null default 1,
  unit_price numeric(10,2) not null
);

-- ---------- TALLERES ----------
create table workshops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  modality text not null check (modality in ('online', 'presencial')),
  event_date timestamptz,
  capacity int, -- cupo (relevante para presenciales)
  price numeric(10,2) not null,
  content_url text, -- video/material para talleres online, tras el pago
  created_at timestamptz not null default now()
);

create table workshop_enrollments (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  customer_id uuid references profiles(id),
  customer_email text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado', 'cancelado')),
  attended boolean not null default false,
  mp_payment_id text,
  created_at timestamptz not null default now(),
  unique (workshop_id, customer_email)
);

-- ---------- SUSCRIPTORES (comunidad / lead magnet PDF) ----------
create table suscriptores (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table posts enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table workshops enable row level security;
alter table workshop_enrollments enable row level security;
alter table suscriptores enable row level security;

-- Helper: ¿el usuario actual es admin?
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Perfiles: cada quien ve/edita el suyo; admin ve todos
create policy "ver propio perfil" on profiles for select using (auth.uid() = id or is_admin());
create policy "editar propio perfil" on profiles for update using (auth.uid() = id);

-- Publicaciones: lectura pública de las publicadas; admin gestiona todo
create policy "lectura publica de posts publicados" on posts for select using (published = true or is_admin());
create policy "admin gestiona posts" on posts for all using (is_admin());

-- Productos: catálogo público; admin gestiona
create policy "lectura publica de productos" on products for select using (true);
create policy "admin gestiona productos" on products for all using (is_admin());

-- Pedidos: cada cliente ve los propios; admin ve todos
create policy "ver pedidos propios" on orders for select using (customer_id = auth.uid() or is_admin());
create policy "crear pedido propio" on orders for insert with check (true);
create policy "admin gestiona pedidos" on orders for update using (is_admin());

create policy "ver items de pedidos propios" on order_items for select using (
  exists (select 1 from orders where orders.id = order_id and (orders.customer_id = auth.uid() or is_admin()))
);
create policy "crear items de pedido" on order_items for insert with check (true);

-- Talleres: catálogo público; admin gestiona
create policy "lectura publica de talleres" on workshops for select using (true);
create policy "admin gestiona talleres" on workshops for all using (is_admin());

-- Inscripciones: cada quien ve las propias; admin ve todas
create policy "ver inscripciones propias" on workshop_enrollments for select using (
  customer_id = auth.uid() or is_admin()
);
create policy "crear inscripcion propia" on workshop_enrollments for insert with check (true);
create policy "admin gestiona inscripciones" on workshop_enrollments for update using (is_admin());

-- Suscriptores: sin policies a propósito. Con RLS activada y ninguna policy,
-- nadie puede leer/escribir desde el navegador (ni con anon key ni logueado).
-- Solo la función serverless (api/suscribir.js), que usa la service_role key
-- y por lo tanto bypassea RLS, puede insertar filas acá.
