# OBSERVADOR VIRTUAL
## Sistema Digital de Convivencia Escolar — Instituto Universitario de Caldas
**Ubicación:** Manizales, Caldas, Colombia  
**Año Lectivo:** 2026  
**Autores del Proyecto:** Stiven Riofrio · Mariana Mesa (Grupo 11-1)  
**Orientación Pedagógica:** Profr. Diego Eddye Hurtado  

---

## 1. Descripción y Problemática Institucional

El **Observador Virtual** es una solución web integral diseñada para reemplazar el tradicional cuaderno físico de convivencia ("el observador del estudiante"). 

Tradicionalmente, el registro en papel conllevaba:
- Riesgos de deterioro, extravío o alteración sin auditoría.
- Información dispersa y demoras críticas para preparar reuniones del Comité de Convivencia.
- Falta de control de acceso y riesgos de exposición de datos sensibles de menores (Ley 1581 de 2012).
- Ausencia de constancias de conocimiento oportunas firmadas por acudientes.

La plataforma centraliza la información en un **Folio Digital Único** por estudiante, clasifica observaciones según el Manual de Convivencia (Académicas y Convivenciales Tipo I, II y III), habilita la firma virtual de padres mediante canvas táctil, y genera reportes imprimibles oficiales para auditorías e inspecciones de la Secretaría y Ministerio de Educación.

---

## 2. Tecnologías Implementadas

Conforme a los requerimientos técnicos oficiales:
- **Frontend:** HTML5 semántico, CSS3 moderno (Custom Properties, CSS Grid, Flexbox, Media Queries y `@media print`), JavaScript Vanilla (ES6 Modules puro).
- **Backend & Base de Datos:** PostgreSQL en Supabase con cliente oficial `@supabase/supabase-js`, autenticación, Row Level Security (RLS) y almacenamiento seguro de evidencias.
- **Herramientas de Evaluación:** Selector interactivo de roles en el encabezado para alternar entre los 6 perfiles institucionales en tiempo real.

---

## 3. Modelo Entidad-Relación (Base de Datos Relacional)

```
       ┌──────────────────────┐
       │   academic_years     │
       └──────────┬───────────┘
                  │ 1
                  │ N
       ┌──────────▼───────────┐
       │       grades         │
       └──────────┬───────────┘
                  │ 1
                  │ N
┌──────────────┐  │   ┌─────────────────────┐       ┌──────────────────────┐
│  auth.users  ├──┴──►│      students       │◄──────┤      guardians       │
└──────┬───────┘      └──────────┬──────────┘N     1└──────────┬───────────┘
       │ 1                       │                             │
       │                         │ 1                           │ N
┌──────▼───────┐                 │ N                           │
│   profiles   │      ┌──────────▼──────────┐       ┌──────────▼───────────┐
└──────┬───────┘      │    observations     │       │  student_guardians   │
       │              └────┬──────┬─────────┘       └──────────────────────┘
       │ 1                 │ 1    │ 1
       │                   │      │
       │ N                 │ N    │ N
┌──────▼───────┐      ┌────▼──────▼─────────┐
│  audit_logs  │      │ signatures / commits│
└──────────────┘      └─────────────────────┘
```

---

## 4. Scripts SQL para Supabase (`/supabase/migrations/`)

1. **`001_initial_schema.sql`**: Tablas maestras (`profiles`, `students`, `guardians`, `grades`, `academic_years`).
2. **`002_relationships.sql`**: Tablas operativas (`observations`, `commitments`, `signatures`, `orientation_records`, `evidence`).
3. **`003_indexes.sql`**: Índices para consultas en menos de 3 segundos (`incident_date`, `student_id`, `status`).
4. **`004_rls_policies.sql`**: Políticas Row Level Security por rol (estudiantes y acudientes restringidos a su folio; orientación escolar confidencial).
5. **`005_storage_policies.sql`**: Buckets privados de almacenamiento para evidencias y firmas digitales.
6. **`006_seed_data.sql`**: Datos iniciales para cursos 10-A, 9-B, 8-C y 11-1 del Instituto de Caldas.

---

## 5. Instrucciones de Configuración y Despliegue

### A. Ejecución Local
```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo en puerto 3000
npm run dev
```

### B. Conexión con Proyecto Supabase
1. Ingresa a [https://supabase.com](https://supabase.com) y crea un nuevo proyecto llamado `observador-virtual-caldas`.
2. Dirígete a **SQL Editor** y ejecuta secuencialmente los scripts de `/supabase/migrations/` (del `001` al `006`).
3. En **Project Settings -> API**, copia tu `URL` y tu `anon public key`.
4. Copia el archivo `.env.example` como `.env` y asigna tus credenciales:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   ```

### C. Despliegue en Vercel
1. Conecta el repositorio en [https://vercel.com](https://vercel.com).
2. Configura el Framework Preset como **Vite**.
3. Agrega las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Haz clic en **Deploy**.

---

## 6. Cumplimiento de la Ley 1581 de 2012 y Manual de Convivencia

- **Protección de Datos Sensibles:** Los expedientes de orientación escolar (psicología) manejan políticas RLS estrictas que impiden su visualización a docentes regulares o acudientes.
- **Trazabilidad Inmutable:** Toda observación, compromiso y firma almacena marca de tiempo, usuario responsable y dirección IP en la tabla `audit_logs`.
- **Firma Virtual y Formato Físico:** El sistema permite firma digital sobre pantalla táctil y ofrece formato listo para imprimir cuando se requiera firma manuscrita para trámites oficiales ante el Ministerio de Educación.
