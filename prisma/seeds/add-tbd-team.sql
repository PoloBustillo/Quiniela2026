-- Script para crear equipo TBD (Por Definir)
INSERT INTO "Team" (id, name, code, flag, "group", "createdAt")
VALUES (
  'tbd-team-2026',
  'Por Definir',
  'TBD',
  '/flags/tbd.png',
  NULL,
  NOW()
) ON CONFLICT (code) DO NOTHING;
