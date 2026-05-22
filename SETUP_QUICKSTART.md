# Arratia Cotizador — Quickstart (5 pasos)

Sistema de cotizaciones para venta de EPP industrial. Stack: Next.js 15 + Supabase + Tailwind v4.

---

## 1. Instalar dependencias (1 vez)

```powershell
cd "e:\proyectos-codigo\arratia-cotizador"
npm install
```

Tarda 1-2 minutos.

---

## 2. Crear proyecto Supabase (5 min)

1. Ir a https://supabase.com → Login → **New Project**
2. Datos:
   - Project name: `arratia-cotizador`
   - Region: `South America (São Paulo)`
   - Database password: algo fuerte (guárdalo)
3. Esperar 2-3 minutos a que termine de provisionar

---

## 3. Cargar schema (2 min)

1. En Supabase abre **SQL Editor**
2. Abre el archivo `supabase/SETUP.sql` de esta carpeta
3. Copia TODO el contenido, pégalo en SQL Editor
4. Clic **Run** — debería terminar sin errores

Esto crea: tablas, categorías EPP precargadas, función `next_cotizacion_numero()`, políticas RLS.

---

## 4. Copiar credenciales a `.env.local` (1 min)

1. En Supabase ve a **Settings → API**
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (necesario para PDF público)
3. Abre `.env.local` y reemplaza los valores `placeholder`
4. Guarda

---

## 5. Crear usuario admin + arrancar

1. En Supabase ve a **Authentication → Users → Add user → Send invitation** (o "Create user" con password)
   - Email: tu correo
   - Password: el que quieras
2. Confirma el correo si te pide (en Auth settings puedes desactivar verificación por correo en dev)
3. En PowerShell:

```powershell
npm run dev
```

4. Abre http://localhost:3000 → te redirige a `/login` → entra con el usuario que creaste.

---

## ¿Qué hacer primero adentro?

1. **Configuración** → llena RUC, dirección, teléfono, cuentas bancarias y URL del logo
2. **Productos** → crea tu catálogo de EPP (cascos, guantes, botas, lentes, etc.)
3. **Clientes** → registra al primer cliente
4. **Cotizaciones → Nueva** → selecciona cliente, agrega productos, guarda
5. En la vista de la cotización: **Enviar por WhatsApp** o **Enviar por correo**

---

## Desplegar a producción (opcional)

```powershell
npm install -g vercel
vercel
```

Vercel pedirá las mismas variables de `.env.local`. Recuerda actualizar `NEXT_PUBLIC_APP_URL` con el dominio real.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    → Dashboard
│   ├── login/                      → Auth
│   ├── cotizaciones/               → Listado + nueva + ver + editar
│   ├── clientes/                   → CRUD clientes
│   ├── productos/                  → CRUD catálogo EPP
│   ├── configuracion/              → Datos empresa para PDF
│   └── api/pdf-public/[id]/        → Endpoint PDF (UUID como token)
├── components/
│   ├── AppShell.tsx                → Layout con sidebar
│   ├── CotizacionForm.tsx          → Formulario con line items
│   ├── EnviarCotizacion.tsx        → Botones WhatsApp/correo
│   └── pdf/CotizacionPDF.tsx       → Documento PDF (@react-pdf/renderer)
├── lib/
│   ├── supabase/                   → Clientes SSR
│   └── utils.ts                    → formatMoney, calcularTotales, etc.
└── middleware.ts                   → Auth gating
```

---

## Notas técnicas

- **IGV 18%**: configurable por cotización (sumar al precio neto, o desglosar de precio bruto)
- **Numeración**: automática `COT-YYYY-NNNN` vía función SQL
- **PDF público**: el endpoint `/api/pdf-public/[uuid]` es accesible sin login para que el cliente pueda abrir el link del WhatsApp/correo. La seguridad depende de que el UUID es impredecible (suficiente para MVP; si quieres mayor seguridad después se puede agregar firma HMAC)
- **WhatsApp**: usa `wa.me` — abre WhatsApp Web o app con el mensaje + link al PDF pre-armado
- **Correo**: usa `mailto:` — abre tu cliente de correo predeterminado con asunto y cuerpo

---

¿Problemas?

- `npm install` falla → asegúrate que Node ≥ 20 está instalado (`node -v`)
- Login no redirige → revisa que las claves de `.env.local` no tengan espacios ni saltos de línea
- PDF da 500 → verifica `SUPABASE_SERVICE_ROLE_KEY` (no es la anon, es la service_role)
