/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo de Dashboard Analítico de Rectoría (Grados 11-1, 11-2, 11-3, 11-4)
 */

import { store } from './supabase.js';
import { authService } from './auth.js';

export function renderRectorDashboard(container) {
  const currentUser = authService.getCurrentUser();
  const students = store.students || [];
  const observations = store.observations || [];
  const commitments = store.commitments || [];

  const totalFaltas = observations.filter(o => o.subtype === 'Negativa').length;
  const totalMeritos = observations.filter(o => o.subtype === 'Positiva').length;
  const totalCommitments = commitments.filter(c => c.status === 'Activo').length;
  const criticalCases = students.filter(s => (s.faltas || 0) >= 2).length;

  // Conteo por grado
  const countsByGrade = {
    '11-1': { comunes: 0, graves: 0, total: 0 },
    '11-2': { comunes: 0, graves: 0, total: 0 },
    '11-3': { comunes: 0, graves: 0, total: 0 },
    '11-4': { comunes: 0, graves: 0, total: 0 }
  };

  const studentGradeMap = {};
  students.forEach(s => {
    studentGradeMap[s.id] = s.grade;
  });

  observations.forEach(o => {
    const gr = studentGradeMap[o.studentId];
    if (gr && countsByGrade[gr]) {
      countsByGrade[gr].total++;
      if (o.severity === 'Tipo II' || o.severity === 'Tipo III') {
        countsByGrade[gr].graves++;
      } else {
        countsByGrade[gr].comunes++;
      }
    }
  });

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Observador Digital: Dashboard Analítico de Rectoría</h1>
        <p class="page-subtitle">Monitoreo ejecutivo de convivencia escolar — Grados 11-1, 11-2, 11-3 y 11-4 (Año 2026)</p>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; background: var(--bg-surface); padding: 8px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <img 
          src="${currentUser.avatar || '/src/assets/images/avatar_rector_alejandro_1794435251468.jpg'}" 
          alt="${currentUser.name}" 
          style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" 
        />
        <div>
          <div style="font-weight: 700; font-size: 14px; color: var(--primary-900);">${currentUser.fullName}</div>
          <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">ROL: RECTORÍA INSTITUCIONAL</div>
        </div>
      </div>
    </div>

    <!-- Tarjetas KPI Superiores (Boceto Figura 10) -->
    <div class="rector-stats-grid">
      <div class="stat-kpi-card">
        <div class="stat-kpi-num" style="color: var(--danger-700);">${totalFaltas}</div>
        <div class="stat-kpi-label">Faltas Totales Registradas</div>
      </div>

      <div class="stat-kpi-card">
        <div class="stat-kpi-num" style="color: var(--success-700);">${totalCommitments}</div>
        <div class="stat-kpi-label">Compromisos Formativos Vigentes</div>
      </div>

      <div class="stat-kpi-card">
        <div class="stat-kpi-num" style="color: var(--warning-700);">${criticalCases}</div>
        <div class="stat-kpi-label">Casos en Seguimiento de Convivencia</div>
      </div>
    </div>

    <!-- Gráficos Analíticos -->
    <div class="rector-charts-grid">
      <!-- 1. Faltas por Grado: Comparación 11-1 a 11-4 -->
      <div class="chart-card">
        <div class="chart-header">
          <span>Incidencias por Grado (11-1 · 11-2 · 11-3 · 11-4)</span>
          <div style="display: flex; gap: 12px; font-size: 11px;">
            <span style="display: flex; align-items: center; gap: 4px;">
              <span style="width: 10px; height: 10px; background: var(--primary-600); display: inline-block; border-radius: 2px;"></span>
              Situaciones Tipo I
            </span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <span style="width: 10px; height: 10px; background: var(--danger-700); display: inline-block; border-radius: 2px;"></span>
              Situaciones Tipo II / III
            </span>
          </div>
        </div>

        <div class="css-bar-chart" style="height: 220px;">
          ${['11-1', '11-2', '11-3', '11-4'].map(gr => {
            const data = countsByGrade[gr];
            const maxVal = Math.max(1, ...Object.values(countsByGrade).map(c => c.total));
            const heightPct = data.total > 0 ? Math.max(30, Math.round((data.total / maxVal) * 100)) : 12;
            const commonPct = data.total > 0 ? Math.round((data.comunes / data.total) * 100) : 100;
            const gravePct = 100 - commonPct;

            return `
              <div class="bar-column">
                <div class="bar-fill-duo" style="height: ${heightPct}%;">
                  <div class="bar-part-common" style="height: ${commonPct}%;"></div>
                  <div class="bar-part-grave" style="height: ${gravePct}%;"></div>
                </div>
                <span class="bar-label"><strong>${gr}</strong> (${data.total})</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 2. Tipos de Situaciones: Distribución Porcentual -->
      <div class="chart-card">
        <div class="chart-header">
          <span>Clasificación Institucional según Manual</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
              <span>Faltas de Convivencia (Llamados de atención)</span>
              <strong>${totalFaltas > 0 ? Math.round((totalFaltas / (totalFaltas + totalMeritos || 1)) * 100) : 0}%</strong>
            </div>
            <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
              <div style="width: ${totalFaltas > 0 ? Math.round((totalFaltas / (totalFaltas + totalMeritos || 1)) * 100) : 0}%; height: 100%; background: var(--primary-600);"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
              <span>Méritos y Reconocimientos Positivos</span>
              <strong style="color: var(--success-700);">${totalMeritos > 0 ? Math.round((totalMeritos / (totalFaltas + totalMeritos || 1)) * 100) : 0}%</strong>
            </div>
            <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
              <div style="width: ${totalMeritos > 0 ? Math.round((totalMeritos / (totalFaltas + totalMeritos || 1)) * 100) : 0}%; height: 100%; background: var(--success-600);"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
              <span>Compromisos Formativos Activos</span>
              <strong>${totalCommitments} acuerdos</strong>
            </div>
            <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
              <div style="width: ${Math.min(100, totalCommitments * 15)}%; height: 100%; background: #0284c7;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón Central de Acción de Rectoría -->
    <div style="margin-top: 24px; text-align: center;">
      <button class="btn-primary" id="btn-rector-detailed-report" style="padding: 12px 28px; font-size: 14px;">
        VER INFORME DETALLADO DE CONVIVENCIA ESCOLAR
      </button>
    </div>
  `;

  const btnDetailed = container.querySelector('#btn-rector-detailed-report');
  if (btnDetailed) {
    btnDetailed.addEventListener('click', () => {
      window.navigateToModule('reports');
    });
  }
}
