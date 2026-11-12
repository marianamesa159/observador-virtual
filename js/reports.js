/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * INSTITUTO UNIVERSITARIO DE CALDAS - OBSERVADOR VIRTUAL
 * Módulo Generador de Reportes Disciplinarios y de Convivencia Escolar (Grados 11-1 a 11-4)
 */

import { store } from './supabase.js';

export function renderReportsModule(container) {
  const students = store.students || [];
  const observations = store.observations || [];
  const commitments = store.commitments || [];

  // Conteo por grado
  const countsByGrade = {
    '11-1': { total: 0, conv: 0, acad: 0, meri: 0 },
    '11-2': { total: 0, conv: 0, acad: 0, meri: 0 },
    '11-3': { total: 0, conv: 0, acad: 0, meri: 0 },
    '11-4': { total: 0, conv: 0, acad: 0, meri: 0 }
  };

  const studentGradeMap = {};
  students.forEach(s => {
    studentGradeMap[s.id] = s.grade;
  });

  observations.forEach(o => {
    const gr = studentGradeMap[o.studentId];
    if (gr && countsByGrade[gr]) {
      countsByGrade[gr].total++;
      if (o.subtype === 'Positiva') countsByGrade[gr].meri++;
      else if (o.type === 'Convivencial') countsByGrade[gr].conv++;
      else countsByGrade[gr].acad++;
    }
  });

  const totalObs = observations.length;
  const faltasConv = observations.filter(o => o.type === 'Convivencial' && o.subtype === 'Negativa').length;
  const faltasAcad = observations.filter(o => o.type === 'Académica' && o.subtype === 'Negativa').length;
  const meritos = observations.filter(o => o.subtype === 'Positiva').length;

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Observador Digital: Generador de Reportes Oficiales</h1>
        <p class="page-subtitle">Informes estadísticos y actas para Consejo Directivo, Comités de Convivencia y Rectoría (Grados 11-1 a 11-4)</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-primary" id="btn-export-pdf">
          📄 Generar / Imprimir Reporte Oficial
        </button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 320px 1fr; gap: 24px;">
      <!-- Panel de Filtros Masivos (Boceto Figura 8) -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px;">
        <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--primary-900); letter-spacing: 0.5px; margin-bottom: 16px;">
          FILTRADO DE DATOS MASIVOS
        </h3>

        <!-- Grados Oficiales 11-1 a 11-4 -->
        <div style="margin-bottom: 18px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">
            GRADOS EDUCATIVOS (GRADO ONCE)
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="chk-g111" checked /> Grado 11-1
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="chk-g112" checked /> Grado 11-2
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="chk-g113" checked /> Grado 11-3
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="chk-g114" checked /> Grado 11-4
            </label>
          </div>
        </div>

        <!-- Jornadas -->
        <div style="margin-bottom: 18px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">
            JORNADAS ACADÉMICAS
          </label>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" checked /> Jornada Mañana (11-1, 11-2)
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" checked /> Jornada Tarde (11-3, 11-4)
            </label>
          </div>
        </div>

        <!-- Tipos de Falta -->
        <div style="margin-bottom: 20px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">
            TIPOLOGÍA SEGÚN MANUAL
          </label>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" checked /> Situaciones Tipo I (Llamados de atención)
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" checked /> Situaciones Tipo II (Faltas Graves)
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" checked /> Reconocimientos / Méritos formativos
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" checked /> Casos remitidos a Orientación Escolar
            </label>
          </div>
        </div>

        <button class="btn-primary" style="width: 100%; justify-content: center;" id="btn-update-preview">
          🔄 Aplicar Filtros Dinámicos
        </button>
      </div>

      <!-- Vista Previa del Reporte Generado -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; gap: 20px;">
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 16px; font-weight: 800; color: var(--primary-900); text-transform: uppercase;">
              REPORTE DE CONVIVENCIA ESCOLAR — GRADOS 11-1, 11-2, 11-3, 11-4
            </h2>
            <div style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">
              Instituto Universitario de Caldas · Año Lectivo 2026 · Total estudiantes: ${students.length} · Observaciones: ${totalObs}
            </div>
          </div>
          <button class="btn-secondary" onclick="window.print()" style="font-size: 12px;">
            🖨️ Imprimir Formato Físico
          </button>
        </div>

        <!-- Gráfico Comparativo por Grados 11-1 a 11-4 -->
        <div>
          <h4 style="font-size: 13px; font-weight: 700; color: var(--primary-900); margin-bottom: 12px;">
            Distribución de Registros por Curso (11-1, 11-2, 11-3, 11-4)
          </h4>
          <div class="css-bar-chart" style="height: 180px;">
            ${['11-1', '11-2', '11-3', '11-4'].map(gr => {
              const count = countsByGrade[gr].total;
              const maxCount = Math.max(1, ...Object.values(countsByGrade).map(c => c.total));
              const heightPct = count > 0 ? Math.max(25, Math.round((count / maxCount) * 100)) : 10;
              return `
                <div class="bar-column">
                  <div class="bar-fill-duo" style="height: ${heightPct}%; background: ${count > 0 ? 'var(--primary-600)' : '#cbd5e1'};"></div>
                  <span class="bar-label"><strong>${gr}</strong> (${count} reg.)</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Tabla de Resumen por Grado y Tipología -->
        <div>
          <h4 style="font-size: 13px; font-weight: 700; color: var(--primary-900); margin-bottom: 8px;">
            Balance Disciplinario por Salón de Clases
          </h4>
          <table class="permissions-table">
            <thead>
              <tr>
                <th>Grado</th>
                <th>Jornada</th>
                <th>Faltas Convivencia</th>
                <th>Faltas Académicas</th>
                <th>Méritos / Reconocimientos</th>
                <th>Total en Folios</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>11-1</strong></td>
                <td>Mañana</td>
                <td>${countsByGrade['11-1'].conv}</td>
                <td>${countsByGrade['11-1'].acad}</td>
                <td><span style="color: var(--success-700); font-weight: 700;">${countsByGrade['11-1'].meri}</span></td>
                <td><strong>${countsByGrade['11-1'].total}</strong></td>
              </tr>
              <tr>
                <td><strong>11-2</strong></td>
                <td>Mañana</td>
                <td>${countsByGrade['11-2'].conv}</td>
                <td>${countsByGrade['11-2'].acad}</td>
                <td><span style="color: var(--success-700); font-weight: 700;">${countsByGrade['11-2'].meri}</span></td>
                <td><strong>${countsByGrade['11-2'].total}</strong></td>
              </tr>
              <tr>
                <td><strong>11-3</strong></td>
                <td>Tarde</td>
                <td>${countsByGrade['11-3'].conv}</td>
                <td>${countsByGrade['11-3'].acad}</td>
                <td><span style="color: var(--success-700); font-weight: 700;">${countsByGrade['11-3'].meri}</span></td>
                <td><strong>${countsByGrade['11-3'].total}</strong></td>
              </tr>
              <tr>
                <td><strong>11-4</strong></td>
                <td>Tarde</td>
                <td>${countsByGrade['11-4'].conv}</td>
                <td>${countsByGrade['11-4'].acad}</td>
                <td><span style="color: var(--success-700); font-weight: 700;">${countsByGrade['11-4'].meri}</span></td>
                <td><strong>${countsByGrade['11-4'].total}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--border-subtle); padding: 14px; border-radius: var(--radius-sm); font-size: 12px; color: var(--text-muted); line-height: 1.5;">
          Reporte institucional consolidado conforme al Manual de Convivencia y los procedimientos del debido proceso formativo. Válido para entrega a Rectoría, Coordinación y Acudientes.
        </div>
      </div>
    </div>
  `;

  const btnExport = container.querySelector('#btn-export-pdf');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      window.print();
    });
  }

  const btnUpdate = container.querySelector('#btn-update-preview');
  if (btnUpdate) {
    btnUpdate.addEventListener('click', () => {
      window.showToast('✓ Vista previa de reporte actualizada.');
    });
  }
}
