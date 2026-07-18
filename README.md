# Mi Jardín Secreto

Sitio propio de Karina: publicaciones, tienda y talleres, con navegación en forma de planta.

## Stack

React + Vite + React Router + Supabase + (Mercado Pago, a integrar en checkout).

## Cómo correrlo

```bash
npm install
cp .env.example .env      # completar con tus credenciales de Supabase
npm run dev
```

## Base de datos

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Ir a SQL Editor y ejecutar el contenido de `supabase/schema.sql`.
   Esto crea las tablas de perfiles, publicaciones, tienda y talleres, con
   Row Level Security ya configurado (lectura pública de lo publicado,
   gestión completa solo para el rol `admin`).
3. Copiar la URL y la anon key del proyecto (Settings → API) a tu `.env`.
4. Para volverte admin: registrate una vez en el sitio (falta armar el login,
   ver "Próximos pasos"), y después en SQL Editor correr:
   ```sql
   update profiles set role = 'admin' where id = 'tu-user-id';
   ```

## Estructura

```
src/
  components/
    BotanicalNav.jsx   → la nav-planta (hojas/flor/raíces = las 3 secciones)
  pages/
    Home.jsx           → hero + preview de las 3 secciones
    Publicaciones.jsx  → blog, filtrado por categoría
    Tienda.jsx         → catálogo simple, sin stock automático
    Talleres.jsx       → listado con modalidad, fecha y cupo
  lib/
    supabase.js        → cliente de Supabase
  styles/
    tokens.css          → paleta, tipografía, variables de diseño
supabase/
  schema.sql            → tablas + RLS
```

## Próximos pasos (orden sugerido)

1. **Contenido real de Publicaciones**: reemplazar el texto de bienvenida en
   `Home.jsx` por el texto real de systeme.io (ya está bien escrito, solo
   trasladarlo sin las erratas: "Praparar" → "Preparar", "infusiòn" →
   "infusión", "eleborar" → "elaborar", "hierva" → "hierba").
2. **Login/registro** con Supabase Auth (email o magic link) — necesario
   para que el rol admin funcione y para que clientes vean sus pedidos e
   inscripciones.
3. **Panel de admin** simple para cargar posts, productos y talleres sin
   tocar SQL a mano.
4. **Checkout con Mercado Pago** en Tienda y Talleres (Checkout Pro es lo
   más simple para arrancar: redirige a una página de pago de Mercado Pago
   y vuelve con el estado).
5. **Detalle de post** (`/publicaciones/:slug`) — hoy solo está el listado.
6. Migrar el dominio desde systeme.io cuando esto esté en producción.
