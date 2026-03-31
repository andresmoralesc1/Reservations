-- Script para agregar los restaurantes del Grupo El Posit
-- Ejecutar en Supabase SQL Editor o via psql

-- El Posit - Cambrils (ya existe, actualizamos datos)
UPDATE restaurants
SET
  name = 'El Posit - Cambrils',
  phone = '+34 977 123 456',
  address = 'Passeig de la Marina, Cambrils, Tarragona',
  timezone = 'Europe/Madrid'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- El Posit - Tarragona
INSERT INTO restaurants (id, name, phone, address, timezone, is_active)
VALUES (
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'El Posit - Tarragona',
  '+34 977 234 567',
  'Plaça de la Font, Tarragona',
  'Europe/Madrid',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- El Posit - Vila-Seca
INSERT INTO restaurants (id, name, phone, address, timezone, is_active)
VALUES (
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'El Posit - Vila-Seca',
  '+34 977 345 678',
  'Avinguda del Catalunya, Vila-Seca, Tarragona',
  'Europe/Madrid',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Bar El Posit
INSERT INTO restaurants (id, name, phone, address, timezone, is_active)
VALUES (
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'Bar El Posit',
  '+34 977 456 789',
  'Rambla de Nova, Cambrils, Tarragona',
  'Europe/Madrid',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Verificar restaurantes
SELECT id, name, phone, address, is_active FROM restaurants ORDER BY name;
