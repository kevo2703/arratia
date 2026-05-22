-- =====================================================================
-- ARRATIA COTIZADOR — Demo data (5 productos + 5 clientes + 5 cotizaciones)
-- =====================================================================
-- Ejecuta DESPUÉS de SETUP.sql.
-- Idempotente: si ya existen filas con los mismos códigos/razón social,
-- no las duplica. Reemplaza los ítems de las cotizaciones demo.
-- =====================================================================

do $$
declare
  -- Productos
  v_cas uuid; v_len uuid; v_gua uuid; v_bot uuid; v_rop uuid;
  -- Categorías
  v_cat_cab uuid; v_cat_fac uuid; v_cat_man uuid; v_cat_pie uuid; v_cat_rop uuid;
  -- Clientes
  v_cli1 uuid; v_cli2 uuid; v_cli3 uuid; v_cli4 uuid; v_cli5 uuid;
  -- Cotizaciones
  v_cot1 uuid; v_cot2 uuid; v_cot3 uuid; v_cot4 uuid; v_cot5 uuid;
begin
  -- ===== Capturar IDs de categorías existentes =====
  select id into v_cat_cab from categorias where nombre = 'Protección de cabeza';
  select id into v_cat_fac from categorias where nombre = 'Protección facial y visual';
  select id into v_cat_man from categorias where nombre = 'Protección de manos';
  select id into v_cat_pie from categorias where nombre = 'Protección de pies';
  select id into v_cat_rop from categorias where nombre = 'Ropa de seguridad';

  -- ===== 5 PRODUCTOS =====
  insert into productos (codigo, nombre, descripcion, categoria_id, marca, unidad, precio, stock, activo) values
    ('CAS-001', 'Casco de seguridad amarillo tipo I', 'ANSI Z89.1, ajuste ratchet de 4 puntos, suspensión polietileno', v_cat_cab, 'Steelpro', 'UND', 18.50, 120, true),
    ('LEN-001', 'Lentes de seguridad claros Virtua', 'Policarbonato antiempañante, ANSI Z87.1', v_cat_fac, '3M Virtua', 'UND', 8.50, 300, true),
    ('GUA-001', 'Guante de vaqueta reforzado 10"', 'Cuero vacuno, palma y dorso vaqueta, talla 10', v_cat_man, 'Vicsa', 'PAR', 6.50, 400, true),
    ('BOT-001', 'Bota de seguridad punta de acero caña media', 'Cuero flor, suela poliuretano antideslizante, talla 41-45', v_cat_pie, 'Steelpro Maraisa', 'PAR', 95.00, 80, true),
    ('ROP-001', 'Chaleco reflectivo malla naranja', 'Cinta reflectiva 5 cm pecho y espalda, talla M-XL', v_cat_rop, 'Vicsa', 'UND', 9.50, 250, true)
  on conflict (codigo) do nothing;

  select id into v_cas from productos where codigo = 'CAS-001';
  select id into v_len from productos where codigo = 'LEN-001';
  select id into v_gua from productos where codigo = 'GUA-001';
  select id into v_bot from productos where codigo = 'BOT-001';
  select id into v_rop from productos where codigo = 'ROP-001';

  -- ===== 5 CLIENTES =====
  -- Idempotencia por razon_social (no hay UNIQUE en BD, uso WHERE NOT EXISTS)
  insert into clientes (ruc, razon_social, contacto, telefono, correo, direccion, notas)
  select * from (values
    ('20100123456', 'Constructora Andina S.A.C.', 'Ing. Carlos Rojas — Jefe SSOMA', '+51 987 654 321', 'crojas@constructoraandina.pe', 'Av. Javier Prado Este 1450, San Isidro, Lima', 'Cliente recurrente, compra trimestral'),
    ('20200234567', 'Minera Sur Perú S.R.L.', 'Patricia Mendoza — Compras', '+51 956 123 789', 'compras@minerasurperu.com', 'Las Begonias 545, Of. 802, San Isidro, Lima', 'Pide certificaciones ANSI/EN. Crédito a 30 días'),
    ('20300345678', 'Pesquera del Pacífico E.I.R.L.', 'Juan Aguilar — Logística', '+51 998 765 432', 'jaguilar@pespacifico.pe', 'Av. Argentina 4500, Callao', 'Despacho a almacén Callao'),
    ('20400456789', 'Servicios Industriales Lima S.A.', 'Ing. Mónica Salas', '+51 977 888 999', 'msalas@silima.com.pe', 'Av. Industrial 875, Independencia, Lima', 'Subcontratista mantenimiento eléctrico'),
    ('20500567890', 'Eléctrica Norte S.A.C.', 'Roberto Quispe — Compras', '+51 945 123 456', 'compras@electricanorte.pe', 'Av. Túpac Amaru 234, Comas, Lima', 'Compra anual de uniformes y EPP')
  ) as v(ruc, razon_social, contacto, telefono, correo, direccion, notas)
  where not exists (select 1 from clientes c where c.razon_social = v.razon_social);

  select id into v_cli1 from clientes where razon_social = 'Constructora Andina S.A.C.';
  select id into v_cli2 from clientes where razon_social = 'Minera Sur Perú S.R.L.';
  select id into v_cli3 from clientes where razon_social = 'Pesquera del Pacífico E.I.R.L.';
  select id into v_cli4 from clientes where razon_social = 'Servicios Industriales Lima S.A.';
  select id into v_cli5 from clientes where razon_social = 'Eléctrica Norte S.A.C.';

  -- ===== 5 COTIZACIONES =====

  -- COT 1: Constructora — aceptada — 50 cascos + 50 lentes + 50 guantes
  insert into cotizaciones (numero, cliente_id, fecha, validez_dias, moneda, incluye_igv, subtotal, igv, total, condiciones_pago, condiciones_entrega, notas, estado)
  values ('COT-2026-0001', v_cli1, current_date - 20, 15, 'PEN', true, 1675.00, 301.50, 1976.50,
    'Contado contra entrega', 'Entrega en obra Av. Las Camelias 320, Surco — 2 días útiles',
    'Pedido para nueva obra. Incluye capacitación de uso en sitio sin costo adicional.', 'aceptada')
  on conflict (numero) do nothing;
  select id into v_cot1 from cotizaciones where numero = 'COT-2026-0001';
  delete from cotizacion_items where cotizacion_id = v_cot1;
  insert into cotizacion_items (cotizacion_id, producto_id, codigo, nombre, descripcion, unidad, cantidad, precio_unitario, descuento_pct, subtotal, orden) values
    (v_cot1, v_cas, 'CAS-001', 'Casco de seguridad amarillo tipo I', 'ANSI Z89.1, ajuste ratchet 4 puntos', 'UND', 50, 18.50, 0, 925.00, 0),
    (v_cot1, v_len, 'LEN-001', 'Lentes de seguridad claros Virtua', 'Policarbonato antiempañante, ANSI Z87.1', 'UND', 50, 8.50, 0, 425.00, 1),
    (v_cot1, v_gua, 'GUA-001', 'Guante de vaqueta reforzado 10"', 'Cuero vacuno, talla 10', 'PAR', 50, 6.50, 0, 325.00, 2);

  -- COT 2: Minera — enviada — 30 botas + 30 cascos
  insert into cotizaciones (numero, cliente_id, fecha, validez_dias, moneda, incluye_igv, subtotal, igv, total, condiciones_pago, condiciones_entrega, notas, estado)
  values ('COT-2026-0002', v_cli2, current_date - 7, 30, 'PEN', true, 3405.00, 612.90, 4017.90,
    'Crédito a 30 días con orden de compra firmada', 'Entrega en almacén Lima Metropolitana, 3 días útiles',
    'Cotización para reposición de personal en faena minera. Adjuntar certificaciones al despacho.', 'enviada')
  on conflict (numero) do nothing;
  select id into v_cot2 from cotizaciones where numero = 'COT-2026-0002';
  delete from cotizacion_items where cotizacion_id = v_cot2;
  insert into cotizacion_items (cotizacion_id, producto_id, codigo, nombre, descripcion, unidad, cantidad, precio_unitario, descuento_pct, subtotal, orden) values
    (v_cot2, v_bot, 'BOT-001', 'Bota de seguridad punta de acero caña media', 'Cuero flor, suela poliuretano antideslizante', 'PAR', 30, 95.00, 0, 2850.00, 0),
    (v_cot2, v_cas, 'CAS-001', 'Casco de seguridad amarillo tipo I', 'ANSI Z89.1', 'UND', 30, 18.50, 0, 555.00, 1);

  -- COT 3: Pesquera — borrador — 100 guantes + 50 chalecos
  insert into cotizaciones (numero, cliente_id, fecha, validez_dias, moneda, incluye_igv, subtotal, igv, total, condiciones_pago, condiciones_entrega, notas, estado)
  values ('COT-2026-0003', v_cli3, current_date, 15, 'PEN', true, 1125.00, 202.50, 1327.50,
    'Contado contra entrega', 'Entrega en almacén Callao, mismo día',
    'Borrador en revisión interna. Confirmar tallas antes de despacho.', 'borrador')
  on conflict (numero) do nothing;
  select id into v_cot3 from cotizaciones where numero = 'COT-2026-0003';
  delete from cotizacion_items where cotizacion_id = v_cot3;
  insert into cotizacion_items (cotizacion_id, producto_id, codigo, nombre, descripcion, unidad, cantidad, precio_unitario, descuento_pct, subtotal, orden) values
    (v_cot3, v_gua, 'GUA-001', 'Guante de vaqueta reforzado 10"', 'Cuero vacuno talla 10', 'PAR', 100, 6.50, 0, 650.00, 0),
    (v_cot3, v_rop, 'ROP-001', 'Chaleco reflectivo malla naranja', 'Cinta reflectiva 5 cm pecho y espalda', 'UND', 50, 9.50, 0, 475.00, 1);

  -- COT 4: SI Lima — aceptada — 20 botas + 100 lentes
  insert into cotizaciones (numero, cliente_id, fecha, validez_dias, moneda, incluye_igv, subtotal, igv, total, condiciones_pago, condiciones_entrega, notas, estado)
  values ('COT-2026-0004', v_cli4, current_date - 14, 15, 'PEN', true, 2750.00, 495.00, 3245.00,
    'Contado contra entrega', 'Entrega en taller central Independencia, 2 días útiles',
    'Reposición trimestral. Cliente solicita factura electrónica al correo.', 'aceptada')
  on conflict (numero) do nothing;
  select id into v_cot4 from cotizaciones where numero = 'COT-2026-0004';
  delete from cotizacion_items where cotizacion_id = v_cot4;
  insert into cotizacion_items (cotizacion_id, producto_id, codigo, nombre, descripcion, unidad, cantidad, precio_unitario, descuento_pct, subtotal, orden) values
    (v_cot4, v_bot, 'BOT-001', 'Bota de seguridad punta de acero caña media', 'Cuero flor, suela poliuretano', 'PAR', 20, 95.00, 0, 1900.00, 0),
    (v_cot4, v_len, 'LEN-001', 'Lentes de seguridad claros Virtua', 'Policarbonato antiempañante', 'UND', 100, 8.50, 0, 850.00, 1);

  -- COT 5: Eléctrica Norte — rechazada — 100 cascos
  insert into cotizaciones (numero, cliente_id, fecha, validez_dias, moneda, incluye_igv, subtotal, igv, total, condiciones_pago, condiciones_entrega, notas, estado)
  values ('COT-2026-0005', v_cli5, current_date - 30, 15, 'PEN', true, 1850.00, 333.00, 2183.00,
    'Contado contra entrega', 'Entrega en local Comas, 1 día útil',
    'Cliente prefirió a otro proveedor por timing. Reabrir contacto en 3 meses.', 'rechazada')
  on conflict (numero) do nothing;
  select id into v_cot5 from cotizaciones where numero = 'COT-2026-0005';
  delete from cotizacion_items where cotizacion_id = v_cot5;
  insert into cotizacion_items (cotizacion_id, producto_id, codigo, nombre, descripcion, unidad, cantidad, precio_unitario, descuento_pct, subtotal, orden) values
    (v_cot5, v_cas, 'CAS-001', 'Casco de seguridad amarillo tipo I', 'ANSI Z89.1', 'UND', 100, 18.50, 0, 1850.00, 0);

end $$;

-- =====================================================================
-- VERIFICACIÓN — los siguientes SELECTs deben devolver 5, 5 y 5
-- =====================================================================
select 'productos' as tabla, count(*) as filas from productos
union all
select 'clientes', count(*) from clientes
union all
select 'cotizaciones', count(*) from cotizaciones;
