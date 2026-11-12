/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo de Visualización de Estudiantes, Folio Digital y Plantel Docente
 */

import { store, saveStore, registerStaffMember } from './supabase.js';
import { authService, ROLES } from './auth.js';

let activeGradeFilter = '11-1';
let currentSearchTerm = '';
let currentMainTab = 'students'; // 'students' | 'staff'

export function renderDocenteDashboard(container) {
  const currentUser = authService.getCurrentUser();
  // Solo Coordinador y Orientador Escolar tienen permiso de registro disciplinario
  const canCreateObs = [ROLES.COORDINADOR, ROLES.ORIENTADOR].includes(currentUser.role);
  const canRegisterPeople = [ROLES.COORDINADOR, ROLES.ADMINISTRADOR].includes(currentUser.role);

  const students = store.students || [];
  const staff = store.staff || [];

  // Vista de Plantel Docente y Funcionarios
  if (currentMainTab === 'staff') {
    renderStaffDirectoryView(container, currentUser, canRegisterPeople);
    return;
  }

  // Filtrar estudiantes por grado y término de búsqueda
  const filteredStudents = students.filter(student => {
    const matchesGrade = activeGradeFilter === 'TODOS' || student.grade === activeGradeFilter;
    const matchesSearch = !currentSearchTerm || 
      student.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      student.code.includes(currentSearchTerm) ||
      (student.shortName && student.shortName.toLowerCase().includes(currentSearchTerm.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  const activeStudents = activeGradeFilter === 'TODOS' ? students : students.filter(s => s.grade === activeGradeFilter);
  const activeStudentIds = new Set(activeStudents.map(s => s.id));

  const gradeObservations = (store.observations || []).filter(o => activeStudentIds.has(o.studentId));
  const gradeCommitments = (store.commitments || []).filter(c => activeStudentIds.has(c.studentId) && c.status === 'Activo');

  const faltasConv = gradeObservations.filter(o => o.type === 'Convivencial' && o.subtype === 'Negativa').length;
  const faltasAcad = gradeObservations.filter(o => o.type === 'Académica' && o.subtype === 'Negativa').length;
  const meritos = gradeObservations.filter(o => o.subtype === 'Positiva').length;

  const totalNegativas = (faltasConv + faltasAcad) || 0;
  const pctConv = totalNegativas > 0 ? Math.round((faltasConv / totalNegativas) * 100) : 50;
  const pctAcad = totalNegativas > 0 ? Math.round((faltasAcad / totalNegativas) * 100) : 50;

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Directorio Escolar: ${canCreateObs ? 'Panel de Coordinación y Orientación' : 'Panel de Consulta Docente'}</h1>
        <p class="page-subtitle">Instituto Universitario de Caldas — Grados 11-1, 11-2, 11-3 y 11-4 (Año 2026)</p>
      </div>

      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        ${canRegisterPeople ? `
          <button class="btn-secondary" id="btn-open-register-student">
            <span>+ Inscribir Estudiante</span>
          </button>
        ` : ''}

        ${canCreateObs ? `
          <button class="btn-primary" id="btn-open-new-obs" style="background: var(--primary-900);">
            <span>+ Nueva Observación</span>
          </button>
        ` : `
          <div style="font-size: 11.5px; color: var(--primary-800); background: var(--primary-50); padding: 7px 12px; border-radius: var(--radius-sm); border: 1px solid var(--primary-100); font-weight: 600;">
            Modo Consulta ${currentUser.roleTitle} (Registro disciplinario: Coordinación / Orientación)
          </div>
        `}
      </div>
    </div>

    <!-- Pestañas Principales: Estudiantes vs Plantel Docente -->
    <div style="display: flex; gap: 10px; margin-bottom: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
      <button class="btn-secondary ${currentMainTab === 'students' ? 'active' : ''}" id="tab-nav-students" style="font-weight: 700; ${currentMainTab === 'students' ? 'background: var(--primary-900); color: #fff;' : ''}">
        👥 Estudiantes de Grado Once (${students.length})
      </button>
      <button class="btn-secondary ${currentMainTab === 'staff' ? 'active' : ''}" id="tab-nav-staff" style="font-weight: 700; ${currentMainTab === 'staff' ? 'background: var(--primary-900); color: #fff;' : ''}">
        👨‍🏫 Plantel Docente y Funcionarios (${staff.length})
      </button>
    </div>

    <div class="docente-layout">
      <!-- Columna Principal: Buscador y Cuadrícula de Estudiantes -->
      <div>
        <div class="students-filter-bar">
          <div class="search-input-wrapper">
            <svg class="search-icon-inside" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              class="search-input-field" 
              id="student-search-input" 
              placeholder="Buscar estudiante por nombre, apellido o ID matrícula..." 
              value="${currentSearchTerm}"
            />
          </div>

          <div class="grade-tabs">
            <button class="grade-tab-btn ${activeGradeFilter === '11-1' ? 'active' : ''}" data-grade="11-1">Grado 11-1</button>
            <button class="grade-tab-btn ${activeGradeFilter === '11-2' ? 'active' : ''}" data-grade="11-2">Grado 11-2</button>
            <button class="grade-tab-btn ${activeGradeFilter === '11-3' ? 'active' : ''}" data-grade="11-3">Grado 11-3</button>
            <button class="grade-tab-btn ${activeGradeFilter === '11-4' ? 'active' : ''}" data-grade="11-4">Grado 11-4</button>
            <button class="grade-tab-btn ${activeGradeFilter === 'TODOS' ? 'active' : ''}" data-grade="TODOS">Todos (${students.length})</button>
          </div>
        </div>

        <div class="students-grid" id="students-grid-container">
          ${filteredStudents.map(student => `
            <div class="student-card" data-student-id="${student.id}">
              <img 
                src="${student.avatar}" 
                alt="${student.name}" 
                class="student-card-avatar"
                loading="lazy"
                onerror="this.src='/src/assets/images/avatar_estudiante_juan_1794435251279.jpg'"
              />
              <h3 class="student-card-name">${student.name}</h3>
              <div class="student-card-meta">Curso: <strong>${student.grade}</strong> (${student.shift}) · ID: ${student.code}</div>

              <div class="student-card-counters">
                <div class="counter-item">
                  <span class="counter-value faltas">${student.faltas || 0}</span>
                  <span class="counter-label">Faltas</span>
                </div>
                <div class="counter-item">
                  <span class="counter-value compromisos">${student.compromisos || 0}</span>
                  <span class="counter-label">Compromisos</span>
                </div>
              </div>

              <div class="student-card-footer">
                <span class="student-card-last-date">${student.lastObservationDate || 'Sin registros'}</span>
                <button class="btn-card-folio" onclick="window.openStudentFolio('${student.id}')">
                  Ver folio completo
                </button>
              </div>
            </div>
          `).join('')}

          ${filteredStudents.length === 0 ? `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); background: #ffffff; border-radius: var(--radius-md); border: 1px dashed #cbd5e1;">
              <p style="font-size: 15px; font-weight: 600; color: var(--primary-900);">No se encontraron estudiantes en ${activeGradeFilter}</p>
              ${canRegisterPeople ? `
                <p style="font-size: 13px; margin-top: 4px;">Puedes inscribir estudiantes a este grupo con el botón <strong>+ Inscribir Estudiante</strong>.</p>
              ` : `
                <p style="font-size: 13px; margin-top: 4px;">Sin alumnos matriculados para este curso.</p>
              `}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Columna Lateral: Resumen del Curso -->
      <aside class="course-summary-card">
        <h2 class="summary-title">Resumen: ${activeGradeFilter === 'TODOS' ? 'Todos los Grados' : 'Grado ' + activeGradeFilter}</h2>
        
        <ul class="summary-stat-list">
          <li class="summary-stat-item">
            <span>Estudiantes en lista</span>
            <span class="summary-stat-num">${activeStudents.length}</span>
          </li>
          <li class="summary-stat-item">
            <span>Observaciones registradas</span>
            <span class="summary-stat-num">${gradeObservations.length}</span>
          </li>
          <li class="summary-stat-item">
            <span>Reconocimientos / Méritos</span>
            <span class="summary-stat-num" style="color: var(--success-700);">${meritos}</span>
          </li>
          <li class="summary-stat-item">
            <span>Compromisos vigentes</span>
            <span class="summary-stat-num">${gradeCommitments.length}</span>
          </li>
        </ul>

        <div class="summary-progress-box">
          <div class="progress-header">
            <span>Faltas de Convivencia (${faltasConv})</span>
            <span style="color: var(--danger-700);">${totalNegativas > 0 ? pctConv + '%' : '0%'}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill red" style="width: ${totalNegativas > 0 ? pctConv : 0}%;"></div>
          </div>
        </div>

        <div class="summary-progress-box">
          <div class="progress-header">
            <span>Faltas Académicas (${faltasAcad})</span>
            <span style="color: var(--warning-700);">${totalNegativas > 0 ? pctAcad + '%' : '0%'}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill amber" style="width: ${totalNegativas > 0 ? pctAcad : 0}%;"></div>
          </div>
        </div>

        ${canCreateObs ? `
          <button class="btn-primary" style="width: 100%; justify-content: center; margin-top: 14px;" id="btn-quick-new-obs">
            + Nueva observación
          </button>
        ` : `
          <div style="font-size: 11.5px; color: var(--text-muted); text-align: center; margin-top: 14px; padding: 10px; background: #f8fafc; border-radius: 4px; border: 1px solid var(--border-subtle); line-height: 1.4;">
            🛡️ Observador Caldas: Los docentes y administradores tienen acceso de consulta. El registro disciplinario corresponde a Coordinación y Orientación.
          </div>
        `}
      </aside>
    </div>
  `;

  // Listeners
  const tabStudents = container.querySelector('#tab-nav-students');
  const tabStaff = container.querySelector('#tab-nav-staff');
  if (tabStudents) tabStudents.addEventListener('click', () => { currentMainTab = 'students'; renderDocenteDashboard(container); });
  if (tabStaff) tabStaff.addEventListener('click', () => { currentMainTab = 'staff'; renderDocenteDashboard(container); });

  const searchInput = container.querySelector('#student-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderDocenteDashboard(container);
    });
  }

  const tabButtons = container.querySelectorAll('.grade-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeGradeFilter = btn.getAttribute('data-grade');
      renderDocenteDashboard(container);
    });
  });

  if (canCreateObs) {
    const btnNewObs = container.querySelector('#btn-open-new-obs');
    const btnQuickObs = container.querySelector('#btn-quick-new-obs');
    if (btnNewObs) btnNewObs.addEventListener('click', () => window.openNewObservationModal());
    if (btnQuickObs) btnQuickObs.addEventListener('click', () => window.openNewObservationModal());
  }

  if (canRegisterPeople) {
    const btnRegisterStudent = container.querySelector('#btn-open-register-student');
    if (btnRegisterStudent) {
      btnRegisterStudent.addEventListener('click', () => showRegisterStudentModal());
    }
  }
}

// Vista de Directorio de Plantel Docente y Funcionarios Reales
function renderStaffDirectoryView(container, currentUser, canRegisterPeople) {
  const staff = store.staff || [];

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Directorio del Plantel Docente y Funcionarios</h1>
        <p class="page-subtitle">Personal institucional registrado — Instituto Universitario de Caldas (2026)</p>
      </div>

      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="btn-primary" id="btn-register-staff-modal">
          <span>+ Inscribir Funcionario / Docente</span>
        </button>
      </div>
    </div>

    <!-- Pestañas Principales -->
    <div style="display: flex; gap: 10px; margin-bottom: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
      <button class="btn-secondary" id="tab-nav-students-back" style="font-weight: 700;">
        👥 Estudiantes de Grado Once (${(store.students || []).length})
      </button>
      <button class="btn-secondary active" id="tab-nav-staff-active" style="font-weight: 700; background: var(--primary-900); color: #fff;">
        👨‍🏫 Plantel Docente y Funcionarios (${staff.length})
      </button>
    </div>

    <div style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 15px; font-weight: 800; color: var(--primary-900);">
          Personal Institucional Registrado (${staff.length})
        </h3>
        <span style="font-size: 12px; color: var(--text-muted);">
          Los funcionarios se agregan automáticamente al iniciar sesión o mediante registro manual.
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px;">
        ${staff.map(person => `
          <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px; background: #f8fafc; display: flex; gap: 12px; align-items: center;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-100); color: var(--primary-800); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px;">
              ${person.name.charAt(0).toUpperCase()}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 700; font-size: 14.5px; color: var(--primary-900);">${person.name}</div>
              <div style="font-size: 12px; font-weight: 600; color: var(--primary-700);">${person.roleTitle}</div>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                ${person.subject || 'Docente'} · Jornada ${person.shift || 'Mañana'}
              </div>
              <div style="font-size: 11px; color: var(--text-light); font-family: var(--font-mono); margin-top: 2px;">
                ${person.email}
              </div>
            </div>
          </div>
        `).join('')}

        ${staff.length === 0 ? `
          <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); background: #ffffff; border-radius: var(--radius-sm); border: 1px dashed #cbd5e1;">
            <div style="font-size: 36px; margin-bottom: 8px;">👨‍🏫</div>
            <div style="font-size: 15px; font-weight: 700; color: var(--primary-900); margin-bottom: 4px;">
              Aún no hay profesores ni directivos registrados en el directorio
            </div>
            <p style="font-size: 13px; max-width: 440px; margin: 0 auto 16px;">
              Los docentes y funcionarios se agendan automáticamente aquí cuando inician sesión en la plataforma, o puedes inscribirlos con el botón inferior.
            </p>
            <button class="btn-primary" id="btn-empty-register-staff" style="margin: 0 auto;">
              + Inscribir Primer Funcionario / Docente
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const tabBack = container.querySelector('#tab-nav-students-back');
  if (tabBack) tabBack.addEventListener('click', () => { currentMainTab = 'students'; renderDocenteDashboard(container); });

  const btnStaffModal = container.querySelector('#btn-register-staff-modal');
  const btnEmptyStaff = container.querySelector('#btn-empty-register-staff');
  if (btnStaffModal) btnStaffModal.addEventListener('click', () => showRegisterStaffModal());
  if (btnEmptyStaff) btnEmptyStaff.addEventListener('click', () => showRegisterStaffModal());
}

// Modal para registrar Docentes o Funcionarios Reales
export function showRegisterStaffModal() {
  const modalOverlay = document.getElementById('global-modal-overlay');
  const modalContent = document.getElementById('global-modal-content');
  if (!modalOverlay || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Inscribir Funcionario / Docente</h3>
        <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
      </div>

      <form id="form-register-staff">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre y Apellidos</label>
            <input 
              type="text" 
              class="form-input" 
              id="staff-name" 
              placeholder="Ej: Martha Patricia Ospina" 
              required 
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Rol Institucional</label>
              <select class="form-select" id="staff-role" required>
                <option value="docente">Docente</option>
                <option value="coordinador">Coordinador(a)</option>
                <option value="orientador">Orientador(a) Escolar</option>
                <option value="rector">Rectoría</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Jornada</label>
              <select class="form-select" id="staff-shift">
                <option value="Mañana">Jornada Mañana</option>
                <option value="Tarde">Jornada Tarde</option>
                <option value="Completa">Jornada Completa</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Área / Asignatura / Dependencia</label>
            <input 
              type="text" 
              class="form-input" 
              id="staff-subject" 
              placeholder="Ej: Matemáticas y Cálculo Grado Once, Ciencias Naturales, etc." 
              value="Docente de Grado Once" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Correo Institucional</label>
            <input 
              type="email" 
              class="form-input" 
              id="staff-email" 
              placeholder="Ej: m.ospina@caldas.edu.co" 
            />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="window.closeGlobalModal()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar en Plantel Docente</button>
        </div>
      </form>
    </div>
  `;

  modalOverlay.classList.add('active');

  const form = document.getElementById('form-register-staff');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('staff-name').value.trim();
    const role = document.getElementById('staff-role').value;
    const shift = document.getElementById('staff-shift').value;
    const subject = document.getElementById('staff-subject').value.trim();
    const email = document.getElementById('staff-email').value.trim();

    const titles = {
      docente: 'Docente de Grado Once',
      coordinador: 'Coordinador Académico y Convivencia',
      orientador: 'Orientador Escolar y Psicosocial',
      rector: 'Rectoría Institucional'
    };

    registerStaffMember({
      name: name,
      role: role,
      roleTitle: titles[role] || 'Docente',
      email: email,
      subject: subject,
      shift: shift
    });

    window.closeGlobalModal();
    window.showToast(`✓ Funcionario ${name} registrado con éxito en el directorio.`);
    const viewport = document.getElementById('app-viewport');
    if (viewport) renderDocenteDashboard(viewport);
  });
}

// Modal para registrar nuevos estudiantes dinámicamente
export function showRegisterStudentModal() {
  const currentUser = authService.getCurrentUser();
  if (![ROLES.COORDINADOR, ROLES.ADMINISTRADOR].includes(currentUser.role)) {
    alert('Acceso restringido: Solo Coordinación y Administración pueden inscribir estudiantes.');
    return;
  }

  const modalOverlay = document.getElementById('global-modal-overlay');
  const modalContent = document.getElementById('global-modal-content');
  if (!modalOverlay || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Inscribir Nuevo Estudiante (Grado Once 2026)</h3>
        <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
      </div>

      <form id="form-register-student">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre Completo del Estudiante</label>
            <input 
              type="text" 
              class="form-input" 
              id="new-student-name" 
              placeholder="Ej: Sofía Cárdenas Ramírez" 
              required 
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Grado Escolar</label>
              <select class="form-select" id="new-student-grade" required>
                <option value="11-1" ${activeGradeFilter === '11-1' ? 'selected' : ''}>11-1</option>
                <option value="11-2" ${activeGradeFilter === '11-2' ? 'selected' : ''}>11-2</option>
                <option value="11-3" ${activeGradeFilter === '11-3' ? 'selected' : ''}>11-3</option>
                <option value="11-4" ${activeGradeFilter === '11-4' ? 'selected' : ''}>11-4</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Jornada</label>
              <select class="form-select" id="new-student-shift">
                <option value="Mañana">Jornada Mañana</option>
                <option value="Tarde">Jornada Tarde</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Código / Matrícula</label>
              <input 
                type="text" 
                class="form-input" 
                id="new-student-code" 
                placeholder="Ej: 11501" 
                value="${Math.floor(11100 + Math.random() * 400)}"
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Nombre del Acudiente</label>
              <input 
                type="text" 
                class="form-input" 
                id="new-student-guardian" 
                placeholder="Ej: Lucía Ramírez (Madre)" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono de Contacto del Acudiente</label>
            <input 
              type="tel" 
              class="form-input" 
              id="new-student-phone" 
              placeholder="Ej: 310-555-1234" 
              value="310-555-0100" 
            />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="window.closeGlobalModal()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar Estudiante</button>
        </div>
      </form>
    </div>
  `;

  modalOverlay.classList.add('active');

  const form = document.getElementById('form-register-student');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-student-name').value.trim();
    const grade = document.getElementById('new-student-grade').value;
    const shift = document.getElementById('new-student-shift').value;
    const code = document.getElementById('new-student-code').value.trim();
    const guardian = document.getElementById('new-student-guardian').value.trim();
    const phone = document.getElementById('new-student-phone').value.trim();

    const avatars = [
      '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
      '/src/assets/images/avatar_estudiante_maria_1794435251703.jpg'
    ];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newStudent = {
      id: `est-${Date.now()}`,
      name: name,
      shortName: name.split(' ').slice(0, 2).join(' '),
      code: code,
      grade: grade,
      shift: shift,
      avatar: avatar,
      faltas: 0,
      compromisos: 0,
      coexistenceStatus: 'Bueno',
      points: 10,
      lastObservationDate: 'Sin registros',
      guardianName: guardian,
      guardianPhone: phone,
      guardianEmail: `${name.toLowerCase().replace(/\s+/g, '.')}.padres@caldas.edu.co`
    };

    store.students.push(newStudent);
    saveStore(store);
    window.closeGlobalModal();
    window.showToast(`Estudiante ${name} inscrito exitosamente en ${grade}`);

    activeGradeFilter = grade;
    const viewport = document.getElementById('app-viewport');
    if (viewport) renderDocenteDashboard(viewport);
  });
}

// Modal de Folio Completo
export function showFolioModal(studentId) {
  const currentUser = authService.getCurrentUser();
  const canCreateObs = [ROLES.COORDINADOR, ROLES.ORIENTADOR].includes(currentUser.role);
  const student = (store.students || []).find(s => s.id === studentId);
  if (!student) return;

  const observations = (store.observations || []).filter(o => o.studentId === studentId);
  const commitments = (store.commitments || []).filter(c => c.studentId === studentId);

  const modalOverlay = document.getElementById('global-modal-overlay');
  const modalContent = document.getElementById('global-modal-content');
  if (!modalOverlay || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-dialog" style="max-width: 800px;">
      <div class="modal-header">
        <h3 class="modal-title">Folio Digital: ${student.name} (Grado ${student.grade})</h3>
        <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
      </div>

      <div class="modal-body">
        <!-- Ficha de Encabezado -->
        <div style="display: flex; gap: 16px; background: #f8fafc; padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); align-items: center;">
          <img src="${student.avatar}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
          <div style="flex: 1;">
            <div style="font-size: 18px; font-weight: 800; color: var(--primary-900);">${student.name}</div>
            <div style="font-size: 13px; color: var(--text-muted); font-family: var(--font-mono);">
              Grado: <strong>${student.grade}</strong> (${student.shift}) · Matrícula: ${student.code} · Estado: ${student.coexistenceStatus}
            </div>
            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">
              Acudiente: <strong>${student.guardianName}</strong> · Tel: ${student.guardianPhone} · Puntos: <strong>${student.points} pts</strong>
            </div>
          </div>
          <button class="btn-secondary" onclick="window.print()" style="font-size: 12px; padding: 8px 12px;">
            🖨️ Imprimir Folio
          </button>
        </div>

        <!-- Observaciones Registradas -->
        <div>
          <h4 style="font-size: 14px; font-weight: 700; color: var(--primary-900); text-transform: uppercase; margin: 18px 0 10px; display: flex; justify-content: space-between;">
            <span>Historial de Observaciones (${observations.length})</span>
            <span style="font-size: 12px; color: var(--text-muted); font-weight: normal; text-transform: none;">Orden cronológico</span>
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${observations.map(obs => `
              <div style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; border-left: 4px solid ${obs.subtype === 'Positiva' ? 'var(--success-600)' : 'var(--danger-700)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                  <span style="font-weight: 700; font-size: 13px; font-family: var(--font-mono); color: var(--primary-900);">
                    ${obs.timestamp || obs.date} · <span style="color: ${obs.subtype === 'Positiva' ? 'var(--success-700)' : 'var(--danger-700)'};">${obs.type} (${obs.subtype})</span>
                  </span>
                  <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: ${obs.hasSignature ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
                    ${obs.hasSignature ? '✓ Firmado por Acudiente' : '⏳ Pendiente de Firma'}
                  </span>
                </div>
                <p style="font-size: 13.5px; color: var(--text-main); margin-bottom: 8px; line-height: 1.5;">${obs.description}</p>
                <div style="font-size: 12px; color: var(--text-muted); background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                  <strong>Acción Pedagógica / Corrección:</strong> ${obs.correctiveMeasure || 'Diálogo pedagógico'}
                </div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 8px; text-align: right;">
                  Registrado por: <strong>${obs.author}</strong> (${obs.authorRole})
                </div>
                ${obs.hasSignature && obs.signatureData ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 11px; color: var(--text-muted);">Firma asentada:</span>
                    <img src="${obs.signatureData}" style="max-height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;" />
                  </div>
                ` : ''}
              </div>
            `).join('')}

            ${observations.length === 0 ? `
              <div style="padding: 24px; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: var(--radius-sm); border: 1px dashed #cbd5e1;">
                El estudiante no cuenta con anotaciones disciplinarias registradas. Folio limpio.
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Compromisos Vigentes -->
        <div>
          <h4 style="font-size: 14px; font-weight: 700; color: var(--primary-900); text-transform: uppercase; margin: 18px 0 10px;">
            Compromisos Formativos Vigentes (${commitments.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${commitments.map(c => `
              <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: var(--radius-sm); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: #92400e;">${c.title}</div>
                  <div style="font-size: 11.5px; color: #b45309;">Docente/Coord: ${c.teacher} · Límite: ${c.dueDate}</div>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">
                  ${c.status}
                </span>
              </div>
            `).join('')}

            ${commitments.length === 0 ? `
              <div style="padding: 14px; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: var(--radius-sm); font-size: 12.5px;">
                Sin compromisos disciplinarios pendientes.
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick="window.closeGlobalModal()">Cerrar</button>
        ${canCreateObs ? `
          <button class="btn-primary" onclick="window.closeGlobalModal(); window.openNewObservationModal('${student.id}')">
            + Agregar Observación a este Alumno
          </button>
        ` : ''}
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');
}
