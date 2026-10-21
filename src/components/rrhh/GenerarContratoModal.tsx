'use client';

import React, { useState } from 'react';
import { getDatosContratoParaPDF } from '@/app/rrhh_actions';
import { FileDown, Loader2, X, FileText, Eye, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ensureRichHtml } from './PlantillasContratosClient';

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function fechaATextoLargo(fechaInput?: string | Date | null): string {
  if (!fechaInput) return '___ de __________ de 202_';
  const d = typeof fechaInput === 'string' && fechaInput.length === 10
    ? new Date(fechaInput + 'T12:00:00')
    : new Date(fechaInput);
  if (isNaN(d.getTime())) return String(fechaInput);
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

function calcularDuracionTexto(inicio?: string | Date | null, termino?: string | Date | null, tipo?: string): string {
  if (tipo === 'Indefinido' || !termino) return 'carácter indefinido';
  const dIni = new Date(inicio || '');
  const dFin = new Date(termino || '');
  if (isNaN(dIni.getTime()) || isNaN(dFin.getTime())) return 'plazo fijo';
  const diffDays = Math.round((dFin.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24));
  const meses = Math.round(diffDays / 30);
  if (meses >= 1) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  return `${diffDays} días`;
}

function formatoPesos(valor: any): string {
  const num = parseInt(valor) || 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num);
}

export default function GenerarContratoModal({
  trabajadorId,
  contratoId,
  variant = 'button'
}: {
  trabajadorId: number;
  contratoId?: number;
  variant?: 'button' | 'small';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState<any>(null);
  const [plantillaId, setPlantillaId] = useState<number | ''>('');

  const [varsExtra, setVarsExtra] = useState({
    comuna_ciudad: 'Antofagasta',
    bono_cumplimiento: '$100.000',
    bono_responsabilidad: '$300.000',
    duracion: ''
  });

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    const res = await getDatosContratoParaPDF(trabajadorId, contratoId);
    setLoading(false);

    if (res.success && res.data) {
      setDatos(res.data);
      if (res.data.plantillaSugerida) {
        setPlantillaId(res.data.plantillaSugerida.id);
      }
      const dur = calcularDuracionTexto(
        res.data.contrato?.fecha_inicio,
        res.data.contrato?.fecha_termino,
        res.data.contrato?.tipo_contrato
      );
      const hf = res.data.haberesFijos;
      setVarsExtra((prev) => ({
        ...prev,
        bono_cumplimiento: formatoPesos(hf?.bono_cumplimiento ?? 100000),
        bono_responsabilidad: formatoPesos(hf?.bono_responsabilidad ?? 300000),
        duracion: dur
      }));
    } else {
      alert(res.error || 'No fue posible cargar los datos del contrato.');
      setIsOpen(false);
    }
  };

  const plantillaActual = datos?.plantillas?.find((p: any) => p.id === Number(plantillaId)) || datos?.plantillaSugerida;

  const renderizarHtmlContrato = (): string => {
    if (!datos || !plantillaActual) return '';
    const { trabajador: t, contrato: c, haberesFijos: hf } = datos;
    const nombreCompleto = `${t.nombres || ''} ${t.apellido_paterno || ''} ${t.apellido_materno || ''}`.trim();
    const fechaHoyTexto = fechaATextoLargo(new Date());
    const fechaNacTexto = fechaATextoLargo(t.fecha_nacimiento);
    const fechaIniTexto = fechaATextoLargo(c.fecha_inicio);
    const fechaTermTexto = c.fecha_termino ? fechaATextoLargo(c.fecha_termino) : 'Indefinido';

    const reemplazos: Record<string, string> = {
      '{fecha_como_texto}': fechaHoyTexto,
      '{fecha_en_texto}': fechaHoyTexto,
      '{nombre_empleado}': nombreCompleto,
      '{nombre_funcionario}': nombreCompleto,
      '{rut_empleado}': t.rut || '',
      '{nacionalidad_empleado}': t.nacionalidad || 'chilena',
      '{fec_nac_texto}': fechaNacTexto,
      '{dirección_empleado}': t.direccion || 'Antofagasta',
      '{direccion_empleado}': t.direccion || 'Antofagasta',
      '{comuna_ciudad}': varsExtra.comuna_ciudad || 'Antofagasta',
      '{comuna}': varsExtra.comuna_ciudad || 'Antofagasta',
      '{mail_empleado}': t.email || 'sin correo registrado',
      '{cargo_empleado}': c.cargo_nombre || 'Auxiliar de Farmacia',
      '{sucursal_nombre}': c.sucursal_nombre || 'Casa Matriz',
      '{tipo_contrato}': c.tipo_contrato || 'Plazo Fijo',
      '{sueldo_base}': formatoPesos(c.sueldo_base),
      '{bono_cumplimiento}': varsExtra.bono_cumplimiento || '$0',
      '{bono_responsabilidad}': varsExtra.bono_responsabilidad || '$0',
      '{movilizacion}': formatoPesos(hf?.movilizacion || 0),
      '{colacion}': formatoPesos(hf?.colacion || 0),
      '{duración}': varsExtra.duracion || 'plazo fijo',
      '{duracion}': varsExtra.duracion || 'plazo fijo',
      '{fecha_inicio_ctto}': fechaIniTexto,
      '{fecha_termino_ctto}': fechaTermTexto
    };

    let html = ensureRichHtml(plantillaActual.contenido || '');
    for (const [tag, val] of Object.entries(reemplazos)) {
      html = html.split(tag).join(val);
    }
    return html;
  };

  const handleImprimirFormatoExacto = () => {
    if (!datos || !plantillaActual) return;
    const htmlContrato = renderizarHtmlContrato();
    const { trabajador: t } = datos;
    const nombreCompleto = `${t.nombres || ''} ${t.apellido_paterno || ''} ${t.apellido_materno || ''}`.trim();

    const win = window.open('', '_blank', 'width=900,height=800');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Contrato - ${nombreCompleto}</title>
          <style>
            @page { size: letter; margin: 20mm 22mm; }
            body {
              font-family: Georgia, "Times New Roman", serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #111;
            }
            p, div { margin: 0 0 10px 0; }
            h1, h2 { font-size: 13pt; margin: 0 0 14px 0; }
            h3 { font-size: 11.5pt; margin: 12px 0 6px 0; }
            ul, ol { margin: 0 0 10px 24px; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10.5pt; }
            th, td { border: 1px solid #334155; padding: 6px 10px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .firmas {
              margin-top: 65px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .firma-col {
              width: 44%;
              text-align: center;
              border-top: 1px solid #111;
              padding-top: 8px;
              font-size: 9.5pt;
              line-height: 1.35;
            }
          </style>
        </head>
        <body>
          ${htmlContrato}
          <div class="firmas">
            <div class="firma-col">
              <strong>Dayan Barrera Cortés</strong><br/>
              RUT N° 13.421.122-9<br/>
              Rep. Legal Com. Farm. Dayan Barrera Cortés E.I.R.L.<br/>
              RUT N° 76.509.263-9 — EMPLEADOR
            </div>
            <div class="firma-col">
              <strong>${nombreCompleto}</strong><br/>
              RUT N° ${t.rut || ''}<br/>
              TRABAJADOR(A)
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDescargarPDF = () => {
    if (!datos || !plantillaActual) return;
    const htmlFinal = renderizarHtmlContrato();
    const { trabajador: t } = datos;
    const nombreCompleto = `${t.nombres || ''} ${t.apellido_paterno || ''} ${t.apellido_materno || ''}`.trim();

    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 22;
    const maxWidth = pageWidth - marginX * 2;
    let cursorY = 24;

    // Parsear los bloques HTML para respetar negritas, títulos y alineación (izquierda, centro, derecha, justificado)
    const parser = new DOMParser();
    const domDoc = parser.parseFromString(`<div>${htmlFinal}</div>`, 'text/html');
    const root = domDoc.body.firstElementChild || domDoc.body;
    const blocks = Array.from(root.children);

    const renderBlock = (el: Element, idx: number) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) {
        cursorY += 3;
        return;
      }

      const tagName = el.tagName.toUpperCase();
      const styleAttr = (el.getAttribute('style') || '').toLowerCase();
      const alignAttr = (el.getAttribute('align') || '').toLowerCase();

      let align: 'left' | 'center' | 'right' | 'justify' = 'justify';
      if (styleAttr.includes('center') || alignAttr === 'center' || (idx === 0 && text.toUpperCase().startsWith('CONTRATO'))) {
        align = 'center';
      } else if (styleAttr.includes('right') || alignAttr === 'right') {
        align = 'right';
      } else if (styleAttr.includes('left') || alignAttr === 'left') {
        align = 'left';
      }

      const isHeading = tagName === 'H1' || tagName === 'H2' || (idx === 0 && text.toUpperCase().startsWith('CONTRATO'));
      const isSubHeading = tagName === 'H3';
      const hasStrong =
        isHeading ||
        isSubHeading ||
        el.querySelector('strong, b') !== null && (el.querySelector('strong, b')?.textContent?.trim().length || 0) >= text.length * 0.7;

      const matchClausula = text.match(
        /^((?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|SEPTIMO|OCTAVO|NOVENO|DÉCIMO|DECIMO|UNDÉCIMO|UNDECIMO|DUODÉCIMO|DUODECIMO|DECIMOTERCERO|DECIMOCUARTO|DÉCIMO PRIMERO|HABERES IMPONIBLES|HABERES NO IMPONIBLES)[^:]*:?)(.*)$/i
      );

      if (isHeading) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
      } else if (hasStrong || matchClausula) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }

      // Si es una cláusula con encabezado + cuerpo largo, imprimimos el texto completo
      if (matchClausula && matchClausula[2] && matchClausula[2].trim().length > 25) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }

      const wrappedLines = doc.splitTextToSize(text, maxWidth);
      const blockHeight = wrappedLines.length * 5;

      if (cursorY + blockHeight > pageHeight - 25) {
        doc.addPage();
        cursorY = 24;
      }

      if (align === 'center') {
        doc.text(wrappedLines, pageWidth / 2, cursorY, { align: 'center' });
      } else if (align === 'right') {
        doc.text(wrappedLines, pageWidth - marginX, cursorY, { align: 'right' });
      } else if (align === 'justify' && wrappedLines.length > 1) {
        doc.text(wrappedLines, marginX, cursorY, { align: 'justify', maxWidth });
      } else {
        doc.text(wrappedLines, marginX, cursorY);
      }

      cursorY += blockHeight + 2.5;
    };

    if (blocks.length > 0) {
      blocks.forEach((b, idx) => {
        if (b.tagName === 'TABLE') {
          const headRows: string[][] = [];
          const bodyRows: string[][] = [];

          b.querySelectorAll('thead tr').forEach((tr) => {
            const cells = Array.from(tr.querySelectorAll('th, td')).map((c) => (c.textContent || '').trim());
            if (cells.length) headRows.push(cells);
          });

          const trSelector = headRows.length > 0 ? 'tbody tr' : 'tr';
          b.querySelectorAll(trSelector).forEach((tr) => {
            const cells = Array.from(tr.querySelectorAll('td, th')).map((c) => (c.textContent || '').trim());
            if (cells.length) bodyRows.push(cells);
          });

          autoTable(doc, {
            startY: cursorY,
            head: headRows.length > 0 ? headRows : undefined,
            body: bodyRows,
            margin: { left: marginX, right: marginX },
            theme: 'grid',
            styles: {
              font: 'helvetica',
              fontSize: 9.5,
              cellPadding: 2.5,
              textColor: [17, 24, 39],
              lineColor: [71, 85, 105],
              lineWidth: 0.25
            },
            headStyles: {
              fillColor: [241, 245, 249],
              textColor: [15, 23, 42],
              fontStyle: 'bold'
            },
            columnStyles: {
              2: { halign: 'right', fontStyle: 'bold' }
            }
          });

          cursorY = ((doc as any).lastAutoTable?.finalY || cursorY + 25) + 5;
        } else if (b.tagName === 'UL' || b.tagName === 'OL') {
          Array.from(b.children).forEach((li, liIdx) => renderBlock(li, idx + liIdx));
        } else {
          renderBlock(b, idx);
        }
      });
    } else {
      const lines = (root.textContent || '').split('\n');
      lines.forEach((l, i) => {
        const fakeP = domDoc.createElement('p');
        fakeP.textContent = l;
        renderBlock(fakeP, i);
      });
    }

    // Bloque de Firmas al final
    if (cursorY + 45 > pageHeight - 20) {
      doc.addPage();
      cursorY = 35;
    } else {
      cursorY += 26;
    }

    const col1Center = marginX + 42;
    const col2Center = pageWidth - marginX - 42;

    doc.setLineWidth(0.4);
    doc.line(col1Center - 35, cursorY, col1Center + 35, cursorY);
    doc.line(col2Center - 35, cursorY, col2Center + 35, cursorY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Dayan Barrera Cortés', col1Center, cursorY + 5, { align: 'center' });
    doc.text(nombreCompleto, col2Center, cursorY + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('RUT N° 13.421.122-9', col1Center, cursorY + 9.5, { align: 'center' });
    doc.text(`RUT N° ${t.rut || ''}`, col2Center, cursorY + 9.5, { align: 'center' });

    doc.text('Rep. Legal Com. Farm. Dayan Barrera Cortés E.I.R.L.', col1Center, cursorY + 14, { align: 'center' });
    doc.text('TRABAJADOR(A)', col2Center, cursorY + 14, { align: 'center' });

    doc.text('RUT N° 76.509.263-9 — EMPLEADOR', col1Center, cursorY + 18.5, { align: 'center' });

    const safeName = nombreCompleto.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Contrato_${safeName}.pdf`);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          variant === 'small'
            ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors'
            : 'px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-colors'
        }
      >
        <FileDown size={14} />
        Generar Contrato PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Cabecera */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl">
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-base">Generador de Contrato de Trabajo</h3>
                  <p className="text-xs text-slate-500">
                    Reemplazo automático de etiquetas con los datos del colaborador y su contrato vigente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X size={20} />
              </button>
            </div>

            {loading || !datos ? (
              <div className="p-12 flex items-center justify-center gap-3 text-slate-500">
                <Loader2 size={22} className="animate-spin text-emerald-600" />
                <span>Cargando plantilla y datos del trabajador...</span>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto space-y-5 text-left">
                {/* Selector de Plantilla y Variables personalizables */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Plantilla de Contrato (Cargo + Modalidad)
                    </label>
                    <select
                      value={plantillaId}
                      onChange={(e) => setPlantillaId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white"
                    >
                      {datos.plantillas.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.cargo_nombre || 'General'} - {p.tipo_contrato})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Bono Cumplimiento / Resp.
                    </label>
                    <input
                      type="text"
                      value={
                        plantillaActual?.nombre?.toLowerCase().includes('químico') ||
                        plantillaActual?.nombre?.toLowerCase().includes('quimico')
                          ? varsExtra.bono_responsabilidad
                          : varsExtra.bono_cumplimiento
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setVarsExtra((prev) => ({
                          ...prev,
                          bono_cumplimiento: val,
                          bono_responsabilidad: val
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Duración ({'{duración}'})
                    </label>
                    <input
                      type="text"
                      value={varsExtra.duracion}
                      onChange={(e) => setVarsExtra((prev) => ({ ...prev, duracion: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Vista previa del documento enriquecido */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Eye size={14} /> Vista Previa del Contrato Rellenado
                    </span>
                    <span className="text-xs text-slate-500">
                      Trabajador: <strong>{datos.trabajador.nombres} {datos.trabajador.apellido_paterno}</strong> • Sueldo Base:{' '}
                      <strong>{formatoPesos(datos.contrato.sueldo_base)}</strong>
                    </span>
                  </div>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 max-h-96 overflow-y-auto">
                    <div
                      className="w-full max-w-[740px] mx-auto h-fit bg-white shadow-sm border border-slate-200 rounded-lg p-8 font-serif text-xs leading-relaxed text-slate-900 space-y-2.5"
                      dangerouslySetInnerHTML={{ __html: renderizarHtmlContrato() }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !datos}
                onClick={handleImprimirFormatoExacto}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Printer size={17} />
                Imprimir / Guardar con Formato Exacto
              </button>
              <button
                type="button"
                disabled={loading || !datos}
                onClick={handleDescargarPDF}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FileDown size={18} />
                Descargar Contrato en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
