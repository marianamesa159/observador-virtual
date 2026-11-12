-- ============================================================================
-- INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
-- Migración 006: Datos Iniciales de Demostración y Pruebas
-- Año Lectivo 2026 - Manizales, Caldas
-- ============================================================================

-- 1. Año Lectivo
INSERT INTO public.academic_years (id, year_number, is_current, start_date, end_date)
VALUES ('a0000000-0000-0000-0000-000000000001', 2026, TRUE, '2026-01-20', '2026-11-28')
ON CONFLICT (year_number) DO NOTHING;

-- 2. Categorías del Manual de Convivencia
INSERT INTO public.observation_categories (code, name, description, severity) VALUES
('MERITO-01', 'Reconocimiento Académico / Convivencial', 'Felicitación por destacado desempeño, empatía o colaboración en clase', 'Positiva'),
('TIPO-I', 'Situación Tipo I (Falta Leve)', 'Conflictos manejados inadecuadamente o faltas menores contra el orden pedagógico', 'Leve'),
('TIPO-II', 'Situación Tipo II (Falta Grave)', 'Agresiones escolares, acoso o daño deliberado a elementos institucionales', 'Grave'),
('TIPO-III', 'Situación Tipo III (Falta Gravísima)', 'Hechos constitutivos de presuntos delitos contra la libertad o integridad', 'Gravísima')
ON CONFLICT (code) DO NOTHING;

-- 3. Grados y Grupos
INSERT INTO public.grades (id, name, grade_level, shift, academic_year_id) VALUES
('g0000000-0000-0000-0000-000000000010', '10-A', 10, 'Mañana', 'a0000000-0000-0000-0000-000000000001'),
('g0000000-0000-0000-0000-000000000009', '9-B', 9, 'Mañana', 'a0000000-0000-0000-0000-000000000001'),
('g0000000-0000-0000-0000-000000000008', '8-C', 8, 'Tarde', 'a0000000-0000-0000-0000-000000000001'),
('g0000000-0000-0000-0000-000000000011', '11-1', 11, 'Mañana', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
