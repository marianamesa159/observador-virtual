-- ============================================================================
-- INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
-- Migración 002: Observaciones, Convivencia, Compromisos, Firmas y Orientación
-- Base de datos: PostgreSQL (Supabase)
-- ============================================================================

-- 1. Tabla de Categorías del Manual de Convivencia
CREATE TABLE IF NOT EXISTS public.observation_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'TIPO-I', 'TIPO-II', 'TIPO-III', 'ACAD-01', 'MERITO'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'Leve', -- Positiva, Leve, Grave, Gravísima
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Tabla de Observaciones (Folio Digital del Estudiante)
CREATE TABLE IF NOT EXISTS public.observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio_number SERIAL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.observation_categories(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'Convivencial', -- Convivencial, Académica
  subtype VARCHAR(30) NOT NULL DEFAULT 'Negativa',   -- Positiva (Mérito), Negativa (Falta)
  situation_level VARCHAR(20) DEFAULT 'Tipo I',      -- Tipo I, Tipo II, Tipo III (Ley 1620 / Manual)
  description TEXT NOT NULL,
  corrective_measure TEXT, -- Medio de corrección / acción pedagógica formativa
  context_location VARCHAR(100), -- Aula de clase, patio, biblioteca, virtual
  status VARCHAR(30) NOT NULL DEFAULT 'Registrado', -- Registrado, Notificado, Firmado, En Seguimiento, Cerrado
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Compromisos y Acuerdos Disciplinarios / Académicos
CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  observation_id UUID REFERENCES public.observations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  registered_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'Activo', -- Activo, Cumplido, Incumplido, En Revisión
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla de Firmas Virtuales y Constancias de Conocimiento (Ley 1581 de 2012)
CREATE TABLE IF NOT EXISTS public.signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  observation_id UUID NOT NULL REFERENCES public.observations(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  signer_role VARCHAR(50) NOT NULL, -- acudiente, docente, estudiante, coordinador
  signature_data_url TEXT NOT NULL, -- Base64 PNG de la firma trazada en canvas
  legal_notice_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  legal_notice_text TEXT NOT NULL, -- En cumplimiento del Manual de Convivencia y Ley 1581...
  signer_ip VARCHAR(50),
  user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(observation_id, signer_id)
);

-- 5. Tabla de Fichas de Orientación Escolar (Psicología / Expediente Confidencial)
CREATE TABLE IF NOT EXISTS public.orientation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  referral_source VARCHAR(150), -- Remitido por Profr. Carlos Rodríguez
  referral_reason TEXT NOT NULL, -- Motivo de la remisión
  support_plan TEXT NOT NULL,    -- Plan de acompañamiento (Psicológico / Pedagógico)
  student_commitment TEXT NOT NULL, -- Compromiso del estudiante
  institution_commitment TEXT NOT NULL, -- Compromiso docente / institucional
  counselor_signature_url TEXT,
  is_confidential BOOLEAN NOT NULL DEFAULT TRUE, -- Acceso exclusivo Orientación/Coordinación/Rectoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Tabla de Evidencias Documentales de Observaciones
CREATE TABLE IF NOT EXISTS public.observation_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  observation_id UUID NOT NULL REFERENCES public.observations(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size_bytes BIGINT,
  uploaded_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
