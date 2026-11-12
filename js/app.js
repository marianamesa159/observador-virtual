/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Controlador Principal de la Aplicación Web (Vanilla ES6)
 */

import { authService, ROLES } from './auth.js';
import { store } from './supabase.js';
import { renderDocenteDashboard, showFolioModal } from './students.js';
import { showNewObservationModal } from './observations.js';
import { renderParentPortal } from './signatures.js';
import { renderStudentPortal } from './student_portal.js';
import { renderOrientationModule } from './orientation.js';
import { renderReportsModule } from './reports.js';
import { renderRectorDashboard } from './rector.js';
import { renderAdminModule } from './admin.js';

let currentView = 'default';

// Exponer funciones globales para llamadas desde atributos onclick
window.openStudentFolio = (studentId) => showFolioModal(studentId);
window.openNewObservationModal = (studentId) => showNewObservationModal(studentId);
window.closeGlobalModal = () => {
  const overlay = document.getElementById('global-modal-overlay');
  if (overlay) overlay.classList.remove('active');
};
window.showToast = (message) => {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

window.navigateToModule = (viewName) => {
  currentView = viewName;
  renderCurrentView();
};

window.renderCurrentView = () => {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const user = authService.getCurrentUser();
  const role = user.role;

  // Si no está autenticado, mostrar pantalla de login
  if (!authService.isAuthenticated) {
    renderLoginPage();
    return;
  }

  // Determinar vista por defecto según rol si la vista actual no fue forzada
  if (currentView === 'default') {
    if (role === ROLES.DOCENTE || role === ROLES.COORDINADOR) currentView = 'docente';
    else if (role === ROLES.ESTUDIANTE) currentView = 'student_portal';
    else if (role === ROLES.ACUDIENTE) currentView = 'parent_portal';
    else if (role === ROLES.ORIENTADOR) currentView = 'orientation';
    else if (role === ROLES.RECTOR) currentView = 'rector';
    else if (role === ROLES.ADMINISTRADOR) currentView = 'admin';
  }

  // Comprobar control de acceso según rol (RBAC / Ley 1581)
  if (currentView === 'orientation' && ![ROLES.ORIENTADOR, ROLES.COORDINADOR, ROLES.RECTOR, ROLES.ADMINISTRADOR].includes(role)) {
    renderAccessDenied(viewport, 'Módulo reservado para Coordinación y Orientación Escolar');
    return;
  }

  if (currentView === 'admin' && role !== ROLES.ADMINISTRADOR) {
    renderAccessDenied(viewport, 'Módulo de Administración Técnica reservado exclusivamente para Administradores de Plataforma');
    return;
  }

  if (currentView === 'rector' && ![ROLES.RECTOR, ROLES.COORDINADOR, ROLES.ADMINISTRADOR].includes(role)) {
    renderAccessDenied(viewport, 'Tablero Analítico reservado para Rectoría y Coordinación');
    return;
  }

  // Renderizar la vista autorizada
  updateSidebarActiveItem();

  switch (currentView) {
    case 'docente':
      renderDocenteDashboard(viewport);
      break;
    case 'parent_portal':
      renderParentPortal(viewport);
      break;
    case 'student_portal':
      renderStudentPortal(viewport);
      break;
    case 'orientation':
      renderOrientationModule(viewport);
      break;
    case 'reports':
      renderReportsModule(viewport);
      break;
    case 'rector':
      renderRectorDashboard(viewport);
      break;
    case 'admin':
      renderAdminModule(viewport);
      break;
    default:
      renderDocenteDashboard(viewport);
      break;
  }
};

function renderAccessDenied(container, reason) {
  container.innerHTML = `
    <div style="max-width: 520px; margin: 40px auto; text-align: center; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 40px 24px; box-shadow: var(--shadow-sm);">
      <div style="font-size: 54px; margin-bottom: 16px;">🔒</div>
      <h2 style="font-size: 22px; font-weight: 800; color: var(--primary-900); margin-bottom: 8px;">
        ACCESO DENEGADO
      </h2>
      <p style="font-size: 15px; font-weight: 600; color: var(--danger-700); margin-bottom: 8px;">
        ${reason}
      </p>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.4;">
        En cumplimiento con la Ley 1581 de 2012 de Protección de Datos Personales de Menores y las normas del Manual de Convivencia, tu perfil actual no cuenta con autorización para visualizar estos registros.
      </p>
      <button class="btn-primary" onclick="window.navigateToModule('default')" style="margin: 0 auto;">
        Volver a mi Panel Principal
      </button>
    </div>
  `;
}

function renderLoginPage() {
  const root = document.getElementById('root-app');
  if (!root) return;

  let currentSelectedRole = ROLES.DOCENTE;
  const registeredStudents = store.students || [];

  const rolesList = [
    { key: ROLES.DOCENTE, name: 'Docente', icon: '👨‍🏫' },
    { key: ROLES.COORDINADOR, name: 'Coordinador(a)', icon: '👔' },
    { key: ROLES.ORIENTADOR, name: 'Orientador(a)', icon: '🧠' },
    { key: ROLES.RECTOR, name: 'Rectoría', icon: '🏛️' },
    { key: ROLES.ESTUDIANTE, name: 'Estudiante', icon: '🎒' },
    { key: ROLES.ACUDIENTE, name: 'Acudiente', icon: '👨‍👩‍👧' },
    { key: ROLES.ADMINISTRADOR, name: 'Administrador', icon: '⚙️' }
  ];

  root.innerHTML = `
    <div class="login-page-wrapper">
      <div class="login-card">
        <!-- Lado Marca Institucional con Escudo Oficial -->
        <div class="login-brand-side">
          <img 
            src="/assets/aistudio/escudo_universitario_de_caldas_36ad045f.jpg" 
            alt="Escudo Oficial Instituto Universitario de Caldas" 
            class="login-crest-img" 
          />
          <h2 class="login-inst-name">Instituto Universitario de Caldas</h2>
          <div class="login-app-name">OBSERVADOR DIGITAL ESCOLAR</div>
          <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">Grados 11-1 · 11-2 · 11-3 · 11-4</div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 14px; text-align: center;">
            Manizales, Caldas<br>Año Lectivo 2026
          </div>
        </div>

        <!-- Lado Formulario y Selector de Roles -->
        <div class="login-form-side">
          <h1 class="login-form-title">SISTEMA DE CONVIVENCIA ESCOLAR</h1>
          <p class="login-form-subtitle">Selecciona tu rol institucional e ingresa tus datos para acceder:</p>

          <form id="login-form">
            <!-- 1. Selector de Rol Interactivo -->
            <div class="role-selector-group">
              <label class="form-label" style="font-size: 12px; margin-bottom: 6px; display: block; font-weight: 700;">
                PASO 1: SELECCIONA EL ROL AL QUE PERTENECES:
              </label>

              <div class="role-selector-pills" id="role-pills-container">
                ${rolesList.map(r => `
                  <button 
                    type="button" 
                    class="role-pill-btn ${r.key === currentSelectedRole ? 'active' : ''}" 
                    data-role="${r.key}"
                  >
                    <span>${r.icon}</span>
                    <span>${r.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Contenedor de Alerta / Error de Validación -->
            <div id="login-error-container" style="display: none; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 14px; border-radius: var(--radius-sm); font-size: 12.5px; margin-bottom: 12px; line-height: 1.4;"></div>

            <!-- 2. Nombre del Usuario (Con Autocompletado si es Estudiante) -->
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" id="label-login-fullname" style="font-size: 12px; font-weight: 700;">
                PASO 2: Tu Nombre y Apellido
              </label>
              <input 
                type="text" 
                class="form-input" 
                id="login-fullname" 
                value="" 
                placeholder="Escribe tu nombre y apellido..." 
                required 
                style="padding: 10px 12px; font-size: 13.5px;"
                autocomplete="off"
              />
              <!-- Datalist para autocompletar estudiantes existentes -->
              <datalist id="students-autocomplete-list">
                ${registeredStudents.map(s => `
                  <option value="${s.name}">${s.name} — Grado ${s.grade} (ID: ${s.code})</option>
                `).join('')}
              </datalist>

              <div id="student-autocomplete-hint" style="display: none; font-size: 11.5px; color: var(--primary-700); margin-top: 5px; background: var(--primary-50); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--primary-100);">
                💡 <strong>Autocompletado activo:</strong> Selecciona tu nombre de la lista de estudiantes matriculados en 11-1, 11-2, 11-3 o 11-4. Si ingresas otro nombre, el sistema no te permitirá el acceso.
              </div>
            </div>

            <!-- 3. Credenciales -->
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" style="font-size: 12px; font-weight: 700;">
                Usuario o Correo Institucional
              </label>
              <input 
                type="text" 
                class="form-input" 
                id="login-email" 
                value="" 
                placeholder="nombre.apellido@caldas.edu.co" 
                required 
                style="padding: 10px 12px; font-size: 13.5px;"
              />
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" style="font-size: 12px; font-weight: 700;">Contraseña Institucional</label>
              <input 
                type="password" 
                class="form-input" 
                id="login-password" 
                value="" 
                placeholder="Escribe tu contraseña..." 
                required 
                style="padding: 10px 12px; font-size: 13.5px;"
              />
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 12px; font-size: 14px; font-weight: 700;">
              INGRESAR AL OBSERVADOR
            </button>

            <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px; text-align: center; line-height: 1.4;">
              ✓ Ingresa tus datos reales. Los funcionarios se agendan automáticamente en el directorio de la institución.
            </div>

            <div class="login-legal-badge" style="margin-top: 14px; font-size: 10.5px;">
              Acceso seguro conforme al Manual de Convivencia y la Ley 1581 de 2012 de Protección de Datos Personales.
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const inputFullName = document.getElementById('login-fullname');
  const labelFullName = document.getElementById('label-login-fullname');
  const inputEmail = document.getElementById('login-email');
  const inputPassword = document.getElementById('login-password');
  const studentHint = document.getElementById('student-autocomplete-hint');
  const errorContainer = document.getElementById('login-error-container');

  // Función para adaptar la UI según el rol seleccionado
  const updateRoleUI = (role) => {
    currentSelectedRole = role;
    if (errorContainer) errorContainer.style.display = 'none';

    if (role === ROLES.ESTUDIANTE) {
      inputFullName.setAttribute('list', 'students-autocomplete-list');
      inputFullName.placeholder = 'Empieza a escribir tu nombre de estudiante...';
      labelFullName.innerHTML = 'PASO 2: Tu Nombre Completo (Estudiante de Grado Once)';
      inputEmail.placeholder = 'estudiante@estudiantes.caldas.edu.co';
      if (studentHint) studentHint.style.display = 'block';
    } else {
      inputFullName.removeAttribute('list');
      inputFullName.placeholder = 'Escribe tu nombre y apellido...';
      labelFullName.innerHTML = 'PASO 2: Tu Nombre y Apellido';
      inputEmail.placeholder = 'nombre.apellido@caldas.edu.co';
      if (studentHint) studentHint.style.display = 'none';
    }
  };

  // Listener para cambiar el rol seleccionado
  const roleButtons = root.querySelectorAll('.role-pill-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.getAttribute('data-role');
      updateRoleUI(role);
    });
  });

  // Al autocompletar nombre de estudiante, auto-rellenar correo institucional y clave sugerida
  inputFullName.addEventListener('input', (e) => {
    if (currentSelectedRole === ROLES.ESTUDIANTE) {
      const val = e.target.value.trim();
      const cleanName = val.split(' — ')[0].split(' - ')[0].trim();
      const found = registeredStudents.find(s => 
        s.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (found) {
        // Asignar el nombre exacto si vino con el sufijo del datalist
        inputFullName.value = found.name;
        if (!inputEmail.value) {
          inputEmail.value = `${found.name.toLowerCase().replace(/\s+/g, '.')}@estudiantes.caldas.edu.co`;
        }
        if (!inputPassword.value) {
          inputPassword.value = 'caldas2026';
        }
      }
    }
  });

  // Envío del formulario
  const form = document.getElementById('login-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errorContainer) errorContainer.style.display = 'none';

    let customName = inputFullName.value.trim();
    let email = inputEmail.value.trim();
    let password = inputPassword.value.trim();

    // VALIDACIÓN ESTRICTA PARA ESTUDIANTES: Solo se permite entrar si el estudiante ya existe
    if (currentSelectedRole === ROLES.ESTUDIANTE) {
      const cleanName = customName.split(' — ')[0].split(' - ')[0].trim();
      const matchedStudent = registeredStudents.find(s => 
        s.name.trim().toLowerCase() === cleanName.toLowerCase() ||
        (s.shortName && s.shortName.trim().toLowerCase() === cleanName.toLowerCase())
      );

      if (!matchedStudent) {
        if (errorContainer) {
          errorContainer.innerHTML = `
            <div style="font-weight: 800; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
              <span>❌</span> ACCESO DENEGADO: ESTUDIANTE NO ENCONTRADO
            </div>
            <div>
              El nombre <strong>"${cleanName}"</strong> no corresponde a ningún alumno matriculado en las listas oficiales de Grado Once (11-1, 11-2, 11-3 o 11-4).
            </div>
            <div style="margin-top: 4px; font-size: 11.5px; color: #b91c1c;">
              Por favor escribe tu nombre tal como figura en la matrícula o selecciónalo del autocompletado.
            </div>
          `;
          errorContainer.style.display = 'block';
        } else {
          alert(`❌ Acceso denegado: El estudiante "${cleanName}" no se encuentra matriculado en los grados 11-1, 11-2, 11-3 o 11-4.`);
        }
        return;
      }

      // Si el estudiante existe, continuar el login y vincular su folio
      const studentEmail = email || `${matchedStudent.name.toLowerCase().replace(/\s+/g, '.')}@estudiantes.caldas.edu.co`;
      const studentPassword = password || 'caldas2026';

      const res = authService.login(studentEmail, studentPassword, currentSelectedRole, matchedStudent.name, {
        studentId: matchedStudent.id,
        studentGrade: matchedStudent.grade,
        studentCode: matchedStudent.code,
        avatar: matchedStudent.avatar
      });

      if (res.success) {
        currentView = 'student_portal';
        initAppLayout();
        window.showToast(`Bienvenido(a), ${matchedStudent.name} (Grado ${matchedStudent.grade})`);
      }
      return;
    }

    // Para los demás roles (Docente, Coordinador, Orientador, Rector, Acudiente, Administrador)
    const res = authService.login(email, password, currentSelectedRole, customName);
    if (res.success) {
      currentView = 'default';
      initAppLayout();
      window.showToast(`Bienvenido(a), ${res.user.fullName}`);
    } else {
      if (errorContainer) {
        errorContainer.textContent = res.message;
        errorContainer.style.display = 'block';
      } else {
        alert(res.message);
      }
    }
  });
}

function renderLogoutSuccess() {
  const root = document.getElementById('root-app');
  if (!root) return;

  root.innerHTML = `
    <div class="logout-success-wrapper">
      <div class="logout-success-card">
        <svg class="logout-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>

        <h2 class="logout-success-title">Sesión finalizada con éxito.</h2>
        <p class="logout-success-subtitle">Sus datos están protegidos.</p>

        <button class="btn-back-home" id="btn-return-login">
          Volver a la pantalla de inicio
        </button>

        <div class="logout-footer-note">
          © 2026 Instituto Universitario de Caldas · Observador Virtual
        </div>
      </div>
    </div>
  `;

  const btnReturn = document.getElementById('btn-return-login');
  if (btnReturn) {
    btnReturn.addEventListener('click', () => {
      renderLoginPage();
    });
  }
}

export function initAppLayout() {
  const root = document.getElementById('root-app');
  if (!root) return;

  const currentUser = authService.getCurrentUser();

  root.innerHTML = `
    <!-- Encabezado Principal Institucional (Sin barra superior de prueba) -->
    <header class="main-header">
      <div class="header-brand-zone">
        <img 
          src="/assets/aistudio/escudo_universitario_de_caldas_36ad045f.jpg" 
          alt="Escudo Oficial Instituto Universitario de Caldas" 
          class="header-logo-img" 
        />
        <div class="header-titles">
          <span class="header-institution">INSTITUTO UNIVERSITARIO DE CALDAS</span>
          <span class="header-appname">OBSERVADOR VIRTUAL · Convivencia Escolar 2026</span>
        </div>
      </div>

      <div class="header-user-zone">
        <div class="user-pill-info">
          <div>
            <div class="user-meta-name" id="header-user-name">${currentUser.fullName}</div>
            <div class="user-meta-role" id="header-user-role">${currentUser.roleTitle}</div>
          </div>
          <img 
            src="${currentUser.avatar}" 
            alt="${currentUser.name}" 
            class="user-avatar-small" 
            id="header-user-avatar"
            onerror="this.src='/src/assets/images/avatar_rector_alejandro_1794435251468.jpg'" 
          />
        </div>

        <button class="btn-header-action" id="btn-header-logout" title="Cerrar sesión">
          <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>

    <!-- Contenedor App con Sidebar y Viewport -->
    <div class="app-container">
      <aside class="sidebar">
        <div>
          <div class="nav-group-title">MÓDULOS DISPONIBLES</div>
          <ul class="nav-links-list" id="sidebar-nav-list">
            <!-- Los links se generan según el rol activo -->
          </ul>
        </div>

        <div class="sidebar-legal-card">
          <div class="legal-title">
            <span>🛡️ Ley 1581 de 2012</span>
          </div>
          Sistema institucional protegido. Los registros y firmas conservan valor probatorio ante comités y autoridades educativas.
        </div>
      </aside>

      <main class="main-viewport" id="app-viewport">
        <!-- Aquí se montan las vistas dinámicamente -->
      </main>
    </div>

    <!-- Modales Globales y Toasts -->
    <div class="modal-overlay" id="global-modal-overlay">
      <div id="global-modal-content"></div>
    </div>

    <div class="toast-container" id="toast-container"></div>
  `;

  // Botón Salir / Cerrar Sesión -> Lleva a la pantalla intermedia oficial con el candado
  const btnLogout = root.querySelector('#btn-header-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      authService.logout();
      renderLogoutSuccess();
    });
  }

  // Renderizar navegación lateral y vista actual
  renderSidebarNav();
  window.renderCurrentView();
}

function renderSidebarNav() {
  const navList = document.getElementById('sidebar-nav-list');
  if (!navList) return;

  const role = authService.getCurrentRole();

  const links = [];

  // Módulos para Docente y Coordinador
  if ([ROLES.DOCENTE, ROLES.COORDINADOR].includes(role)) {
    links.push({ id: 'docente', label: 'Panel de Estudiantes', icon: '👥' });
    links.push({ id: 'reports', label: 'Generador de Reportes', icon: '📊' });
  }

  // Módulo para Orientadora
  if (role === ROLES.ORIENTADOR) {
    links.push({ id: 'orientation', label: 'Ficha de Orientación', icon: '🧠' });
    links.push({ id: 'docente', label: 'Consulta Estudiantes', icon: '👥' });
    links.push({ id: 'reports', label: 'Reportes Psicosociales', icon: '📊' });
  }

  // Módulo para Rectoría
  if (role === ROLES.RECTOR) {
    links.push({ id: 'rector', label: 'Dashboard Analítico', icon: '🏛️' });
    links.push({ id: 'reports', label: 'Reportes de Convivencia', icon: '📊' });
    links.push({ id: 'docente', label: 'Historial por Curso', icon: '👥' });
    links.push({ id: 'orientation', label: 'Expediente Orientación', icon: '🔒' });
  }

  // Módulo para Estudiante
  if (role === ROLES.ESTUDIANTE) {
    links.push({ id: 'student_portal', label: 'Mi Estado de Convivencia', icon: '🚦' });
  }

  // Módulo para Acudiente
  if (role === ROLES.ACUDIENTE) {
    links.push({ id: 'parent_portal', label: 'Observaciones de mi Hijo', icon: '📋' });
  }

  // Módulo para Administrador
  if (role === ROLES.ADMINISTRADOR) {
    links.push({ id: 'admin', label: 'Administración de Accesos', icon: '⚙️' });
    links.push({ id: 'docente', label: 'Panel Docente', icon: '👥' });
    links.push({ id: 'rector', label: 'Dashboard de Rectoría', icon: '🏛️' });
    links.push({ id: 'orientation', label: 'Ficha de Orientación', icon: '🧠' });
    links.push({ id: 'reports', label: 'Generador de Reportes', icon: '📊' });
  }

  navList.innerHTML = links.map(link => `
    <li>
      <a class="nav-link-item ${currentView === link.id ? 'active' : ''}" data-view="${link.id}">
        <span class="nav-link-icon">${link.icon}</span>
        <span>${link.label}</span>
      </a>
    </li>
  `).join('');

  navList.querySelectorAll('.nav-link-item').forEach(link => {
    link.addEventListener('click', () => {
      const targetView = link.getAttribute('data-view');
      window.navigateToModule(targetView);
    });
  });
}

function updateSidebarActiveItem() {
  const items = document.querySelectorAll('.nav-link-item');
  items.forEach(item => {
    if (item.getAttribute('data-view') === currentView) item.classList.add('active');
    else item.classList.remove('active');
  });
}

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  if (authService.isAuthenticated) {
    initAppLayout();
  } else {
    renderLoginPage();
  }
});
