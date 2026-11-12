-- ============================================================================
-- INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
-- Migración 005: Configuración de Supabase Storage para Evidencias y Firmas
-- ============================================================================

-- Crear bucket privado para evidencias documentales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias-observador',
  'evidencias-observador',
  FALSE,
  10485760, -- 10MB límite
  ARRAY['image/png', 'image/jpeg', 'application/pdf', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Crear bucket privado para firmas digitales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firmas-digitales',
  'firmas-digitales',
  FALSE,
  2097152, -- 2MB límite
  ARRAY['image/png']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para evidencias
CREATE POLICY "Docentes y directivos suben evidencias"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'evidencias-observador'
);

CREATE POLICY "Usuarios autorizados descargan evidencias según RLS"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'evidencias-observador'
);

-- Políticas de Storage para firmas digitales
CREATE POLICY "Usuarios firman y guardan su trazo"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'firmas-digitales' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Lectura de firmas autorizadas"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'firmas-digitales'
);
