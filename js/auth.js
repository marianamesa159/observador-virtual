/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Gestión de Autenticación, Roles Institucionales (RBAC) y Permisos (Sin datos ficticios prehechos)
 */

import { registerStaffMember } from './supabase.js';

export const ROLES = {
  DOCENTE: 'docente',
  COORDINADOR: 'coordinador',
  ORIENTADOR: 'orientador',
  RECTOR: 'rector',
  ESTUDIANTE: 'estudiante',
  ACUDIENTE: 'acudiente',
  ADMINISTRADOR: 'administrador'
};

export const ROLE_TITLES = {
  [ROLES.DOCENTE]: 'Docente de Grado Once',
  [ROLES.COORDINADOR]: 'Coordinador Académico y Convivencia',
  [ROLES.ORIENTADOR]: 'Orientador Escolar y Psicosocial',
  [ROLES.RECTOR]: 'Rectoría Institucional',
  [ROLES.ESTUDIANTE]: 'Estudiante Institucional',
  [ROLES.ACUDIENTE]: 'Acudiente Legal',
  [ROLES.ADMINISTRADOR]: 'Administrador de Plataforma'
};

export const ROLE_AVATARS = {
  [ROLES.DOCENTE]: '/src/assets/images/avatar_rector_alejandro_1794435251468.jpg',
  [ROLES.COORDINADOR]: '/src/assets/images/avatar_rector_alejandro_1794435251468.jpg',
  [ROLES.ORIENTADOR]: '/src/assets/images/avatar_orientadora_carla_1794435252566.jpg',
  [ROLES.RECTOR]: '/src/assets/images/avatar_rector_alejandro_1794435251468.jpg',
  [ROLES.ESTUDIANTE]: '/src/assets/images/avatar_estudiante_juan_1794435251279.jpg',
  [ROLES.ACUDIENTE]: '/src/assets/images/avatar_orientadora_carla_1794435252566.jpg',
  [ROLES.ADMINISTRADOR]: '/src/assets/images/avatar_orientadora_carla_1794435252566.jpg'
};

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = {
      id: 'guest',
      name: 'Usuario Institucional',
      fullName: 'Usuario Institucional',
      role: ROLES.DOCENTE,
      roleTitle: ROLE_TITLES[ROLES.DOCENTE],
      email: '',
      avatar: ROLE_AVATARS[ROLES.DOCENTE],
      code: '00000',
      studentId: null
    };

    // Recuperar usuario guardado si existe sesión previa
    try {
      const saved = localStorage.getItem('ov_current_user');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        this.isAuthenticated = true;
      }
    } catch {
      // Ignorar error de parsing
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentRole() {
    return this.currentUser.role;
  }

  login(email, password, selectedRole = ROLES.DOCENTE, customName = '', metadata = {}) {
    if (!email || !password) {
      return { success: false, message: 'Por favor ingresa tu usuario/correo y contraseña.' };
    }

    // Generar nombre: usar el nombre digitado si se proporcionó, o extraer del correo/usuario
    let displayName = '';
    if (customName && customName.trim()) {
      displayName = customName.trim();
    } else {
      let rawName = email.split('@')[0].replace(/[._-]/g, ' ');
      displayName = rawName
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    if (!displayName) {
      displayName = 'Funcionario Institucional';
    }

    const rolePrefixes = {
      [ROLES.DOCENTE]: 'Profr(a).',
      [ROLES.COORDINADOR]: 'Coord.',
      [ROLES.ORIENTADOR]: 'Psic.',
      [ROLES.RECTOR]: 'Rector(a)',
      [ROLES.ESTUDIANTE]: '',
      [ROLES.ACUDIENTE]: '',
      [ROLES.ADMINISTRADOR]: 'Ing.'
    };

    const prefix = rolePrefixes[selectedRole] && !displayName.toLowerCase().startsWith('profr') && !displayName.toLowerCase().startsWith('coord') && !displayName.toLowerCase().startsWith('dr')
      ? `${rolePrefixes[selectedRole]} ` 
      : '';

    const formattedFullName = prefix ? `${prefix}${displayName}` : displayName;
    const roleTitle = ROLE_TITLES[selectedRole] || 'Funcionario Institucional';

    const user = {
      id: `usr-${Date.now()}`,
      name: displayName,
      fullName: formattedFullName,
      role: selectedRole,
      roleTitle: roleTitle,
      email: email,
      avatar: metadata.avatar || ROLE_AVATARS[selectedRole] || '/src/assets/images/avatar_rector_alejandro_1794435251468.jpg',
      code: metadata.studentCode || Math.floor(10000 + Math.random() * 90000).toString(),
      studentId: metadata.studentId || null,
      studentGrade: metadata.studentGrade || null
    };

    this.currentUser = user;
    this.isAuthenticated = true;
    localStorage.setItem('ov_active_role', user.role);
    localStorage.setItem('ov_current_user', JSON.stringify(user));

    // Si es personal institucional (Docente, Coordinador, Orientador, Rector, Administrador),
    // agendar automáticamente en el directorio de funcionarios del colegio
    if ([ROLES.DOCENTE, ROLES.COORDINADOR, ROLES.ORIENTADOR, ROLES.RECTOR, ROLES.ADMINISTRADOR].includes(selectedRole)) {
      registerStaffMember({
        name: displayName,
        role: selectedRole,
        roleTitle: roleTitle,
        email: email,
        subject: selectedRole === ROLES.DOCENTE ? 'Docente Titular de Grado Once' : roleTitle
      });
    }

    window.dispatchEvent(new CustomEvent('roleChanged', { detail: this.currentUser }));
    return { success: true, user };
  }

  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem('ov_current_user');
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  canAccessModule(moduleName) {
    const role = this.currentUser.role;
    switch (moduleName) {
      case 'docente_dashboard':
        return [ROLES.DOCENTE, ROLES.COORDINADOR, ROLES.ADMINISTRADOR, ROLES.RECTOR].includes(role);
      case 'new_observation':
        // Únicamente Coordinador y Orientador Escolar tienen permiso de registro disciplinario
        return [ROLES.COORDINADOR, ROLES.ORIENTADOR].includes(role);
      case 'orientation':
        // El administrador no puede hacer observaciones ni remisiones
        return [ROLES.ORIENTADOR, ROLES.COORDINADOR, ROLES.RECTOR].includes(role);
      case 'rector_analytics':
        return [ROLES.RECTOR, ROLES.COORDINADOR].includes(role);
      case 'student_portal':
        return [ROLES.ESTUDIANTE, ROLES.COORDINADOR, ROLES.ADMINISTRADOR].includes(role);
      case 'parent_portal':
        return [ROLES.ACUDIENTE, ROLES.COORDINADOR, ROLES.ADMINISTRADOR].includes(role);
      case 'reports':
        return [ROLES.COORDINADOR, ROLES.RECTOR, ROLES.DOCENTE, ROLES.ADMINISTRADOR].includes(role);
      case 'admin_access':
        return [ROLES.ADMINISTRADOR].includes(role);
      default:
        return false;
    }
  }
}

export const authService = new AuthService();
