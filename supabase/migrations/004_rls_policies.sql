-- ============================================================================
-- INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
-- Migración 004: Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)
-- Conforme a la Ley 1581 de 2012 y Manual de Convivencia Escolar
-- ============================================================================

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orientation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares de seguridad (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_type AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_guardian_of_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id
    WHERE g.profile_id = auth.uid() AND sg.student_id = p_student_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_student_self(p_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE id = p_student_id AND profile_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Políticas para PROFILES
CREATE POLICY "Usuarios ven su propio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Directivos y docentes consultan perfiles institucionales" ON public.profiles
  FOR SELECT USING (
    get_current_user_role() IN ('administrador', 'rector', 'coordinador', 'docente', 'orientador')
  );

CREATE POLICY "Administrador gestiona todos los perfiles" ON public.profiles
  FOR ALL USING (get_current_user_role() = 'administrador');

-- 2. Políticas para STUDENTS
CREATE POLICY "Docentes, directivos y orientadores consultan estudiantes" ON public.students
  FOR SELECT USING (
    get_current_user_role() IN ('administrador', 'rector', 'coordinador', 'docente', 'orientador')
  );

CREATE POLICY "Estudiantes solo ven su propio registro" ON public.students
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Acudientes solo ven sus estudiantes vinculados" ON public.students
  FOR SELECT USING (is_guardian_of_student(id));

-- 3. Políticas para OBSERVATIONS (Folio Digital)
CREATE POLICY "Directivos y coordinadores ven todas las observaciones" ON public.observations
  FOR SELECT USING (
    get_current_user_role() IN ('administrador', 'rector', 'coordinador')
  );

CREATE POLICY "Docentes ven observaciones y registran nuevas" ON public.observations
  FOR SELECT USING (get_current_user_role() = 'docente');

CREATE POLICY "Docentes insertan observaciones" ON public.observations
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('docente', 'coordinador', 'administrador') AND author_id = auth.uid()
  );

CREATE POLICY "Docentes editan únicamente sus propias observaciones" ON public.observations
  FOR UPDATE USING (
    author_id = auth.uid() OR get_current_user_role() = 'administrador'
  );

CREATE POLICY "Estudiantes ven sus observaciones autorizadas" ON public.observations
  FOR SELECT USING (is_student_self(student_id));

CREATE POLICY "Acudientes ven observaciones de sus acudidos" ON public.observations
  FOR SELECT USING (is_guardian_of_student(student_id));

-- 4. Políticas para ORIENTATION_RECORDS (Expediente Confidencial de Psicología)
-- ESTRICTO: NO visible para docentes, estudiantes o acudientes
CREATE POLICY "Solo Orientador, Rector y Coordinador acceden a fichas de orientación" ON public.orientation_records
  FOR ALL USING (
    get_current_user_role() IN ('orientador', 'rector', 'coordinador', 'administrador')
  );

-- 5. Políticas para SIGNATURES (Firmas Virtuales)
CREATE POLICY "Lectura de firmas autorizada" ON public.signatures
  FOR SELECT USING (
    get_current_user_role() IN ('administrador', 'rector', 'coordinador', 'docente')
    OR signer_id = auth.uid()
  );

CREATE POLICY "Acudientes y docentes firman sus registros" ON public.signatures
  FOR INSERT WITH CHECK (signer_id = auth.uid());

-- 6. Políticas para NOTIFICATIONS
CREATE POLICY "Usuarios gestionan sus notificaciones" ON public.notifications
  FOR ALL USING (user_id = auth.uid());
