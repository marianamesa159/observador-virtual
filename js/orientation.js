/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo de Orientación Escolar y Expediente Psicosocial Confidencial (Estado Limpio Inicial)
 */

import { store, saveStore } from './supabase.js';
import { authService, ROLES } from './auth.js';

let selectedOrientationIndex = 0;

export function renderOrientationModule(container) {
  const currentUser = authService.getCurrentUser();
  const records = store.orientationRecords || [];
  // Solo Orientación y Coordinación tienen permiso de aperturar remisiones
  const canManageCases = [ROLES.ORIENTADOR, ROLES.COORDINADOR].includes(currentUser.role);

  // Si no hay registros en orientación, mostrar pantalla limpia institucional
  if (records.length === 0) {
    container.innerHTML = `
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Observador Digital: Ficha de Orientación Escolar</h1>
          <p class="page-subtitle">Acompañamiento psicosocial y formativo — Ley 1581 de 2012</p>
        </div>
        ${canManageCases ? `
          <button class="btn-primary" id="btn-new-orientation-case">
            + Aperturar Caso / Nueva Remisión
          </button>
        ` : ''}
      </div>

      <div class="orientation-card-box">
        <!-- Aviso de Confidencialidad y Ley 1581 (Boceto Figura 7) -->
        <div class="confidential-seal-banner">
          <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>
            <strong>EXPEDIENTE CONFIDENCIAL PROTEGIDO:</strong> En cumplimiento con la Ley 1581 de 2012 de Protección de Datos Personales de Menores, esta información es de acceso reservado exclusivo para Orientación Escolar, Coordinación y Rectoría.
          </span>
        </div>

        <div style="text-align: center; padding: 50px 20px; background: #ffffff; border-radius: var(--radius-md); border: 1px dashed #cbd5e1; margin-top: 16px;">
          <div style="font-size: 52px; margin-bottom: 14px;">🧠</div>
          <h2 style="font-size: 19px; font-weight: 800; color: var(--primary-900); margin-bottom: 8px;">
            Sin Casos Psicosociales ni Remisiones Activas
          </h2>
          <p style="font-size: 13.5px; color: var(--text-muted); max-width: 520px; margin: 0 auto 20px; line-height: 1.5;">
            Actualmente ningún estudiante cuenta con expediente abierto en Orientación Escolar. Cuando Coordinación u Orientación aperturen un caso de acompañamiento formativo, se desplegará aquí con su respectivo plan de apoyo, compromisos y trazabilidad.
          </p>
          ${canManageCases ? `
            <button class="btn-primary" id="btn-empty-new-case" style="margin: 0 auto; padding: 12px 24px;">
              + Registrar Primera Remisión a Orientación
            </button>
          ` : ''}
        </div>
      </div>
    `;

    const btnNew = container.querySelector('#btn-new-orientation-case');
    const btnEmpty = container.querySelector('#btn-empty-new-case');
    if (btnNew) btnNew.addEventListener('click', openNewOrientationModal);
    if (btnEmpty) btnEmpty.addEventListener('click', openNewOrientationModal);
    return;
  }

  // Si hay registros, mostrar el registro seleccionado
  const currentRecord = records[selectedOrientationIndex] || records[0];

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Observador Digital: Ficha de Orientación Escolar</h1>
        <p class="page-subtitle">Acompañamiento psicológico y pedagógico institucional — Carácter Confidencial</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-secondary" onclick="window.print()">
          🖨️ Imprimir Ficha
        </button>
        ${canManageCases ? `
          <button class="btn-primary" id="btn-new-orientation-case">
            + Nueva Remisión
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Si hay múltiples casos, selector de caso -->
    ${records.length > 1 ? `
      <div style="background: #ffffff; padding: 12px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
        <label style="font-size: 12.5px; font-weight: 700; color: var(--primary-900);">Casos en seguimiento:</label>
        <select class="form-select" id="select-active-case" style="max-width: 380px;">
          ${records.map((r, i) => `
            <option value="${i}" ${i === selectedOrientationIndex ? 'selected' : ''}>
              ${r.studentName} (${r.grade}) · Fecha: ${r.date}
            </option>
          `).join('')}
        </select>
      </div>
    ` : ''}

    <div class="orientation-card-box">
      <!-- Aviso de Confidencialidad y Ley 1581 (Boceto Figura 7) -->
      <div class="confidential-seal-banner">
        <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>
          <strong>EXPEDIENTE CONFIDENCIAL PROTEGIDO:</strong> En cumplimiento con la Ley 1581 de 2012 de Protección de Datos Personales de Menores, esta información es de acceso reservado exclusivo para Orientación Escolar, Coordinación y Rectoría.
        </span>
      </div>

      <!-- Datos del Estudiante Remitido -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 800; color: var(--primary-900);">${currentRecord.studentName}</h2>
        <div style="font-size: 13px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
          Curso: <strong>${currentRecord.grade}</strong> · Estado: En Acompañamiento Activo · Fecha: ${currentRecord.date}
        </div>
      </div>

      <!-- 1. Motivo de la Remisión -->
      <div class="field-group-box">
        <div class="field-group-title">
          <span>MOTIVO DE LA REMISIÓN</span>
          <span style="font-size: 11px; color: var(--text-muted);">${currentRecord.referralSource}</span>
        </div>
        <p style="font-size: 13.5px; color: var(--text-main); line-height: 1.5;">
          ${currentRecord.reason}
        </p>
      </div>

      <!-- 2. Plan de Acompañamiento -->
      <div class="field-group-box">
        <div class="field-group-title">
          <span>PLAN DE ACOMPAÑAMIENTO (Psicológico / Pedagógico)</span>
          <span style="font-size: 11px; color: var(--primary-600); font-weight: 600;">Estrategia Semanal</span>
        </div>
        <p style="font-size: 13.5px; color: var(--text-main); line-height: 1.5;">
          ${currentRecord.supportPlan}
        </p>
      </div>

      <!-- 3. Compromisos Mutuos -->
      <div class="field-group-box">
        <div class="field-group-title">
          <span>COMPROMISOS MUTUOS</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 8px;">
          <div style="background: #ffffff; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="font-size: 12px; font-weight: 700; color: var(--primary-900); margin-bottom: 6px;">
              👤 Estudiante:
            </div>
            <p style="font-size: 12.5px; color: var(--text-main); white-space: pre-line;">
              ${currentRecord.studentCommitment}
            </p>
          </div>

          <div style="background: #ffffff; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="font-size: 12px; font-weight: 700; color: var(--primary-900); margin-bottom: 6px;">
              👨‍🏫 Docente / Orientación:
            </div>
            <p style="font-size: 12.5px; color: var(--text-main); white-space: pre-line;">
              ${currentRecord.teacherCommitment}
            </p>
          </div>
        </div>
      </div>

      <!-- 4. Firma del Orientador Escolar -->
      <div class="field-group-box">
        <div class="field-group-title">
          <span>FIRMA DEL ORIENTADOR ESCOLAR (Firma Virtual)</span>
          <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
            Fecha y hora automáticas: ${currentRecord.date}
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 12px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-top: 6px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">✍️</span>
            <div>
              <div style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 18px; color: var(--primary-900); font-weight: 700;">
                ${currentRecord.counselorName || 'Orientación Escolar y Psicosocial'}
              </div>
              <div style="font-size: 11px; color: var(--text-light);">Registro Profesional Psicología y Orientación Escolar</div>
            </div>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: var(--success-700); background: #dcfce7; padding: 3px 8px; border-radius: 4px;">
            ✓ Expediente Verificado
          </span>
        </div>
      </div>
    </div>
  `;

  const btnNewCase = container.querySelector('#btn-new-orientation-case');
  if (btnNewCase) {
    btnNewCase.addEventListener('click', openNewOrientationModal);
  }

  const selectCase = container.querySelector('#select-active-case');
  if (selectCase) {
    selectCase.addEventListener('change', (e) => {
      selectedOrientationIndex = parseInt(e.target.value, 10);
      renderOrientationModule(container);
    });
  }
}

export function openNewOrientationModal() {
  const currentUser = authService.getCurrentUser();
  if (![ROLES.ORIENTADOR, ROLES.COORDINADOR].includes(currentUser.role)) {
    alert('Acceso restringido: Solo Coordinación y Orientación Escolar pueden aperturar remisiones.');
    return;
  }

  const modalOverlay = document.getElementById('global-modal-overlay');
  const modalContent = document.getElementById('global-modal-content');
  if (!modalOverlay || !modalContent) return;

  const students = store.students || [];
  let modalGrade = '11-1';

  const renderOptions = (gr) => {
    const list = students.filter(s => s.grade === gr);
    if (list.length === 0) return `<option value="">Sin alumnos en ${gr}</option>`;
    return list.map(s => `<option value="${s.id}">${s.name} (ID: ${s.code})</option>`).join('');
  };

  modalContent.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Aperturar Remisión a Orientación Escolar</h3>
        <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
      </div>

      <form id="form-orientation">
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Grado</label>
              <select class="form-select" id="ori-grade-filter">
                <option value="11-1">11-1</option>
                <option value="11-2">11-2</option>
                <option value="11-3">11-3</option>
                <option value="11-4">11-4</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Estudiante</label>
              <select class="form-select" id="ori-student-id" required>
                ${renderOptions('11-1')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Motivo de la Remisión</label>
            <textarea class="form-textarea" id="ori-reason" placeholder="Describa el motivo pedagógico, socioemocional o conductual..." required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Plan de Acompañamiento Propuesto</label>
            <textarea class="form-textarea" id="ori-plan" placeholder="Estrategias psicosociales, sesiones y acuerdos..." required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Compromiso del Estudiante</label>
            <input type="text" class="form-input" id="ori-student-commit" placeholder="Compromiso asumido por el estudiante..." value="Asistir puntualmente a las sesiones y participar activamente" required />
          </div>

          <div class="form-group">
            <label class="form-label">Compromiso Docente / Orientación</label>
            <input type="text" class="form-input" id="ori-teacher-commit" placeholder="Compromiso de acompañamiento institucional..." value="Brindar seguimiento socioemocional y coordinar con acudiente" required />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="window.closeGlobalModal()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar Caso en Expediente</button>
        </div>
      </form>
    </div>
  `;

  modalOverlay.classList.add('active');

  const gradeFilter = document.getElementById('ori-grade-filter');
  const studentSelect = document.getElementById('ori-student-id');
  gradeFilter.addEventListener('change', (e) => {
    modalGrade = e.target.value;
    studentSelect.innerHTML = renderOptions(modalGrade);
  });

  const form = document.getElementById('form-orientation');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = studentSelect.value;
    const student = store.students.find(s => s.id === studentId);
    if (!student) {
      alert('Por favor selecciona un estudiante válido.');
      return;
    }

    const reason = document.getElementById('ori-reason').value;
    const plan = document.getElementById('ori-plan').value;
    const stCommit = document.getElementById('ori-student-commit').value;
    const tcCommit = document.getElementById('ori-teacher-commit').value;
    const currentUser = authService.getCurrentUser();

    store.orientationRecords.unshift({
      id: `ori-${Date.now()}`,
      studentId: studentId,
      studentName: student.name,
      grade: student.grade,
      counselorName: currentUser.fullName,
      referralSource: `Remitido por ${currentUser.fullName} (${currentUser.roleTitle})`,
      reason: reason,
      supportPlan: plan,
      studentCommitment: stCommit,
      teacherCommitment: tcCommit,
      isSigned: true,
      date: new Date().toLocaleDateString('es-CO')
    });

    saveStore(store);
    window.closeGlobalModal();
    window.showToast(`✓ Caso de ${student.name} guardado en el expediente confidencial.`);
    window.renderCurrentView();
  });
}
