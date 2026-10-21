'use client';

import React, { useState, useRef, useEffect } from 'react';
import { savePlantillaContrato, deletePlantillaContrato } from '@/app/rrhh_actions';
import {
  Plus,
  Save,
  Trash2,
  Loader2,
  Tag,
  Edit3,
  CheckCircle2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  RemoveFormatting,
  Table
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const TAGS_DISPONIBLES = [
  { tag: '{fecha_como_texto}', desc: 'Fecha actual en texto (ej: 21 de octubre de 2026)' },
  { tag: '{nombre_empleado}', desc: 'Nombre completo del trabajador' },
  { tag: '{rut_empleado}', desc: 'RUT del trabajador' },
  { tag: '{nacionalidad_empleado}', desc: 'Nacionalidad del trabajador' },
  { tag: '{fec_nac_texto}', desc: 'Fecha de nacimiento en texto' },
  { tag: '{dirección_empleado}', desc: 'Dirección particular' },
  { tag: '{comuna_ciudad}', desc: 'Comuna / Ciudad' },
  { tag: '{mail_empleado}', desc: 'Correo electrónico del trabajador' },
  { tag: '{cargo_empleado}', desc: 'Nombre del cargo asignado' },
  { tag: '{sucursal_nombre}', desc: 'Nombre de la sucursal asignada' },
  { tag: '{sueldo_base}', desc: 'Sueldo base formateado ($)' },
  { tag: '{bono_cumplimiento}', desc: 'Bono de cumplimiento ($)' },
  { tag: '{bono_responsabilidad}', desc: 'Bono de responsabilidad Q.F. ($)' },
  { tag: '{movilizacion}', desc: 'Asignación de movilización ($)' },
  { tag: '{colacion}', desc: 'Asignación de colación ($)' },
  { tag: '{duración}', desc: 'Duración del contrato (ej: 3 meses / indefinido)' },
  { tag: '{fecha_inicio_ctto}', desc: 'Fecha de inicio del contrato en texto' },
  { tag: '{fecha_termino_ctto}', desc: 'Fecha de término del contrato en texto' }
];

// Convierte texto plano heredado a HTML enriquecido con formato legal (título centrado, cláusulas en negrita y párrafos justificados)
export function ensureRichHtml(raw: string): string {
  if (!raw) return '';
  if (/<(p|div|table|strong|b|u|em|ul|ol|h1|h2|h3|br|span)\b/i.test(raw)) {
    return raw;
  }

  const lines = raw.split('\n');
  const htmlParts: string[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    if (idx === 0 && line.toUpperCase().startsWith('CONTRATO')) {
      htmlParts.push(
        `<p style="text-align: center; margin-bottom: 14px;"><strong><u>${line}</u></strong></p>`
      );
      return;
    }

    const matchClausula = line.match(
      /^((?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|SEPTIMO|OCTAVO|NOVENO|DÉCIMO|DECIMO|UNDÉCIMO|UNDECIMO|DUODÉCIMO|DUODECIMO|DECIMOTERCERO|DECIMOCUARTO|DÉCIMO PRIMERO|HABERES IMPONIBLES|HABERES NO IMPONIBLES)[^:]*:?)(.*)$/i
    );

    if (matchClausula) {
      const head = matchClausula[1];
      const rest = matchClausula[2];
      htmlParts.push(
        `<p style="text-align: justify; margin-bottom: 8px;"><strong>${head}</strong>${rest}</p>`
      );
      return;
    }

    if (line.startsWith('- ')) {
      htmlParts.push(
        `<p style="text-align: justify; margin-left: 18px; margin-bottom: 4px;">• ${line.slice(2)}</p>`
      );
      return;
    }

    htmlParts.push(`<p style="text-align: justify; margin-bottom: 10px;">${line}</p>`);
  });

  return htmlParts.join('\n');
}

export default function PlantillasContratosClient({
  plantillas,
  cargos
}: {
  plantillas: any[];
  cargos: any[];
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(plantillas[0]?.id || null);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const initialPlantilla = plantillas.find((p) => p.id === selectedId) || plantillas[0] || null;

  const [form, setForm] = useState({
    id: initialPlantilla?.id || undefined,
    nombre: initialPlantilla?.nombre || '',
    cargo_id: initialPlantilla?.cargo_id || '',
    tipo_contrato: initialPlantilla?.tipo_contrato || 'Plazo Fijo',
    contenido: ensureRichHtml(initialPlantilla?.contenido || '')
  });

  // Cargar el HTML dentro del editor contentEditable cuando cambia la plantilla seleccionada
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = form.contenido;
    }
  }, [selectedId]);

  const guardarSeleccionActual = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restaurarSeleccion = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const syncEditorState = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setForm((prev) => ({ ...prev, contenido: html }));
    }
  };

  const execCmd = (command: string, value?: string) => {
    restaurarSeleccion();
    document.execCommand(command, false, value);
    guardarSeleccionActual();
    syncEditorState();
  };

  const handleSelectPlantilla = (p: any) => {
    const rich = ensureRichHtml(p.contenido || '');
    setSelectedId(p.id);
    setForm({
      id: p.id,
      nombre: p.nombre,
      cargo_id: p.cargo_id || '',
      tipo_contrato: p.tipo_contrato || 'Plazo Fijo',
      contenido: rich
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = rich;
    }
    savedRangeRef.current = null;
    setSavedOk(false);
  };

  const handleNuevaPlantilla = () => {
    const nuevoHtml = ensureRichHtml(
      'CONTRATO INDIVIDUAL DE TRABAJO\n\nEn Antofagasta, a {fecha_como_texto}, entre COMERCIAL FARMACÉUTICA DAYAN BARRERA CORTÉS E.I.R.L., RUT N° 76.509.263-9, y don/doña {nombre_empleado}, RUT N° {rut_empleado}, domiciliado(a) en {dirección_empleado}, comuna de {comuna_ciudad}, correo electrónico {mail_empleado}, se conviene el siguiente contrato de trabajo:\n\nPRIMERO: Cargo y funciones.\nEl trabajador se desempeñará como {cargo_empleado} en {sucursal_nombre}.\n\nSEGUNDO: Remuneraciones.\n- Sueldo Base: {sueldo_base}\n- Movilización: {movilizacion}\n- Colación: {colacion}\n\nTERCERO: Vigencia.\nEl presente contrato regirá desde el {fecha_inicio_ctto} hasta el {fecha_termino_ctto}.'
    );
    setSelectedId(null);
    setForm({
      id: undefined,
      nombre: 'Nueva Plantilla de Contrato',
      cargo_id: cargos[0]?.id || '',
      tipo_contrato: 'Plazo Fijo',
      contenido: nuevoHtml
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = nuevoHtml;
    }
    savedRangeRef.current = null;
    setSavedOk(false);
  };

  const handleInsertTag = (tag: string) => {
    restaurarSeleccion();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      document.execCommand('insertText', false, tag);
    } else if (editorRef.current) {
      editorRef.current.innerHTML += ` ${tag}`;
    }
    guardarSeleccionActual();
    syncEditorState();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedOk(false);

    const htmlActual = editorRef.current ? editorRef.current.innerHTML : form.contenido;

    const res = await savePlantillaContrato({
      id: form.id,
      nombre: form.nombre,
      cargo_id: form.cargo_id ? Number(form.cargo_id) : null,
      tipo_contrato: form.tipo_contrato,
      contenido: htmlActual
    });

    setSaving(false);
    if (res.success) {
      setSavedOk(true);
      router.refresh();
    } else {
      alert(res.error || 'Error al guardar la plantilla');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla de contrato?')) return;
    const res = await deletePlantillaContrato(id);
    if (res.success) {
      router.refresh();
      if (plantillas.length > 1) {
        const next = plantillas.find((p) => p.id !== id);
        if (next) handleSelectPlantilla(next);
      }
    } else {
      alert(res.error || 'Error al eliminar');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Lista de Plantillas y Etiquetas */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Plantillas Configuradas</h3>
            <button
              type="button"
              onClick={handleNuevaPlantilla}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={14} /> Nueva Plantilla
            </button>
          </div>

          <div className="space-y-2.5">
            {plantillas.map((p) => {
              const active = selectedId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlantilla(p)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    active
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-100'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-800 text-sm">{p.nombre}</div>
                    {active && <Edit3 size={15} className="text-blue-600 shrink-0 mt-0.5" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                      Cargo: {p.cargo_nombre || 'Todos'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.tipo_contrato === 'Indefinido'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {p.tipo_contrato}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Etiquetas (Tags) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={16} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Etiquetas Dinámicas (Tags)</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Ubica el cursor en el documento y haz clic en cualquier etiqueta para insertarla:
          </p>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {TAGS_DISPONIBLES.map((item) => (
              <button
                key={item.tag}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertTag(item.tag)}
                className="w-full text-left p-2 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between gap-2 group"
              >
                <code className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded group-hover:bg-blue-100">
                  {item.tag}
                </code>
                <span className="text-[11px] text-slate-500 text-right">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Editor Enriquecido tipo Word */}
      <div className="lg:col-span-8">
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {form.id ? 'Editor de Plantilla de Contrato' : 'Crear Nueva Plantilla de Contrato'}
              </h2>
              <p className="text-xs text-slate-500">
                Personaliza el formato (negritas, subrayado, alineación izquierda, centro, derecha o justificado) tal como aparecerá en el PDF.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {form.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(form.id!)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Guardar Plantilla
              </button>
            </div>
          </div>

          {savedOk && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Plantilla guardada correctamente con su formato enriquecido.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre de la Plantilla *</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Cargo Asociado</label>
              <select
                value={form.cargo_id}
                onChange={(e) => setForm((prev) => ({ ...prev, cargo_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Cualquier Cargo (Genérico) --</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tipo de Contrato *</label>
              <select
                value={form.tipo_contrato}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo_contrato: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Plazo Fijo">Plazo Fijo</option>
                <option value="Indefinido">Indefinido</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Honorarios">Honorarios</option>
              </select>
            </div>
          </div>

          {/* CONTENEDOR DEL EDITOR TIPO WORD */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-slate-100">
            {/* Barra de Herramientas (Toolbar) */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
              {/* Deshacer / Rehacer */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('undo')}
                title="Deshacer (Ctrl+Z)"
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <Undo size={16} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('redo')}
                title="Rehacer (Ctrl+Y)"
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <Redo size={16} />
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1" />

              {/* Estilos de Texto (Negrita, Cursiva, Subrayado) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('bold')}
                title="Negrita (Ctrl+B)"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 font-bold transition-colors"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('italic')}
                title="Cursiva (Ctrl+I)"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('underline')}
                title="Subrayado (Ctrl+U)"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <Underline size={16} />
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1" />

              {/* Alineación de Párrafo (Izquierda, Centro, Derecha, Justificado) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('justifyLeft')}
                title="Alinear a la Izquierda"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <AlignLeft size={16} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('justifyCenter')}
                title="Centrar"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <AlignCenter size={16} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('justifyRight')}
                title="Alinear a la Derecha"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <AlignRight size={16} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('justifyFull')}
                title="Justificar Párrafo"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <AlignJustify size={16} />
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1" />

              {/* Tamaño / Encabezado */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('formatBlock', 'H2')}
                title="Título Principal"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-blue-100 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Heading1 size={15} /> Título
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('formatBlock', 'H3')}
                title="Subtítulo / Cláusula"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-blue-100 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Heading2 size={15} /> Subtítulo
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('formatBlock', 'P')}
                title="Párrafo Normal"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Type size={15} /> Normal
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1" />

              {/* Listas */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('insertUnorderedList')}
                title="Lista con Viñetas"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('insertOrderedList')}
                title="Lista Numerada"
                className="p-2 rounded-lg text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <ListOrdered size={16} />
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1" />

              {/* Limpiar Formato */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('removeFormat')}
                title="Quitar formato del texto seleccionado"
                className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <RemoveFormatting size={16} />
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1" />

              {/* Insertar Tabla de Remuneraciones */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const tablaHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;"><thead><tr style="background-color: #f1f5f9;"><th style="border: 1px solid #334155; padding: 7px 10px; text-align: left; font-weight: bold;">Concepto</th><th style="border: 1px solid #334155; padding: 7px 10px; text-align: left; font-weight: bold;">Naturaleza</th><th style="border: 1px solid #334155; padding: 7px 10px; text-align: right; font-weight: bold;">Monto</th></tr></thead><tbody><tr><td style="border: 1px solid #334155; padding: 6px 10px;">Sueldo base</td><td style="border: 1px solid #334155; padding: 6px 10px;">Imponible</td><td style="border: 1px solid #334155; padding: 6px 10px; text-align: right; font-weight: bold;">{sueldo_base}</td></tr><tr><td style="border: 1px solid #334155; padding: 6px 10px;">Bono de cumplimiento</td><td style="border: 1px solid #334155; padding: 6px 10px;">Imponible</td><td style="border: 1px solid #334155; padding: 6px 10px; text-align: right;">Hasta {bono_cumplimiento}</td></tr><tr><td style="border: 1px solid #334155; padding: 6px 10px;">Asignación de movilización</td><td style="border: 1px solid #334155; padding: 6px 10px;">No imponible</td><td style="border: 1px solid #334155; padding: 6px 10px; text-align: right;">{movilizacion}</td></tr><tr><td style="border: 1px solid #334155; padding: 6px 10px;">Asignación de colación</td><td style="border: 1px solid #334155; padding: 6px 10px;">No imponible</td><td style="border: 1px solid #334155; padding: 6px 10px; text-align: right;">{colacion}</td></tr></tbody></table>`;
                  execCmd('insertHTML', tablaHtml);
                }}
                title="Insertar Tabla de Remuneraciones (Concepto / Naturaleza / Monto)"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition-colors"
              >
                <Table size={14} /> Tabla Remuneraciones
              </button>
            </div>

            {/* Hoja de Papel Editable */}
            <div className="p-4 sm:p-8 max-h-[680px] overflow-y-auto bg-slate-100">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onKeyUp={guardarSeleccionActual}
                onMouseUp={guardarSeleccionActual}
                onInput={syncEditorState}
                className="w-full max-w-[780px] mx-auto h-fit min-h-[620px] bg-white shadow-md border border-slate-200 rounded-lg px-8 sm:px-14 py-10 font-serif text-[13.5px] leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
