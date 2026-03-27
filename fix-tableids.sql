-- Fix corrupt tableIds in reservations table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gzuedwedbovofiycwety/sql

UPDATE reservations
SET table_ids = NULL
WHERE table_ids IS NOT NULL
AND jsonb_typeof(table_ids) != 'array';

-- Verify fix
SELECT reservation_code, table_ids,
       jsonb_typeof(table_ids) as table_ids_type
FROM reservations
WHERE table_ids IS NOT NULL
LIMIT 10;
