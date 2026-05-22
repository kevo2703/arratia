-- =====================================================================
-- ARRATIA COTIZADOR — Data de prueba (productos EPP + clientes)
-- =====================================================================
-- Ejecuta DESPUÉS de SETUP.sql. Idempotente — puedes correrlo varias veces.
-- Carga ~24 productos EPP típicos del mercado peruano + 4 clientes ficticios
-- para que puedas armar cotizaciones de prueba.
-- =====================================================================

-- ----------- PRODUCTOS DE PRUEBA -----------
-- Precios referenciales mercado Lima 2026 (NETOS, sin IGV)

with c as (select id, nombre from categorias)
insert into productos (codigo, nombre, descripcion, categoria_id, marca, unidad, precio, stock, activo) values

-- Protección de cabeza
('CAS-001', 'Casco de seguridad amarillo tipo I', 'ANSI Z89.1, ajuste ratchet de 4 puntos. Suspensión de polietileno', (select id from c where nombre='Protección de cabeza'), 'Steelpro', 'UND', 18.50, 50, true),
('CAS-002', 'Casco de seguridad blanco con barboquejo', 'Tipo II clase E, dieléctrico hasta 20 kV', (select id from c where nombre='Protección de cabeza'), '3M H-700', 'UND', 42.00, 30, true),
('CAS-003', 'Barbiquejo elastizado universal', 'Cinta elástica con broche metálico, compatible cascos tipo I y II', (select id from c where nombre='Protección de cabeza'), 'Vicsa', 'UND', 3.50, 100, true),

-- Protección facial y visual
('LEN-001', 'Lentes de seguridad claros Virtua', 'Policarbonato antiempañante, ANSI Z87.1', (select id from c where nombre='Protección facial y visual'), '3M Virtua', 'UND', 8.50, 200, true),
('LEN-002', 'Lentes de seguridad oscuros ZTEK', 'Filtro UV, marco gris, antifog', (select id from c where nombre='Protección facial y visual'), 'Steelpro ZTEK', 'UND', 7.20, 150, true),
('LEN-003', 'Careta facial transparente con visor', 'Suspensión ratchet, visor abatible de policarbonato 1mm', (select id from c where nombre='Protección facial y visual'), 'Truper', 'UND', 28.00, 40, true),
('LEN-004', 'Careta de soldador tonalidad 11 fija', 'Marco rígido ABS, ventana 4.5x5.25"', (select id from c where nombre='Protección facial y visual'), 'Truper SOL-11', 'UND', 24.00, 25, true),

-- Protección auditiva
('AUD-001', 'Tapones auditivos desechables 1100', 'NRR 29 dB, espuma poliuretano, par individual', (select id from c where nombre='Protección auditiva'), '3M 1100', 'PAR', 0.85, 1000, true),
('AUD-002', 'Orejeras tipo copa H7A', 'NRR 27 dB, ajustable, copas dieléctricas', (select id from c where nombre='Protección auditiva'), '3M Peltor Optime', 'UND', 65.00, 20, true),

-- Protección respiratoria
('RES-001', 'Mascarilla descartable N95 8210', 'NIOSH N95, válvula simple, ajuste nasal de aluminio', (select id from c where nombre='Protección respiratoria'), '3M 8210', 'UND', 4.50, 500, true),
('RES-002', 'Respirador media cara 6200 (silicona)', 'Reusable, talla M, compatible cartuchos serie 6000 y 2000', (select id from c where nombre='Protección respiratoria'), '3M 6200', 'UND', 95.00, 15, true),
('RES-003', 'Filtros 2097 P100 con carbón activado', 'Vapores orgánicos + partículas, par', (select id from c where nombre='Protección respiratoria'), '3M 2097', 'PAR', 35.00, 30, true),

-- Protección de manos
('GUA-001', 'Guante de vaqueta reforzado 10"', 'Cuero vacuno, palma y dorso vaqueta, talla 10', (select id from c where nombre='Protección de manos'), 'Vicsa', 'PAR', 6.50, 300, true),
('GUA-002', 'Guante nitrilo nivel químico 11 mil', 'Reusable, manga 33 cm, antideslizante', (select id from c where nombre='Protección de manos'), 'Showa 730', 'PAR', 18.00, 60, true),
('GUA-003', 'Guante anticorte nivel 5 (kevlar+HPPE)', 'Recubrimiento poliuretano, EN 388 4544, talla 9', (select id from c where nombre='Protección de manos'), 'Mapa Krytech', 'PAR', 14.50, 80, true),
('GUA-004', 'Guante de jebe industrial calibre 25', 'Largo 35 cm, antialcali, talla 9', (select id from c where nombre='Protección de manos'), 'Truper', 'PAR', 4.20, 150, true),
('GUA-005', 'Guante dieléctrico clase 0 (1000V)', 'Caucho natural, ASTM D120, par individual', (select id from c where nombre='Protección de manos'), 'Salisbury', 'PAR', 145.00, 10, true),

-- Protección de pies
('BOT-001', 'Bota de seguridad punta de acero caña media', 'Cuero flor, suela poliuretano antideslizante, talla 41-45', (select id from c where nombre='Protección de pies'), 'Steelpro Maraisa', 'PAR', 95.00, 60, true),
('BOT-002', 'Bota dieléctrica sin punta de acero', 'Cuero negro, suela goma, certificada 14 kV', (select id from c where nombre='Protección de pies'), 'Bata Industrials', 'PAR', 135.00, 25, true),
('BOT-003', 'Bota PVC caña alta amarilla', 'Antideslizante, suela inyectada, talla 41-45', (select id from c where nombre='Protección de pies'), 'Norseg', 'PAR', 28.00, 100, true),

-- Ropa de seguridad
('ROP-001', 'Chaleco reflectivo malla naranja', 'Cinta reflectiva 5 cm en pecho y espalda, talla M-XL', (select id from c where nombre='Ropa de seguridad'), 'Vicsa', 'UND', 9.50, 200, true),
('ROP-002', 'Mameluco descartable Tyvek con capucha', 'Categoría III tipo 5/6, talla L', (select id from c where nombre='Ropa de seguridad'), 'DuPont Tyvek 500', 'UND', 32.00, 40, true),
('ROP-003', 'Casaca cuero soldador con manga larga', 'Cuero crupón, costuras kevlar, talla L', (select id from c where nombre='Ropa de seguridad'), 'Truper', 'UND', 78.00, 15, true),

-- Protección anticaídas
('ALT-001', 'Arnés cuerpo completo 4 anillos', 'Capacidad 140 kg, certificado ANSI Z359.11', (select id from c where nombre='Protección anticaídas'), 'Steelpro', 'UND', 165.00, 20, true),
('ALT-002', 'Línea de vida con absorbedor 1.8 m', 'Mosquetón doble seguro, gancho de doble enganche', (select id from c where nombre='Protección anticaídas'), 'Vicsa Mega', 'UND', 95.00, 25, true),

-- Señalización
('SEN-001', 'Cono de señalización PVC 70 cm reflectivo', 'Base ancha de hule, cinta reflectiva blanca', (select id from c where nombre='Señalización y emergencia'), 'Vicsa', 'UND', 18.00, 80, true),
('SEN-002', 'Cinta de seguridad amarilla "PELIGRO" rollo 200m', 'PVC 7.5 cm de ancho, alta visibilidad', (select id from c where nombre='Señalización y emergencia'), 'Truper', 'UND', 12.50, 50, true),
('SEN-003', 'Extintor PQS 6 kg con manómetro', 'ABC al 75%, certificado UL, recargable', (select id from c where nombre='Señalización y emergencia'), 'Saval', 'UND', 85.00, 30, true)
on conflict (codigo) do nothing;

-- ----------- CLIENTES DE PRUEBA -----------

insert into clientes (ruc, razon_social, contacto, telefono, correo, direccion, notas) values
('20100123456', 'Constructora Andina S.A.C.', 'Ing. Carlos Rojas — Jefe SSOMA', '+51 987 654 321', 'crojas@constructoraandina.pe', 'Av. Javier Prado Este 1450, San Isidro, Lima', 'Cliente recurrente. Compra trimestral. Pide siempre boleta y guía de remisión.'),
('20200234567', 'Minera Sur Perú S.R.L.', 'Sra. Patricia Mendoza — Compras', '+51 956 123 789', 'compras@minerasurperu.com', 'Calle Las Begonias 545, Of. 802, San Isidro, Lima', 'Sector minero. Solicita certificaciones ANSI/EN en cada cotización. Crédito a 30 días.'),
('20300345678', 'Pesquera del Pacífico E.I.R.L.', 'Juan Aguilar — Logística', '+51 998 765 432', 'jaguilar@pespacifico.pe', 'Av. Argentina 4500, Callao', 'Despacho a almacén Callao. Mayoría EPP marítimo (PVC, anticorrosión).'),
('20400456789', 'Servicios Industriales Lima S.A.', 'Ing. Mónica Salas', '+51 977 888 999', 'msalas@silima.com.pe', 'Av. Industrial 875, Independencia, Lima', 'Subcontratista de mantenimiento eléctrico. Compra recurrente de dieléctricos.')
on conflict do nothing;

-- =====================================================================
-- FIN SEED
-- =====================================================================
-- Después de ejecutar esto deberías ver en la app:
-- - 28 productos en /productos
-- - 4 clientes en /clientes
-- =====================================================================
