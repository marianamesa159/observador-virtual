/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Adaptador de Persistencia: Supabase Client + Almacenamiento Local Reactivo
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase = null;
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Conectado exitosamente al proyecto:', SUPABASE_URL);
  } catch (err) {
    console.warn('[Supabase] Error al inicializar cliente Supabase:', err);
  }
}

// Almacén Local de Contingencia (Versión 4: Grados 11-1 a 11-4, staff dinámico sin fake users)
const STORAGE_KEY = 'observador_virtual_caldas_v4';

export function getInitialSeedData() {
  return {
    grades: ['11-1', '11-2', '11-3', '11-4'],
    students: [
      {
        id: 'est-11101',
        name: 'Mariana Mesa',
        shortName: 'Mariana Mesa',
        code: '11101',
        grade: '11-1',
        shift: 'Mañana',
        avatar: '/src/assets/images/avatar_estudiante_maria_1794435251703.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Patricia Mesa',
        guardianPhone: '312-555-0192',
        guardianEmail: 'patricia.mesa@padres.caldas.edu.co'
      },
      {
        id: 'est-11102',
        name: 'Stiven Riofrio Manrique',
        shortName: 'Stiven Riofrio',
        code: '11102',
        grade: '11-1',
        shift: 'Mañana',
        avatar: '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Clara Manrique',
        guardianPhone: '314-555-0144',
        guardianEmail: 'clara.manrique@padres.caldas.edu.co'
      },
      {
        id: 'est-11103',
        name: 'Juan Esteban Molina García',
        shortName: 'Juan Esteban Molina',
        code: '11103',
        grade: '11-1',
        shift: 'Mañana',
        avatar: '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'María García',
        guardianPhone: '311-555-9821',
        guardianEmail: 'maria.garcia@padres.caldas.edu.co'
      },
      {
        id: 'est-11104',
        name: 'María Fernanda Zuluaga Botero',
        shortName: 'María Fernanda Zuluaga',
        code: '11104',
        grade: '11-1',
        shift: 'Mañana',
        avatar: '/src/assets/images/avatar_estudiante_maria_1794435251703.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Alberto Zuluaga',
        guardianPhone: '310-555-8712',
        guardianEmail: 'alberto.zuluaga@padres.caldas.edu.co'
      },
      {
        id: 'est-11201',
        name: 'Carlos Andrés López Morales',
        shortName: 'Carlos López',
        code: '11201',
        grade: '11-2',
        shift: 'Mañana',
        avatar: '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Patricia Morales',
        guardianPhone: '315-555-6677',
        guardianEmail: 'patricia.morales@padres.caldas.edu.co'
      },
      {
        id: 'est-11202',
        name: 'Emily Montoya Mora',
        shortName: 'Emily Montoya',
        code: '11202',
        grade: '11-2',
        shift: 'Mañana',
        avatar: '/src/assets/images/avatar_estudiante_maria_1794435251703.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Carlos Montoya',
        guardianPhone: '316-555-3322',
        guardianEmail: 'carlos.montoya@padres.caldas.edu.co'
      },
      {
        id: 'est-11203',
        name: 'Jhoann Estiven Giraldo',
        shortName: 'Jhoann Giraldo',
        code: '11203',
        grade: '11-2',
        shift: 'Mañana',
        avatar: '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Sandra Giraldo',
        guardianPhone: '318-555-4411',
        guardianEmail: 'sandra.giraldo@padres.caldas.edu.co'
      },
      {
        id: 'est-11301',
        name: 'Ana María Santos Gómez',
        shortName: 'Ana Santos',
        code: '11301',
        grade: '11-3',
        shift: 'Tarde',
        avatar: '/src/assets/images/avatar_estudiante_maria_1794435251703.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Jaime Santos',
        guardianPhone: '317-555-1234',
        guardianEmail: 'jaime.santos@padres.caldas.edu.co'
      },
      {
        id: 'est-11302',
        name: 'Laura Sofía Jiménez Pérez',
        shortName: 'Laura Jiménez',
        code: '11302',
        grade: '11-3',
        shift: 'Tarde',
        avatar: '/src/assets/images/avatar_estudiante_maria_1794435251703.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Gloria Pérez',
        guardianPhone: '319-555-8822',
        guardianEmail: 'gloria.perez@padres.caldas.edu.co'
      },
      {
        id: 'est-11303',
        name: 'Mateo Alejandro Ruiz Díaz',
        shortName: 'Mateo Ruiz',
        code: '11303',
        grade: '11-3',
        shift: 'Tarde',
        avatar: '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Eduardo Ruiz',
        guardianPhone: '320-555-9933',
        guardianEmail: 'eduardo.ruiz@padres.caldas.edu.co'
      },
      {
        id: 'est-11401',
        name: 'Sara Valentina Vargas Nieto',
        shortName: 'Sara Vargas',
        code: '11401',
        grade: '11-4',
        shift: 'Tarde',
        avatar: '/src/assets/images/avatar_estudiante_maria_1794435251703.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Lorena Nieto',
        guardianPhone: '321-555-7744',
        guardianEmail: 'lorena.nieto@padres.caldas.edu.co'
      },
      {
        id: 'est-11402',
        name: 'Diego Fernando Gómez Hurtado',
        shortName: 'Diego Gómez',
        code: '11402',
        grade: '11-4',
        shift: 'Tarde',
        avatar: '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
        faltas: 0,
        compromisos: 0,
        coexistenceStatus: 'Bueno',
        points: 10,
        lastObservationDate: 'Sin registros',
        guardianName: 'Marta Hurtado',
        guardianPhone: '322-555-6655',
        guardianEmail: 'marta.hurtado@padres.caldas.edu.co'
      }
    ],
    // Directorio de funcionarios y docentes inscritos dinámicamente (inicia limpio)
    staff: [],
    // Comienza sin observaciones prehechas: se guardarán a medida que se registren
    observations: [],
    // Comienza sin compromisos prehechos
    commitments: [],
    // Comienza sin fichas de orientación prehechas
    orientationRecords: [],
    auditLogs: []
  };
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedData();
      saveStore(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Verificar que los grados estén actualizados a 11-1..11-4 y tenga arreglo staff
    if (!parsed.grades || !parsed.grades.includes('11-1') || !Array.isArray(parsed.staff)) {
      const initial = getInitialSeedData();
      saveStore(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Error cargando store:', err);
    return getInitialSeedData();
  }
}

export function registerStaffMember({ name, role, roleTitle, email, subject = '', shift = 'Mañana' }) {
  if (!name) return null;
  const existing = store.staff.find(s => s.name.toLowerCase() === name.toLowerCase() && s.role === role);
  if (existing) {
    existing.email = email || existing.email;
    existing.subject = subject || existing.subject;
    saveStore(store);
    return existing;
  }
  const newStaff = {
    id: `stf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    role: role,
    roleTitle: roleTitle || 'Funcionario Institucional',
    email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@caldas.edu.co`,
    subject: subject || (role === 'docente' ? 'Docente de Grado Once' : roleTitle),
    shift: shift,
    registeredAt: new Date().toLocaleDateString('es-CO')
  };
  store.staff.push(newStaff);
  saveStore(store);
  return newStaff;
}

export function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error guardando store:', err);
  }
}

export const store = loadStore();

// Función auxiliar para recalcular contadores de faltas y estado de un estudiante
export function updateStudentCounters(studentId) {
  const student = store.students.find(s => s.id === studentId);
  if (!student) return;

  const obs = store.observations.filter(o => o.studentId === studentId);
  const faltas = obs.filter(o => o.subtype === 'Negativa').length;
  const compromisos = store.commitments.filter(c => c.studentId === studentId && c.status === 'Activo').length;
  const meritos = obs.filter(o => o.subtype === 'Positiva').length;

  student.faltas = faltas;
  student.compromisos = compromisos;
  student.points = Math.max(1, 10 - (faltas * 2) + (meritos * 2));

  if (faltas >= 4) {
    student.coexistenceStatus = 'Aviso de Faltas';
  } else if (faltas >= 2) {
    student.coexistenceStatus = 'Reflexión Necesaria';
  } else {
    student.coexistenceStatus = 'Bueno';
  }

  if (obs.length > 0) {
    student.lastObservationDate = obs[0].date;
  } else {
    student.lastObservationDate = 'Sin registros';
  }

  saveStore(store);
}
