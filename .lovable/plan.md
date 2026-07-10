## Objetivo

Reestructurar la app en **tres experiencias separadas**, cada una con su propio login y permisos, sobre Lovable Cloud (base de datos + auth).

---

## 1. Roles y accesos

Tres tipos de usuario, gestionados con tabla `user_roles` + función `has_role` (seguridad estándar):

- **`super_admin`** (vos) — administra todas las fiestas y suscripciones.
- **`quinceanera`** — dueña de UNA fiesta, gestiona invitados, ve countdown.
- **`invitado`** — accede a la fiesta pública (foto, deseos, regalos, QR).

---

## 2. Modelo de datos (nuevo)

```text
parties              — una fila por fiesta (nombre, fecha, slug, hero_message, alias, cbu, mp_link, owner_id → quinceañera)
subscriptions        — plan, estado, vigencia, party_id
guests               — lista de invitados (nombre, email/tel, confirmado) por party_id
photos, wishes,      — YA existen en local; se migran a Cloud y se les agrega party_id
gifts, settings
profiles             — datos del usuario logueado
user_roles           — rol por usuario (+ opcional party_id para quinceañera)
```

Los `wishes` tendrán `visible: boolean`. Un job/trigger o simple filtro por fecha hará que **solo se muestren el día del cumpleaños**.

---

## 3. Rutas nuevas

```text
/                          → landing / selector
/login                     → login único (redirige según rol)
/admin                     → SUPER ADMIN (vos)
   ├─ fiestas              → CRUD de fiestas
   ├─ suscripciones        → planes y estado
   └─ configuración        → parámetros globales
/mi-fiesta                 → DASHBOARD QUINCEAÑERA
   ├─ countdown
   ├─ invitados (subir CSV / agregar / eliminar)
   ├─ moderar deseos (ver, pero se publican el día D)
   └─ configuración de su fiesta
/fiesta/:slug              → VISTA INVITADOS (la app actual)
```

---

## 4. Reglas de visualización de deseos

- Los invitados **pueden enviar** deseos en cualquier momento.
- Los deseos **se muestran públicamente solo si** `now() >= parties.birthday_date`.
- La quinceañera puede **previsualizarlos** desde su dashboard antes del día.
- La `CelebrationScreen` del día D los muestra todos.

---

## 5. Migración desde `localStorage`

`src/lib/store.ts` se reemplaza por hooks (`usePhotos`, `useWishes`, `useGifts`, `useSettings`) que leen/escriben en Cloud filtrando por `party_id`. Se conserva compatibilidad de los componentes existentes cambiando solo la fuente de datos.

---

## 6. Preguntas antes de codear

Antes de implementar necesito confirmar 3 cosas puntuales (te las hago en el próximo mensaje):

1. **Suscripciones**: ¿solo querés registrarlas manualmente en tu panel (plan + fecha vencimiento), o querés integrar cobro real (Stripe/Paddle)?
2. **Login de la quinceañera**: ¿email + contraseña, o le mandás vos un link mágico desde tu admin?
3. **Invitados**: ¿necesitás que cada invitado se logee, o entran con el link/QR público de la fiesta sin cuenta?

---

## Alcance de esta primera entrega

1. Migración de esquema (tablas + RLS + GRANTs + roles).
2. Auth (login/signup) + redirección por rol.
3. `/admin` con listado y creación de fiestas + gestión de suscripciones (manual salvo que pidas cobro).
4. `/mi-fiesta` con countdown, invitados y moderación de deseos ocultos.
5. `/fiesta/:slug` = la app actual, leyendo de Cloud, con deseos ocultos hasta la fecha.
6. Panel `AdminDashboard` actual se retira (queda absorbido por `/mi-fiesta` + `/admin`).
