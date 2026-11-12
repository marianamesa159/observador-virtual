-- ============================================================================
-- INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
-- Migración 001: Esquema Inicial de Tablas Maestras
-- Base de datos: PostgreSQL (Supabase)
-- ============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enumeración de roles institucionales del Manual de Convivencia
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM (
    'administrador',
    'rector',
    'coordinador',
    'docente',
    'orientador',
    'estudiante',
    'acudiente'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Tabla de Perfiles de Usuario (vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type VARCHAR(10) NOT NULL DEFAULT 'CC', -- CC, TI, CE, PEP
  document_number VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  role user_role_type NOT NULL DEFAULT 'estudiante',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Años Lectivos
CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_number INT UNIQUE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Grados y Grupos Institucionales
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL, -- e.g. '10-A', '9-B', '11-1', '8-C'
  grade_level INT NOT NULL,   -- e.g. 6, 7, 8, 9, 10, 11
  shift VARCHAR(20) NOT NULL DEFAULT 'Mañana', -- Mañana, Tarde, Sabatina
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  director_docente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(name, academic_year_id)
);

-- 4. Tabla de Estudiantes (Folio Digital)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_code VARCHAR(30) UNIQUE NOT NULL, -- Matrícula / Código
  grade_id UUID REFERENCES public.grades(id) ON DELETE RESTRICT,
  birth_date DATE,
  blood_type VARCHAR(5),
  eps VARCHAR(100),
  address TEXT,
  neighborhood VARCHAR(100),
  enrollment_status VARCHAR(30) NOT NULL DEFAULT 'Activo', -- Activo, Retirado, Graduado, Suspendido
  coexistence_status VARCHAR(30) NOT NULL DEFAULT 'Bueno', -- Bueno, Reflexión Necesaria, Aviso de Faltas
  reward_points INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Tabla de Acudientes / Padres de Familia
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  occupation VARCHAR(150),
  work_place VARCHAR(150),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Relación Estudiantes <-> Acudientes
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'Madre', -- Madre, Padre, Tutor Legal, Abuelo/a
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, guardian_id)
);

-- 7. Asignación de Docentes a Grupos
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(teacher_id, grade_id, subject, academic_year_id)
);
