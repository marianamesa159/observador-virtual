/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo del Panel del Estudiante (Consulta Privada Escalonada: Grado -> Estudiante + Semáforo)
 */

import { store, saveStore } from './supabase.js';
import { authService } from './auth.js';

let selectedStudentIdForPortal = null;
let selectedGradeForStudentPortal = '11-1';

export function renderStudentPortal(container) {
  const currentUser = authService.getCurrentUser();
  const students = store.students || [];

  // Si el usuario autenticado es un estudiante identificado en el login, vincular automáticamente su expediente
  if (!selectedStudentIdForPortal && currentUser && currentUser.studentId) {
    selectedStudentIdForPortal = currentUser.studentId;
    if (currentUser.studentGrade) {
      selectedGradeForStudentPortal = currentUser.studentGrade;
    }
  }

  // Vista 1: Si aún no se ha seleccionado estudiante, mostrar formulario escalonado de 2 pasos
  if (!selectedStudentIdForPortal) {
    const gradeStudents = students.filter(s => s.grade === selectedGradeForStudentPortal);

    container.innerHTML = `
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Mi Estado de Convivencia Escolar</h1>
          <p class="page-subtitle">Portal Estudiantil — Instituto Universitario de Caldas (Año 2026)</p>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: var(--primary-700); background: var(--primary-50); padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--primary-100);">
          Usuario: <strong>${currentUser.fullName}</strong>
        </div>
      </div>

      <div style="max-width: 620px; margin: 30px auto; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-sm);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🎒</div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--primary-900);">
            Consulta de Folio Estudiantil
          </h2>
          <p style="font-size: 13.5px; color: var(--text-muted); margin-top: 6px; line-height: 1.5;">
            Por confidencialidad de la información y privacidad escolar (Ley 1581 de 2012), indica tu grado y tu nombre para desplegar tu expediente individual.
          </p>
        </div>

        <form id="form-student-lookup">
          <!-- Paso 1: Seleccionar Grado -->
          <div class="form-group" style="margin-bottom: 18px;">
            <label class="form-label" style="font-size: 13px; font-weight: 700; color: var(--primary-900);">
              PASO 1: SELECCIONA TU GRADO ESCOLAR:
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${['11-1', '11-2', '11-3', '11-4'].map(gr => `
                <button 
                  type="button" 
                  class="btn-secondary student-grade-pill ${selectedGradeForStudentPortal === gr ? 'active' : ''}" 
                  data-grade="${gr}"
                  style="padding: 10px 0; text-align: center; font-weight: 700; font-size: 14px; ${selectedGradeForStudentPortal === gr ? 'background: var(--primary-900); color: #fff; border-color: var(--primary-900);' : ''}"
                >
                  ${gr}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Paso 2: Seleccionar Estudiante -->
          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label" style="font-size: 13px; font-weight: 700; color: var(--primary-900);">
              PASO 2: SELECCIONA TU NOMBRE EN LA LISTA:
            </label>
            <select class="form-select" id="student-name-dropdown" style="font-size: 14px; padding: 12px; font-weight: 600;" required>
              <option value="">-- Seleccionar estudiante de ${selectedGradeForStudentPortal} --</option>
              ${gradeStudents.map(s => `
                <option value="${s.id}">${s.name} (ID: ${s.code})</option>
              `).join('')}
            </select>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px;">
              Alumnos matriculados en ${selectedGradeForStudentPortal}: ${gradeStudents.length}
            </div>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-size: 14px; font-weight: 700;">
            INGRESAR A MI OBSERVADOR ESTUDIANTIL
          </button>
        </form>

        <div style="margin-top: 20px; font-size: 11px; color: var(--text-muted); text-align: center; line-height: 1.4; border-top: 1px dashed #e2e8f0; padding-top: 14px;">
          🛡️ Conforme a los lineamientos del Manual de Convivencia y la Ley 1581 de 2012 de Protección de Datos de Menores.
        </div>
      </div>
    `;

    // Listeners para cambiar grado en el selector
    const gradePills = container.querySelectorAll('.student-grade-pill');
    gradePills.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedGradeForStudentPortal = btn.getAttribute('data-grade');
        renderStudentPortal(container);
      });
    });

    const formLookup = container.querySelector('#form-student-lookup');
    formLookup.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = container.querySelector('#student-name-dropdown').value;
      if (!studentId) {
        alert('Por favor selecciona tu nombre en la lista para ingresar.');
        return;
      }
      selectedStudentIdForPortal = studentId;
      renderStudentPortal(container);
    });

    return;
  }

  // Vista 2: Expediente y semáforo del estudiante seleccionado
  const student = students.find(s => s.id === selectedStudentIdForPortal);
  if (!student) {
    selectedStudentIdForPortal = null;
    renderStudentPortal(container);
    return;
  }

  const studentObservations = (store.observations || []).filter(o => o.studentId === student.id);
  const commitments = (store.commitments || []).filter(c => c.studentId === student.id);

  // Semáforo de convivencia
  let levelColor = '#15803d'; // Verde (Bueno)
  let strokeDash = '180, 200';
  let levelLabel = 'Excelente / Bueno';

  if (student.coexistenceStatus === 'Reflexión Necesaria' || student.faltas >= 2) {
    levelColor = '#d97706'; // Ámbar
    strokeDash = '120, 200';
    levelLabel = 'Reflexión Necesaria';
  } else if (student.coexistenceStatus === 'Aviso de Faltas' || student.faltas >= 4) {
    levelColor = '#b91c1c'; // Rojo
    strokeDash = '60, 200';
    levelLabel = 'Aviso de Faltas';
  }

  container.innerHTML = `
    <div class="page-header-row" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <h1 class="page-title">Mi Estado de Convivencia Escolar</h1>
        <p class="page-subtitle">Expediente de ${student.name} — Grado ${student.grade} (${student.shift})</p>
      </div>

      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="btn-secondary" id="btn-change-student-view" style="font-size: 12px; padding: 8px 14px;">
          🔄 Consultar otro estudiante
        </button>
        <button class="btn-secondary" onclick="window.print()" style="font-size: 12px; padding: 8px 14px;">
          🖨️ Copia de Lectura
        </button>
      </div>
    </div>

    <div class="student-portal-wrapper">
      <!-- Tacómetro / Semáforo de Convivencia (Boceto Figura 6) -->
      <div class="traffic-gauge-card">
        <div class="gauge-header-label">Estado de Convivencia Actual</div>

        <div class="gauge-circular-container">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" stroke-width="8" />
            <circle 
              cx="50" 
              cy="50" 
              r="42" 
              fill="none" 
              stroke="${levelColor}" 
              stroke-width="8" 
              stroke-dasharray="${strokeDash}"
              stroke-linecap="round"
            />
          </svg>

          <div class="gauge-inner-content">
            <img 
              src="${student.avatar}" 
              alt="${student.name}" 
              class="gauge-avatar"
              onerror="this.src='/src/assets/images/avatar_estudiante_juan_1794435251279.jpg'"
            />
            <div class="gauge-level-text" style="color: ${levelColor}; font-weight: 800;">
              ${levelLabel}
            </div>
          </div>
        </div>

        <div class="gauge-student-name">${student.name}</div>
        <div style="font-size: 13px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
          Curso: <strong>${student.grade}</strong> (${student.shift}) · Matrícula ID: ${student.code}
        </div>

        <div class="gauge-points-chip">
          ⭐ ${student.points} PUNTOS DE RECOMPENSA FORMATIVA
        </div>

        <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
          Faltas acumuladas: <strong>${student.faltas || 0}</strong> · Reconocimientos: <strong>${studentObservations.filter(o => o.subtype === 'Positiva').length}</strong>
        </div>
      </div>

      <!-- Compromisos Activos y Anotaciones -->
      <div class="commitments-card">
        <div class="commitments-header">
          Compromisos Disciplinarios y Formativos (${commitments.length})
        </div>

        <div>
          ${commitments.map((c, idx) => `
            <div class="commitment-row">
              <span class="commitment-icon">${idx === 0 ? '🌱' : idx === 1 ? '🤝' : '👥'}</span>
              <div class="commitment-details">
                <div class="commitment-text">${idx + 1}. ${c.title}</div>
                <div class="commitment-subtext">Docente/Coord: ${c.teacher} · Pactado: ${c.date} (Límite: ${c.dueDate})</div>
              </div>
              <span style="font-size: 11px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">
                ${c.status}
              </span>
            </div>
          `).join('')}

          ${commitments.length === 0 ? `
            <div style="text-align: center; color: var(--text-muted); padding: 24px 16px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px dashed #cbd5e1;">
              <div style="font-size: 28px; margin-bottom: 6px;">✨</div>
              <div style="font-weight: 700; color: var(--primary-900); font-size: 14px;">¡Sin compromisos disciplinarios pendientes!</div>
              <div style="font-size: 12.5px; margin-top: 2px;">Tu historial formativo no tiene acuerdos sancionatorios vigentes.</div>
            </div>
          ` : ''}
        </div>

        <!-- Anotaciones en Folio -->
        <div style="margin-top: 20px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-900); text-transform: uppercase; margin-bottom: 8px;">
            Anotaciones en tu Folio Escolar (${studentObservations.length})
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${studentObservations.map(obs => `
              <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid ${obs.subtype === 'Positiva' ? 'var(--success-600)' : 'var(--danger-700)'};">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; flex-wrap: wrap; gap: 4px;">
                  <strong style="color: ${obs.subtype === 'Positiva' ? 'var(--success-700)' : 'var(--danger-700)'};">
                    ${obs.type} (${obs.subtype} - ${obs.severity || 'Tipo I'})
                  </strong>
                  <span style="color: var(--text-muted); font-family: var(--font-mono); font-size: 11.5px;">${obs.timestamp || obs.date}</span>
                </div>
                <div style="font-size: 13px; color: var(--text-main); line-height: 1.4;">${obs.description}</div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px; background: #f8fafc; padding: 6px 10px; border-radius: 4px;">
                  <strong>Acción correctiva:</strong> ${obs.correctiveMeasure || 'Diálogo pedagógico'} · Asentado por: ${obs.author}
                </div>
              </div>
            `).join('')}

            ${studentObservations.length === 0 ? `
              <div style="font-size: 12.5px; color: var(--text-muted); text-align: center; padding: 14px; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                No tienes llamados de atención ni faltas registradas. ¡Felicitaciones por tu buen comportamiento!
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 18px;">
          <button class="btn-primary" id="btn-daily-reflection" style="flex: 1; justify-content: center; background: var(--primary-900);">
            📝 Registrar Reflexión Diaria (+1 Pto)
          </button>
        </div>
      </div>
    </div>
  `;

  // Cambiar de estudiante para consultar otro
  const btnChange = container.querySelector('#btn-change-student-view');
  if (btnChange) {
    btnChange.addEventListener('click', () => {
      selectedStudentIdForPortal = null;
      renderStudentPortal(container);
    });
  }

  // Reflexión formativa
  const btnReflection = container.querySelector('#btn-daily-reflection');
  if (btnReflection) {
    btnReflection.addEventListener('click', () => {
      openStudentReflectionModal(student);
    });
  }
}

function openStudentReflectionModal(student) {
  const modalOverlay = document.getElementById('global-modal-overlay');
  const modalContent = document.getElementById('global-modal-content');
  if (!modalOverlay || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Registro de Reflexión Formativa Diaria</h3>
        <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
      </div>

      <form id="form-reflection">
        <div class="modal-body">
          <p style="font-size: 13px; color: var(--text-muted);">
            Estudiante: <strong>${student.name}</strong> (${student.grade}). Este espacio formativo te permite evaluar tus acuerdos de convivencia conforme al Manual del Instituto de Caldas.
          </p>

          <div class="form-group">
            <label class="form-label">¿Cómo evaluaste tu convivencia hoy en el aula?</label>
            <select class="form-select" id="reflection-mood">
              <option value="Excelente">Excelente: Cumplí todos mis compromisos y colaboré</option>
              <option value="Bueno">Bueno: Participé activamente y respeté las normas</option>
              <option value="Mejorable">Mejorable: Tuve algún llamado de atención pero corregí mi actitud</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Mi compromiso personal de mejora para mañana:</label>
            <textarea 
              class="form-textarea" 
              id="reflection-text" 
              placeholder="Escribe brevemente tu acuerdo formativo personal..."
              required
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="window.closeGlobalModal()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar Reflexión</button>
        </div>
      </form>
    </div>
  `;

  modalOverlay.classList.add('active');

  const form = document.getElementById('form-reflection');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    student.points = (student.points || 10) + 1;
    saveStore(store);
    window.closeGlobalModal();
    window.showToast(`¡Reflexión guardada para ${student.name}! Has ganado +1 punto formativo.`);
    window.renderCurrentView();
  });
}
