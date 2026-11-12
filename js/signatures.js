/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo del Portal de Padres y Acudientes (Consulta Privada Escalonada: Grado -> Estudiante + Firma Canvas)
 */

import { store, saveStore, updateStudentCounters } from './supabase.js';
import { authService } from './auth.js';

let isDrawing = false;
let canvasCtx = null;
let hasSigned = false;
let selectedStudentForParent = null;
let selectedGradeForParent = '11-1';

export function renderParentPortal(container) {
  const currentUser = authService.getCurrentUser();
  const students = store.students || [];

  // Vista 1: Si aún no ha seleccionado su hijo/estudiante, mostrar pantalla de selección protegida
  if (!selectedStudentForParent) {
    const gradeStudents = students.filter(s => s.grade === selectedGradeForParent);

    container.innerHTML = `
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Portal de Padres y Acudientes</h1>
          <p class="page-subtitle">Protección de Datos Personales de Menores — Ley 1581 de 2012</p>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: var(--primary-700); background: var(--primary-50); padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--primary-100);">
          Acudiente: <strong>${currentUser.fullName}</strong>
        </div>
      </div>

      <div style="max-width: 620px; margin: 30px auto; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-sm);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 12px;">👨‍👩‍👧</div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--primary-900);">
            Consulta del Observador de su Hijo(a)
          </h2>
          <p style="font-size: 13.5px; color: var(--text-muted); margin-top: 6px; line-height: 1.5;">
            Por confidencialidad y debido proceso formativo, debe indicar el grado y el nombre de su acudido para desplegar exclusivamente su expediente.
          </p>
        </div>

        <form id="form-parent-lookup">
          <!-- Paso 1: Seleccionar Grado -->
          <div class="form-group" style="margin-bottom: 18px;">
            <label class="form-label" style="font-size: 13px; font-weight: 700; color: var(--primary-900);">
              PASO 1: SELECCIONE EL GRADO ESCOLAR:
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${['11-1', '11-2', '11-3', '11-4'].map(gr => `
                <button 
                  type="button" 
                  class="btn-secondary parent-grade-pill ${selectedGradeForParent === gr ? 'active' : ''}" 
                  data-grade="${gr}"
                  style="padding: 10px 0; text-align: center; font-weight: 700; font-size: 14px; ${selectedGradeForParent === gr ? 'background: var(--primary-900); color: #fff; border-color: var(--primary-900);' : ''}"
                >
                  ${gr}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Paso 2: Seleccionar Estudiante -->
          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label" style="font-size: 13px; font-weight: 700; color: var(--primary-900);">
              PASO 2: SELECCIONE EL NOMBRE DEL ESTUDIANTE:
            </label>
            <select class="form-select" id="parent-student-dropdown" style="font-size: 14px; padding: 12px; font-weight: 600;" required>
              <option value="">-- Seleccionar estudiante de ${selectedGradeForParent} --</option>
              ${gradeStudents.map(s => `
                <option value="${s.id}">${s.name} (ID Matrícula: ${s.code})</option>
              `).join('')}
            </select>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px;">
              Estudiantes activos en este salón: ${gradeStudents.length}
            </div>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-size: 14px; font-weight: 700;">
            VER OBSERVADOR DE MI HIJO(A)
          </button>
        </form>

        <div style="margin-top: 20px; font-size: 11px; color: var(--text-muted); text-align: center; line-height: 1.4; border-top: 1px dashed #e2e8f0; padding-top: 14px;">
          🛡️ Acceso regulado conforme a la Ley Estatutaria 1581 de 2012 y el Manual de Convivencia Escolar del Instituto de Caldas.
        </div>
      </div>
    `;

    // Listeners para cambiar de grado
    const gradeButtons = container.querySelectorAll('.parent-grade-pill');
    gradeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedGradeForParent = btn.getAttribute('data-grade');
        renderParentPortal(container);
      });
    });

    const formLookup = container.querySelector('#form-parent-lookup');
    formLookup.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = container.querySelector('#parent-student-dropdown').value;
      if (!studentId) {
        alert('Por favor selecciona el estudiante que deseas consultar.');
        return;
      }
      selectedStudentForParent = studentId;
      renderParentPortal(container);
    });

    return;
  }

  // Vista 2: Expediente particular del hijo seleccionado
  const student = students.find(s => s.id === selectedStudentForParent);
  if (!student) {
    selectedStudentForParent = null;
    renderParentPortal(container);
    return;
  }

  const observations = (store.observations || []).filter(o => o.studentId === student.id);
  const pendingObs = observations.filter(o => !o.hasSignature);
  const commitments = (store.commitments || []).filter(c => c.studentId === student.id);

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Observador Digital: Folio de mi Hijo(a)</h1>
        <p class="page-subtitle">Seguimiento formativo de ${student.name} — Grado ${student.grade}</p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="btn-secondary" id="btn-change-child" style="font-size: 12px; padding: 8px 14px;">
          🔄 Consultar otro estudiante
        </button>
        <button class="btn-secondary" onclick="window.print()" style="font-size: 12px; padding: 8px 14px;">
          🖨️ Imprimir Historial
        </button>
      </div>
    </div>

    <div class="parent-portal-layout">
      <!-- Columna Izquierda: Expediente y Anotaciones del Estudiante -->
      <div>
        <!-- Ficha de Identificación del Estudiante Consultado -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px; display: flex; align-items: center; gap: 18px; margin-bottom: 20px;">
          <img 
            src="${student.avatar}" 
            alt="${student.name}" 
            style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.1);" 
            onerror="this.src='/src/assets/images/avatar_estudiante_juan_1794435251279.jpg'"
          />
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 style="font-size: 18px; font-weight: 800; color: var(--primary-900);">${student.name}</h2>
              <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: ${student.coexistenceStatus === 'Bueno' ? '#dcfce7; color: #166534;' : student.coexistenceStatus === 'Reflexión Necesaria' ? '#fef3c7; color: #92400e;' : '#fee2e2; color: #991b1b;'}">
                ${student.coexistenceStatus}
              </span>
            </div>
            <div style="font-size: 13px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
              ID: ${student.code} · Curso: <strong>${student.grade}</strong> (${student.shift}) · Acudiente registrado: ${student.guardianName}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              ${pendingObs.length > 0 
                ? `<span style="color: var(--danger-700); font-weight: 700;">⚠️ Hay ${pendingObs.length} observación(es) pendiente(s) de tu firma digital.</span>` 
                : `<span style="color: var(--success-700); font-weight: 600;">✓ Todas las observaciones se encuentran notificadas y firmadas.</span>`}
              · Puntos de convivencia: <strong>${student.points} pts</strong>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--primary-900);">
            Historial de Observaciones (${observations.length})
          </h3>
          <button class="btn-secondary" id="btn-add-sample-parent" style="font-size: 11.5px; padding: 5px 10px;" title="Añadir una observación de prueba para verificar visualización">
            + Anotación de Prueba
          </button>
        </div>

        <div class="observation-timeline">
          ${observations.map(obs => `
            <div class="timeline-item-card" style="border-left: 4px solid ${obs.subtype === 'Positiva' ? 'var(--success-600)' : obs.severity === 'Tipo I' ? 'var(--warning-600)' : 'var(--danger-700)'};">
              <div class="timeline-header">
                <div>
                  <span class="timeline-dot ${obs.subtype.toLowerCase()}"></span>
                  <span class="timeline-date">${obs.timestamp || obs.date}</span>
                </div>
                <span class="timeline-badge ${obs.subtype === 'Positiva' ? 'merito' : 'tipo1'}">
                  ${obs.subtype === 'Positiva' ? '🌟 Reconocimiento Positivo' : '⚠️ Falta ' + (obs.severity || 'Tipo I')}
                </span>
              </div>

              <div style="font-size: 12px; color: var(--primary-800); font-weight: 700; margin-bottom: 4px;">
                Naturaleza: ${obs.type} (${obs.subtype})
              </div>

              <p class="timeline-desc" style="font-size: 13.5px; line-height: 1.5; color: var(--text-main);">${obs.description}</p>

              <div style="background: #f8fafc; padding: 9px 12px; border-radius: var(--radius-sm); font-size: 12.5px; margin: 10px 0 8px; border: 1px solid var(--border-subtle);">
                <strong style="color: var(--primary-900);">Acción Pedagógica / Corrección:</strong> ${obs.correctiveMeasure || 'Diálogo pedagógico preventivo'}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-muted); flex-wrap: wrap; gap: 8px;">
                <span>Asentado por: <strong>${obs.author}</strong> (${obs.authorRole})</span>
                <span style="font-weight: 700; color: ${obs.hasSignature ? 'var(--success-700)' : 'var(--danger-700)'};">
                  ${obs.hasSignature ? '✓ Notificado y firmado legalmente' : '⏳ Requiere firma del acudiente'}
                </span>
              </div>

              ${obs.hasSignature && obs.signatureData ? `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">Constancia de firma:</span>
                    <img src="${obs.signatureData}" alt="Firma acudiente" style="max-height: 38px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; padding: 2px;" />
                  </div>
                  <span style="font-size: 10.5px; color: var(--text-light); font-family: var(--font-mono);">
                    Fecha/hora: ${obs.signedAt || '2026'}
                  </span>
                </div>
              ` : ''}
            </div>
          `).join('')}

          ${observations.length === 0 ? `
            <div style="background: #ffffff; padding: 36px 20px; text-align: center; color: var(--text-muted); border-radius: var(--radius-md); border: 1px dashed #cbd5e1;">
              <div style="font-size: 36px; margin-bottom: 8px;">📋</div>
              <div style="font-size: 15px; font-weight: 700; color: var(--primary-900); margin-bottom: 4px;">
                El folio de ${student.name} no presenta observaciones ni faltas
              </div>
              <p style="font-size: 13px; max-width: 440px; margin: 0 auto 16px;">
                Su comportamiento se encuentra en estado óptimo. Las anotaciones que registre Coordinación se reflejarán inmediatamente en esta sección.
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Compromisos formativos -->
        ${commitments.length > 0 ? `
          <div style="margin-top: 24px; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px;">
            <h4 style="font-size: 13.5px; font-weight: 700; color: var(--primary-900); text-transform: uppercase; margin-bottom: 10px;">
              Compromisos Disciplinarios Asumidos (${commitments.length})
            </h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${commitments.map(c => `
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: var(--radius-sm); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 13px; font-weight: 700; color: #92400e;">${c.title}</div>
                    <div style="font-size: 11.5px; color: #b45309;">Docente/Coord: ${c.teacher} · Fecha límite: ${c.dueDate}</div>
                  </div>
                  <span style="font-size: 11px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 3px 8px; border-radius: 4px;">
                    ${c.status}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Columna Derecha: Panel de Firma Digital Canvas -->
      <aside class="signature-request-box">
        <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--primary-900); letter-spacing: 0.5px;">
          Confirmación de Conocimiento y Firma Digital
        </h3>

        <div class="signature-legal-notice">
          <strong>Aviso Legal Institucional:</strong> Conforme al <em>Manual de Convivencia</em> del Instituto Universitario de Caldas y la <em>Ley 1581 de 2012</em> (Protección de Datos), certifico que he sido notificado del estado disciplinario de mi acudido(a) <strong>${student.name}</strong>. Esta firma virtual acredita la notificación al acudiente.
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">
            Firme en el recuadro con su dedo o puntero del ratón:
          </label>
          <div class="signature-canvas-container" id="canvas-wrapper">
            <canvas id="signature-pad" class="signature-canvas"></canvas>
            <div class="signature-canvas-hint" id="canvas-hint">✍️ Dibuje su firma aquí</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <button type="button" class="btn-secondary" id="btn-clear-sig" style="font-size: 11px; padding: 4px 8px;">
              Limpiar recuadro
            </button>
            <span style="font-size: 11px; color: var(--text-light); font-family: var(--font-mono);">
              ${new Date().toLocaleDateString('es-CO')}
            </span>
          </div>
        </div>

        <button class="btn-primary" id="btn-confirm-sig" style="width: 100%; justify-content: center; padding: 12px; font-size: 13.5px;">
          Firmar y Asentar Notificación
        </button>

        <p style="font-size: 11px; color: var(--text-light); text-align: center; line-height: 1.4;">
          El acudiente no puede alterar las observaciones docentes, pero su firma garantiza el debido proceso ante el Comité de Convivencia.
        </p>
      </aside>
    </div>
  `;

  // Cambiar de acudido
  const btnChangeChild = container.querySelector('#btn-change-child');
  if (btnChangeChild) {
    btnChangeChild.addEventListener('click', () => {
      selectedStudentForParent = null;
      renderParentPortal(container);
    });
  }

  // Anotación de prueba para verificar visualización
  const btnAddSample = container.querySelector('#btn-add-sample-parent');
  if (btnAddSample) {
    btnAddSample.addEventListener('click', () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      store.observations.unshift({
        id: `obs-${Date.now()}`,
        studentId: student.id,
        type: 'Convivencial',
        subtype: 'Negativa',
        severity: 'Tipo I',
        date: dateStr,
        timestamp: `${now.toLocaleDateString('es-CO')} ${timeStr}`,
        author: 'Coordinación de Convivencia',
        authorRole: 'Coordinador Académico y Convivencia',
        description: `Llamado de atención formativo por interrupción reiterada de clase y uso de distractores no autorizados en el aula.`,
        correctiveMeasure: `Diálogo formativo, compromiso de atención y firma de notificación con acudiente.`,
        status: 'Pendiente de Firma',
        hasSignature: false,
        signatureData: null
      });

      updateStudentCounters(student.id);
      saveStore(store);
      window.showToast(`Anotación registrada en el folio de ${student.name}`);
      renderParentPortal(container);
    });
  }

  // Inicializar canvas de firma
  initSignaturePad(container, student);
}

function initSignaturePad(container, student) {
  const canvas = container.querySelector('#signature-pad');
  const wrapper = container.querySelector('#canvas-wrapper');
  const hint = container.querySelector('#canvas-hint');
  const btnClear = container.querySelector('#btn-clear-sig');
  const btnConfirm = container.querySelector('#btn-confirm-sig');

  if (!canvas || !wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  canvas.width = rect.width || 320;
  canvas.height = rect.height || 160;

  canvasCtx = canvas.getContext('2d');
  canvasCtx.strokeStyle = '#0f2744';
  canvasCtx.lineWidth = 2.5;
  canvasCtx.lineCap = 'round';
  canvasCtx.lineJoin = 'round';
  hasSigned = false;

  function getPos(e) {
    const cRect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - cRect.left,
      y: clientY - cRect.top
    };
  }

  function startDrawing(e) {
    isDrawing = true;
    hasSigned = true;
    if (hint) hint.style.display = 'none';
    const pos = getPos(e);
    canvasCtx.beginPath();
    canvasCtx.moveTo(pos.x, pos.y);
    e.preventDefault();
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getPos(e);
    canvasCtx.lineTo(pos.x, pos.y);
    canvasCtx.stroke();
    e.preventDefault();
  }

  function stopDrawing() {
    isDrawing = false;
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      hasSigned = false;
      if (hint) hint.style.display = 'block';
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      if (!hasSigned) {
        alert('Por favor dibuja tu firma en el recuadro antes de confirmar.');
        return;
      }

      const sigDataUrl = canvas.toDataURL('image/png');
      const currentUser = authService.getCurrentUser();
      const nowStr = new Date().toLocaleString('es-CO');

      let signedCount = 0;
      store.observations.forEach(o => {
        if (o.studentId === student.id && !o.hasSignature) {
          o.hasSignature = true;
          o.status = 'Firmado por Acudiente';
          o.signatureData = sigDataUrl;
          o.signedAt = nowStr;
          signedCount++;
        }
      });

      if (signedCount === 0) {
        store.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          user: currentUser.fullName,
          role: 'Acudiente',
          action: 'CONSTANCIA_REVISION_FOLIO',
          detail: `Acudiente revisó y firmó constancia de conocimiento para ${student.name}`,
          timestamp: new Date().toISOString()
        });
        window.showToast(`✓ Constancia de revisión asentada con firma digital.`);
      } else {
        store.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          user: currentUser.fullName,
          role: 'Acudiente',
          action: 'FIRMA_VIRTUAL_ACUDIENTE',
          detail: `Asentó firma electrónica para ${signedCount} observación(es) de ${student.name}`,
          timestamp: new Date().toISOString()
        });
        window.showToast(`✓ Se firmaron ${signedCount} observación(es) de ${student.name} exitosamente.`);
      }

      saveStore(store);
      renderParentPortal(container);
    });
  }
}
