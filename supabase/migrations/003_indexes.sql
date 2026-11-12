-- ============================================================================
-- INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
-- Migración 003: Índices y Optimización de Consultas
-- ============================================================================

-- Índices en perfiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_document ON public.profiles(document_number);

-- Índices en estudiantes
CREATE INDEX IF NOT EXISTS idx_students_grade ON public.students(grade_id);
CREATE INDEX IF NOT EXISTS idx_students_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(enrollment_status);

-- Índices en observaciones (búsquedas frecuentes en menos de 3 segundos)
CREATE INDEX IF NOT EXISTS idx_observations_student_created ON public.observations(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_author ON public.observations(author_id);
CREATE INDEX IF NOT EXISTS idx_observations_type ON public.observations(type, subtype);
CREATE INDEX IF NOT EXISTS idx_observations_status ON public.observations(status);
CREATE INDEX IF NOT EXISTS idx_observations_date ON public.observations(incident_date DESC);

-- Índices en firmas y compromisos
CREATE INDEX IF NOT EXISTS idx_signatures_observation ON public.signatures(observation_id);
CREATE INDEX IF NOT EXISTS idx_commitments_student_status ON public.commitments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_orientation_student ON public.orientation_records(student_id);

-- Índices en auditoría
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
