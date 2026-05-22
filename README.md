# Arratia Cotizador EPP

Sistema interno de cotizaciones para venta de equipos de protección personal.

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase + `@react-pdf/renderer`.

**Para arrancar:** ver [`SETUP_QUICKSTART.md`](./SETUP_QUICKSTART.md). 5 pasos, ~10 minutos.

## Features

- Gestión de catálogo EPP por categorías (cabeza, manos, pies, ojos, respiratoria, etc.)
- Base de clientes con RUC, contacto y datos comerciales
- Cotizaciones con numeración automática `COT-YYYY-NNNN`
- IGV 18% desglosado, configurable (sumar o incluir)
- Validez en días, condiciones de pago y entrega editables por cotización
- PDF profesional con logo, RUC, cuentas bancarias y términos
- Envío por **WhatsApp** (`wa.me`) y **correo** (`mailto:`) con link al PDF pre-armado
- Estados: borrador → enviada → aceptada / rechazada / expirada
- Dashboard con KPIs del mes: total cotizado, aceptado, productos, clientes

## Stack rationale

- **Next.js 15** — App Router + Server Components + Server Actions = mínimo JS al cliente
- **Supabase** — Auth + Postgres + RLS gratis para empezar
- **@react-pdf/renderer** — PDF nativo server-side (no requiere headless browser ni screenshot del DOM)
- **Tailwind v4** — Diseño rápido con CSS vars para tema Arratia (naranja seguridad + grafito)
- **wa.me + mailto:** — Cero infraestructura adicional para envíos, el admin elige a quién mandar
