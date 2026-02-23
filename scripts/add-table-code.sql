-- Agregar columna table_code con valor por defecto temporal
ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS "table_code" text DEFAULT 'TEMP';

-- Generar códigos basados en la ubicación existente
UPDATE "tables"
SET "table_code" =
  CASE
    WHEN location = 'interior' THEN 'I-' || "tableNumber"
    WHEN location = 'terraza' THEN 'T-' || "tableNumber"
    WHEN location = 'patio' THEN 'P-' || "tableNumber"
    ELSE 'M-' || "tableNumber"
  END;

-- Hacer la columna NOT NULL
ALTER TABLE "tables" ALTER COLUMN "table_code" SET NOT NULL;

-- Remover el valor por defecto
ALTER TABLE "tables" ALTER COLUMN "table_code" DROP DEFAULT;

-- Crear índice
CREATE INDEX IF NOT EXISTS "tables_table_code_idx" ON "tables" USING btree ("table_code", "restaurant_id");
