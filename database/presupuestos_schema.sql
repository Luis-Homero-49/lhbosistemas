-- ======================================================================
-- ESPECIFICACIÓN TÉCNICA: MÓDULO DE PRESUPUESTOS, PROYECTOS Y P&L
-- Proyecto: lhbosistemas.com (lhvosistemas.com)
-- Moneda base de cálculo interno: USD
-- Conversión en cobros/pagos: Bolívares (VES) a tasa oficial BCV
-- ======================================================================

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    empresa VARCHAR(150),
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1B. Tabla de Requerimientos Recibidos (Bandeja de Entrada desde Web / WhatsApp)
CREATE TABLE IF NOT EXISTS requerimientos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    nombre VARCHAR(120) NOT NULL,
    empresa VARCHAR(150),
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    rubro VARCHAR(120) DEFAULT 'No especificado',
    mensaje TEXT NOT NULL,
    estado VARCHAR(25) DEFAULT 'nuevo'
        CHECK (estado IN ('nuevo', 'en_elaboracion', 'cotizado', 'archivado')),
    presupuesto_id INTEGER,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL UNIQUE, -- Ej: PRE-2026-001
    titulo VARCHAR(200) NOT NULL,
    alcance TEXT NOT NULL,
    monto_total_usd NUMERIC(12, 2) NOT NULL,
    plan_pago JSONB,
    token_acceso VARCHAR(64) NOT NULL UNIQUE, -- UUID para URL segura del cliente
    estado VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'aprobado', 'en_negociacion', 'rechazado')),
    comentarios_cliente TEXT,
    fecha_vencimiento DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Proyectos (Se genera tras aprobarse el presupuesto)
CREATE TABLE IF NOT EXISTS proyectos (
    id SERIAL PRIMARY KEY,
    presupuesto_id INTEGER NOT NULL REFERENCES presupuestos(id) ON DELETE RESTRICT,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    nombre VARCHAR(200) NOT NULL,
    monto_acordado_usd NUMERIC(12, 2) NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_estimada_fin DATE,
    estado VARCHAR(20) DEFAULT 'en_desarrollo' 
        CHECK (estado IN ('en_desarrollo', 'pausado', 'completado', 'cancelado')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Facturas / Cobros (Ingresos)
CREATE TABLE IF NOT EXISTS facturas_cobros (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    numero_factura VARCHAR(50) NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    monto_usd NUMERIC(12, 2) NOT NULL,
    moneda_pago VARCHAR(5) DEFAULT 'VES' CHECK (moneda_pago IN ('USD', 'VES')),
    tasa_bcv NUMERIC(12, 4) DEFAULT 1.0000,
    monto_ves NUMERIC(14, 2), -- Calculado: monto_usd * tasa_bcv al momento del pago
    referencia_bancaria VARCHAR(100),
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_pago DATE,
    estado VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'cobrado', 'anulado')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Gastos Directos (Egresos y Costos)
CREATE TABLE IF NOT EXISTS gastos_proyecto (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    descripcion VARCHAR(250) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'hosting', 'dominio', 'licencia', 'subcontratacion', etc.
    moneda_origen VARCHAR(5) DEFAULT 'VES' CHECK (moneda_origen IN ('USD', 'VES')),
    monto_original NUMERIC(14, 2) NOT NULL,
    tasa_cambio NUMERIC(12, 4) DEFAULT 1.0000,
    monto_equivalente_usd NUMERIC(12, 2) NOT NULL, -- Normalizado para P&L
    fecha_gasto DATE DEFAULT CURRENT_DATE,
    comprobante_url VARCHAR(255),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados para búsquedas rápidas por token y relaciones
CREATE INDEX IF NOT EXISTS idx_presupuestos_token_acceso ON presupuestos(token_acceso);
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente_id ON presupuestos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cobros_proyecto_id ON facturas_cobros(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_gastos_proyecto_proyecto_id ON gastos_proyecto(proyecto_id);
