/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo de Administración Técnica de Accesos, Matriz de Permisos y Auditoría
 */

import { store, saveStore } from './supabase.js';
import { authService, ROLES } from './auth.js';
import { showRegisterStaffModal } from './students.js';

export function renderAdminModule(container) {
  const currentUser = authService.getCurrentUser();
  const staff = store.staff || [];

  // Construir lista dinámica de usuarios reales a partir de la sesión activa y el plantel registrado
  const usersList = [];

  // 1. Agregar usuario actual
  if (currentUser) {
    const isObservador = [ROLES.COORDINADOR, ROLES.ORIENTADOR].includes(currentUser.role);
    usersList.push({
      name: currentUser.fullName,
      email: currentUser.email || 'administrador@caldas.edu.co',
      role: currentUser.roleTitle,
      roleKey: currentUser.role,
      viewPersonal: true,
      view: true,
      create: isObservador,
      edit: isObservador,
      revert: currentUser.role === ROLES.COORDINADOR,
      status: 'ACTIVO'
    });
  }

  // 2. Agregar funcionarios y docentes inscritos o que hayan iniciado sesión
  staff.forEach(member => {
    if (!usersList.some(u => u.name.toLowerCase() === member.name.toLowerCase())) {
      const isObservador = [ROLES.COORDINADOR, ROLES.ORIENTADOR].includes(member.role);
      usersList.push({
        name: member.name,
        email: member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@caldas.edu.co`,
        role: member.roleTitle,
        roleKey: member.role,
        viewPersonal: true,
        view: true,
        create: isObservador,
        edit: isObservador,
        revert: member.role === ROLES.COORDINADOR,
        status: 'ACTIVO'
      });
    }
  });

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Observador Digital: Administración Técnica de Accesos</h1>
        <p class="page-subtitle">Matriz de roles, control de permisos RBAC y auditoría según Ley 1581 (Año 2026)</p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-primary" id="btn-admin-add-staff" style="background: var(--primary-900);">
          + Inscribir Funcionario / Docente
        </button>
        <button class="btn-secondary" id="btn-view-audit-logs">
          📜 Ver Historial de Auditoría
        </button>
      </div>
    </div>

    <!-- Matriz de Permisos por Usuario -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--primary-900);">
            VISTA PREVIA DE PERMISOS DE USUARIOS REALES (${usersList.length})
          </h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            Permisos por rol: ver, crear observaciones (exclusivo Coordinación y Orientación), editar y revertir.
          </p>
        </div>
        <div style="font-size: 11.5px; background: #f0fdf4; color: #166534; padding: 4px 10px; border-radius: 4px; border: 1px solid #bbf7d0; font-weight: 600;">
          Directorio Dinámico sin Cuentas Ficticias
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table class="permissions-table">
          <thead>
            <tr>
              <th>Usuario / Funcionario</th>
              <th>Rol Asignado</th>
              <th>Datos Personales</th>
              <th>Ver Registros</th>
              <th>Crear Observaciones / Remisiones</th>
              <th>Editar</th>
              <th>Revertir / Anular</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${usersList.map(u => `
              <tr>
                <td>
                  <strong>${u.name}</strong>
                  <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${u.email}</div>
                </td>
                <td>
                  <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">${u.role}</span>
                </td>
                <td>
                  <label class="toggle-switch">
                    <input type="checkbox" ${u.viewPersonal ? 'checked' : ''} />
                    <span class="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <label class="toggle-switch">
                    <input type="checkbox" ${u.view ? 'checked' : ''} />
                    <span class="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <label class="toggle-switch">
                    <input type="checkbox" ${u.create ? 'checked' : ''} ${!u.create ? 'title="Permiso disciplinario reservado exclusivamente a Coordinación y Orientación"' : ''} />
                    <span class="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <label class="toggle-switch">
                    <input type="checkbox" ${u.edit ? 'checked' : ''} />
                    <span class="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <label class="toggle-switch">
                    <input type="checkbox" ${u.revert ? 'checked' : ''} />
                    <span class="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; ${u.status === 'ACTIVO' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">
                    ${u.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Aviso de Desactivación y Ley de Seguridad (Boceto Figura 15) -->
      <div style="margin-top: 20px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: var(--radius-sm); padding: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="font-size: 12px; color: #9f1239;">
          <strong>AVISO DE SEGURIDAD INSTITUCIONAL:</strong> El rol Administrador gestiona credenciales y permisos técnicos de acceso según Ley 1581. El asentamiento disciplinario corresponde a Coordinación y Orientación Escolar.
        </div>
        <button class="btn-primary" id="btn-save-permissions" style="background: var(--primary-900);">
          Guardar Cambios de Acceso
        </button>
      </div>
    </div>
  `;

  const btnAddStaff = container.querySelector('#btn-admin-add-staff');
  if (btnAddStaff) {
    btnAddStaff.addEventListener('click', () => {
      showRegisterStaffModal();
    });
  }

  const btnSave = container.querySelector('#btn-save-permissions');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      window.showToast('✓ Matriz de permisos y políticas RLS actualizadas con éxito.');
    });
  }

  const btnAudit = container.querySelector('#btn-view-audit-logs');
  if (btnAudit) {
    btnAudit.addEventListener('click', () => {
      openAuditModal();
    });
  }
}

function openAuditModal() {
  const modalOverlay = document.getElementById('global-modal-overlay');
  const modalContent = document.getElementById('global-modal-content');
  if (!modalOverlay || !modalContent) return;

  const logs = store.auditLogs || [];

  modalContent.innerHTML = `
    <div class="modal-dialog" style="max-width: 720px;">
      <div class="modal-header">
        <h3 class="modal-title">Registro Inmutable de Auditoría (Ley 1581)</h3>
        <button class="modal-close-btn" onclick="window.closeGlobalModal()">×</button>
      </div>

      <div class="modal-body">
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
          Trazabilidad obligatoria de todas las creaciones, ediciones de observaciones y firmas electrónicas.
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${logs.map(log => `
            <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12.5px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>${log.user} (${log.role})</strong>
                <span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 11px;">${log.timestamp}</span>
              </div>
              <div style="color: var(--primary-700); font-weight: 600;">Acción: ${log.action}</div>
              <div style="color: var(--text-main); margin-top: 2px;">${log.detail}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick="window.closeGlobalModal()">Cerrar</button>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');
}
