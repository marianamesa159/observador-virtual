/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo de Registro de Observaciones y Compromisos Formativos (Coordinación y Orientación Escolar)
 */

import { store, saveStore, updateStudentCounters } from './supabase.js';
import { authService, ROLES } from './auth.js';

let currentObsType = 'Convivencial'; // 'Convivencial' | 'Académica'
let currentSubtype = 'Negativa';     // 'Negativa' | 'Positiva'

export function showNewObservationModal(preselectedStudentId = null) {
  const currentUser = authService.getCurrentUser();
  const role = currentUser.role;

  // Solo Coordinador y Orientador Escolar tienen permiso de asentar observaciones disciplinarias
  if (![ROLES.COORDINADOR, ROLES.ORIENTADOR].includes(role)) {
    const modalOverlay = document.getElementById('global-modal-overlay');
    const modalContent = document.getElementById('global-modal-content');
    if (modalOverlay && modalContent) {
      modalContent.innerHTML = `
        <div class="modal-dialog" style="max-width: 480px; text-align: center;">
          <div class="modal-header">
            <h3 class="modal-title">Acceso Restringido: Permiso Disciplinario</h3>
            <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div style="font-size: 42px; margin-bottom: 12px;">🛡️</div>
            <h4 style="font-size: 16px; font-weight: 700; color: var(--primary-900); margin-bottom: 8px;">
              Permiso Reservado para Coordinación y Orientación
            </h4>
            <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
              En cumplimiento del Manual de Convivencia y el debido proceso escolar, el registro formal de faltas convivenciales y compromisos corresponde exclusivamente a <strong>Coordinación</strong> y <strong>Orientación Escolar</strong>. Tu rol actual (${currentUser.roleTitle}) tiene facultades de consulta y seguimiento.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button class="btn-secondary" onclick="window.closeGlobalModal()">Entendido</button>
              <button class="btn-primary" id="btn-quick-switch-coord">Ingresar como Coordinación</button>
            </div>
          </div>
        </div>
      `;
      modalOverlay.classList.add('active');
      const btnSwitch = modalContent.querySelector('#btn-quick-switch-coord');
      if (btnSwitch) {
        btnSwitch.addEventListener('click', () => {
          authService.login('coordinacion@caldas.edu.co', 'caldas2026', ROLES.COORDINADOR, 'Coordinación de Convivencia');
          window.closeGlobalModal();
          window.showToast('Sesión iniciada como Coordinación de Convivencia');
          setTimeout(() => showNewObservationModal(preselectedStudentId), 200);
        });
      }
    }
    return;
  }

  const students = store.students || [];
  if (students.length === 0) {
    alert('No hay estudiantes inscritos en el sistema.');
    return;
  }

  // Identificar estudiante y grado inicial
  let selectedStudent = preselectedStudentId ? students.find(s => s.id === preselectedStudentId) : null;
  if (!selectedStudent) {
    selectedStudent = students[0];
  }
  let activeModalGrade = selectedStudent.grade || '11-1';

  currentObsType = 'Convivencial';
  currentSubtype = 'Negativa';

  const modalOverlay = document.getElementById('global-modal-overlay');
  const modalContent = document.getElementById('global-modal-content');
  if (!modalOverlay || !modalContent) return;

  const renderStudentOptions = (grade) => {
    const gradeStudents = students.filter(s => s.grade === grade);
    if (gradeStudents.length === 0) {
      return `<option value="">Sin estudiantes en grado ${grade}</option>`;
    }
    return gradeStudents.map(s => `
      <option value="${s.id}" ${s.id === selectedStudent?.id ? 'selected' : ''}>
        ${s.name} (ID: ${s.code})
      </option>
    `).join('');
  };

  modalContent.innerHTML = `
    <div class="modal-dialog" style="max-width: 640px;">
      <div class="modal-header">
        <h3 class="modal-title">Registro de Falta Convivencial / Observación</h3>
        <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
      </div>

      <form id="form-new-observation">
        <div class="modal-body">
          <!-- 1. Selección Escalonada de Estudiante -->
          <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 12px; font-weight: 700;">1. Grado</label>
                <select class="form-select" id="obs-grade-select" style="font-weight: 600;">
                  <option value="11-1" ${activeModalGrade === '11-1' ? 'selected' : ''}>11-1</option>
                  <option value="11-2" ${activeModalGrade === '11-2' ? 'selected' : ''}>11-2</option>
                  <option value="11-3" ${activeModalGrade === '11-3' ? 'selected' : ''}>11-3</option>
                  <option value="11-4" ${activeModalGrade === '11-4' ? 'selected' : ''}>11-4</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 12px; font-weight: 700;">2. Estudiante</label>
                <select class="form-select" id="obs-student-select" required style="font-weight: 600;">
                  ${renderStudentOptions(activeModalGrade)}
                </select>
              </div>
            </div>
          </div>

          <!-- 2. Clasificación de la Observación -->
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="font-size: 12px; font-weight: 700;">Naturaleza de la Observación</label>
            <div class="type-toggle-group">
              <button type="button" class="type-toggle-btn active" id="btn-type-convivencial">FALTA CONVIVENCIAL</button>
              <button type="button" class="type-toggle-btn" id="btn-type-academica">OBSERVACIÓN ACADÉMICA</button>
            </div>
            <div style="display: flex; gap: 16px; margin-top: 8px;">
              <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 600;">
                <input type="radio" name="obs_polarity" value="Negativa" checked /> ⚠️ Falta / Llamado de Atención
              </label>
              <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="obs_polarity" value="Positiva" /> 🌟 Reconocimiento / Mérito
              </label>
            </div>
          </div>

          <!-- 3. Nivel según Manual de Convivencia -->
          <div class="form-group" id="group-situation-level" style="margin-bottom: 14px;">
            <label class="form-label" style="font-size: 12px; font-weight: 700;">Nivel de Situación (Manual de Convivencia Instituto de Caldas)</label>
            <select class="form-select" id="obs-situation-level">
              <option value="Tipo I">Situación Tipo I (Falta Leve / Diálogo formativo / Amonestación)</option>
              <option value="Tipo II">Situación Tipo II (Falta Grave / Afecta la convivencia escolar)</option>
              <option value="Tipo III">Situación Tipo III (Falta Gravísima / Remisión a Comité de Convivencia)</option>
            </select>
          </div>

          <!-- 4. Descripción de los Hechos -->
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="font-size: 12px; font-weight: 700;">Descripción detallada de los hechos u ocurrencia</label>
            <textarea 
              class="form-textarea" 
              id="obs-description" 
              rows="3"
              placeholder="Describa objetivamente los hechos sucedidos, fecha, lugar y circunstancias según el Manual de Convivencia..."
              required
            ></textarea>
          </div>

          <!-- 5. Medio de Corrección Pedagógica -->
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="font-size: 12px; font-weight: 700;">Medida formativa o acción pedagógica</label>
            <input 
              type="text" 
              class="form-input" 
              id="obs-correction" 
              placeholder="Diálogo reflexivo, llamado de atención formativo, citación..."
              value="Diálogo formativo, amonestación preventiva y notificación al acudiente"
              required 
            />
          </div>

          <!-- 6. Compromiso Disciplinario (Opcional) -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-sm); padding: 12px;">
            <label style="font-size: 13px; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="check-has-commitment" /> Pactar Acuerdo / Compromiso Disciplinario con el Estudiante
            </label>
            <div id="commitment-fields" style="display: none; margin-top: 10px;">
              <input 
                type="text" 
                class="form-input" 
                id="commitment-title" 
                placeholder="Acuerdo formativo específico asumido por el estudiante..." 
                style="margin-bottom: 8px;"
              />
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="font-size: 11.5px; color: var(--text-muted);">Fecha límite de cumplimiento:</span>
                <input 
                  type="date" 
                  class="form-input" 
                  id="commitment-due-date" 
                  value="2026-04-15" 
                  style="max-width: 170px;"
                />
              </div>
            </div>
          </div>

          <div style="font-size: 11px; color: var(--text-muted); background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid var(--border-subtle); line-height: 1.4; margin-top: 12px;">
            ℹ️ Funcionario que asienta el registro: <strong>${currentUser.fullName}</strong> (${currentUser.roleTitle}). El acudiente podrá consultar la anotación y firmar electrónicamente.
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="window.closeGlobalModal()">Cancelar</button>
          <button type="submit" class="btn-primary" style="background: var(--primary-900); padding: 10px 20px;">
            Guardar en Folio Digital
          </button>
        </div>
      </form>
    </div>
  `;

  modalOverlay.classList.add('active');

  // Cableado interactivo de eventos
  const form = document.getElementById('form-new-observation');
  const gradeSelect = document.getElementById('obs-grade-select');
  const studentSelect = document.getElementById('obs-student-select');
  const btnAcad = document.getElementById('btn-type-academica');
  const btnConv = document.getElementById('btn-type-convivencial');
  const checkCommitment = document.getElementById('check-has-commitment');
  const commitmentFields = document.getElementById('commitment-fields');

  // Al cambiar grado en el modal, actualizar opciones de alumnos
  gradeSelect.addEventListener('change', (e) => {
    activeModalGrade = e.target.value;
    studentSelect.innerHTML = renderStudentOptions(activeModalGrade);
  });

  // Alternar Convivencial vs Académica
  btnConv.addEventListener('click', () => {
    currentObsType = 'Convivencial';
    btnConv.classList.add('active');
    btnAcad.classList.remove('active');
    document.getElementById('group-situation-level').style.display = 'block';
  });

  btnAcad.addEventListener('click', () => {
    currentObsType = 'Académica';
    btnAcad.classList.add('active');
    btnConv.classList.remove('active');
    document.getElementById('group-situation-level').style.display = 'none';
  });

  // Radio de polaridad (Falta vs Reconocimiento)
  const radios = form.querySelectorAll('input[name="obs_polarity"]');
  radios.forEach(r => {
    r.addEventListener('change', (e) => {
      currentSubtype = e.target.value;
      if (currentSubtype === 'Positiva') {
        document.getElementById('group-situation-level').style.display = 'none';
      } else if (currentObsType === 'Convivencial') {
        document.getElementById('group-situation-level').style.display = 'block';
      }
    });
  });

  // Mostrar / Ocultar campos de compromiso
  checkCommitment.addEventListener('change', (e) => {
    commitmentFields.style.display = e.target.checked ? 'block' : 'none';
  });

  // Envío y Guardado Efectivo del Formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const targetStudentId = studentSelect.value;
    if (!targetStudentId) {
      alert('Por favor selecciona un estudiante válido de la lista.');
      return;
    }

    const student = store.students.find(s => s.id === targetStudentId);
    if (!student) {
      alert('Estudiante no encontrado en la base de datos institucional.');
      return;
    }

    const description = document.getElementById('obs-description').value.trim();
    if (!description) {
      alert('Por favor ingrese la descripción de los hechos.');
      return;
    }

    const correction = document.getElementById('obs-correction').value.trim();
    const situationLevelEl = document.getElementById('obs-situation-level');
    const severityVal = currentSubtype === 'Positiva' 
      ? 'Mérito' 
      : (situationLevelEl ? situationLevelEl.value : 'Tipo I');

    const now = new Date();
    const optionsDate = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('es-CO', optionsDate);
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const newObs = {
      id: `obs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: targetStudentId,
      type: currentObsType,
      subtype: currentSubtype,
      severity: severityVal,
      date: dateStr,
      timestamp: `${now.toLocaleDateString('es-CO')} ${timeStr}`,
      author: currentUser.fullName,
      authorRole: currentUser.roleTitle,
      description: description,
      correctiveMeasure: correction || 'Diálogo pedagógico y citación preventiva',
      status: 'Pendiente de Firma',
      hasSignature: false,
      signatureData: null
    };

    store.observations.unshift(newObs);

    // Si tiene compromiso disciplinario
    if (checkCommitment.checked) {
      const commitmentTitle = document.getElementById('commitment-title').value.trim();
      const dueDate = document.getElementById('commitment-due-date').value;
      if (commitmentTitle) {
        store.commitments.unshift({
          id: `com-${Date.now()}`,
          studentId: targetStudentId,
          title: commitmentTitle,
          teacher: currentUser.fullName,
          date: dateStr,
          dueDate: dueDate || '2026-04-15',
          status: 'Activo'
        });
      }
    }

    // Recalcular contadores del estudiante (faltas, puntos, semáforo)
    updateStudentCounters(targetStudentId);
    saveStore(store);

    // Log de auditoría
    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      user: currentUser.fullName,
      role: currentUser.roleTitle,
      action: 'NUEVA_OBSERVACIÓN',
      detail: `Registró falta ${currentObsType} (${severityVal}) para ${student.name} (${student.grade})`,
      timestamp: new Date().toISOString()
    });

    window.closeGlobalModal();
    window.showToast(`✓ Falta convivencial guardada exitosamente en el folio de ${student.name}`);

    // Re-renderizar la vista actual para actualizar tablas, tarjetas y semáforos
    if (window.renderCurrentView) {
      window.renderCurrentView();
    }
  });
}
