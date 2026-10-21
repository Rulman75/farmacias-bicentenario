'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getHaberesDescuentosPeriodo, saveHaberDescuentoPeriodo } from '@/app/rrhh_actions';
import {
  Calculator,
  Search,
  Save,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  DollarSign
} from 'lucide-react';

const formatoMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0);
};

export default function HaberesDescuentosMesClient() {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [periodo, setPeriodo] = useState(currentPeriod);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    const res = await getHaberesDescuentosPeriodo(periodo);
    if (res.success && res.data) {
      setRows(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const handleFieldChange = (trabajadorId: number, field: string, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.trabajador_id !== trabajadorId) return r;
        const updated = { ...r, [field]: value };
        // Si cambia horas_extras, sugerimos automáticamente el monto con factor legal 50% (0.0077777 * sueldo_base)
        if (field === 'horas_extras') {
          const hrs = parseFloat(value) || 0;
          const sueldoBase = parseFloat(r.sueldo_base) || 0;
          updated.monto_horas_extras = Math.round(sueldoBase * 0.0077777 * hrs);
        }
        return updated;
      })
    );
  };

  const handleSaveRow = async (row: any) => {
    setSavingId(row.trabajador_id);
    setSavedId(null);

    const payload = {
      colacion: parseInt(row.colacion) || 0,
      movilizacion: parseInt(row.movilizacion) || 0,
      plan_isapre_uf: parseFloat(row.plan_isapre_uf) || 0,
      bono_imponible: parseInt(row.bono_imponible) || 0,
      comisiones: parseInt(row.comisiones) || 0,
      horas_extras: parseFloat(row.horas_extras) || 0,
      monto_horas_extras: parseInt(row.monto_horas_extras) || 0,
      asignacion_familiar: parseInt(row.asignacion_familiar) || 0,
      otros_no_imponibles: parseInt(row.otros_no_imponibles) || 0,
      prestamo_ccaf: parseInt(row.prestamo_ccaf) || 0,
      otros_descuentos: parseInt(row.otros_descuentos) || 0,
      observacion: row.observacion || ''
    };

    const res = await saveHaberDescuentoPeriodo(row.trabajador_id, periodo, payload);
    setSavingId(null);

    if (res.success) {
      setSavedId(row.trabajador_id);
      setTimeout(() => setSavedId(null), 2500);
    } else {
      alert(res.error || 'Error al guardar haberes y descuentos');
    }
  };

  const filtrados = useMemo(() => {
    return rows.filter((r) => {
      const txt = `${r.nombres} ${r.apellido_paterno} ${r.apellido_materno || ''} ${r.rut} ${r.cargo_nombre || ''}`.toLowerCase();
      return !search || txt.includes(search.toLowerCase());
    });
  }, [rows, search]);

  const resumen = useMemo(() => {
    return filtrados.reduce(
      (acc, r) => {
        acc.imponiblesVar += (parseInt(r.bono_imponible) || 0) + (parseInt(r.comisiones) || 0) + (parseInt(r.monto_horas_extras) || 0);
        acc.noImponibles += (parseInt(r.colacion) || 0) + (parseInt(r.movilizacion) || 0) + (parseInt(r.asignacion_familiar) || 0) + (parseInt(r.otros_no_imponibles) || 0);
        acc.descuentosVar += (parseInt(r.prestamo_ccaf) || 0) + (parseInt(r.otros_descuentos) || 0);
        return acc;
      },
      { imponiblesVar: 0, noImponibles: 0, descuentosVar: 0 }
    );
  }, [filtrados]);

  return (
    <div className="space-y-6">
      {/* Barra de Período y Resumen */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Período de Remuneraciones
            </label>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="relative w-full sm:w-80 pt-0 sm:pt-5">
            <Search size={18} className="absolute left-3.5 top-1/2 sm:top-[calc(50%+10px)] -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar trabajador o RUT..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex gap-4 text-sm">
            <div className="bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl">
              <p className="text-[11px] text-emerald-700 font-bold uppercase">Variables Imponibles</p>
              <p className="font-black text-emerald-800">{formatoMoneda(resumen.imponiblesVar)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 px-3.5 py-2 rounded-xl">
              <p className="text-[11px] text-blue-700 font-bold uppercase">No Imponibles</p>
              <p className="font-black text-blue-800">{formatoMoneda(resumen.noImponibles)}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-xl">
              <p className="text-[11px] text-rose-700 font-bold uppercase">Dctos. Varios</p>
              <p className="font-black text-rose-800">{formatoMoneda(resumen.descuentosVar)}</p>
            </div>
          </div>

          <Link
            href="/panel/rrhh/periodo"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
          >
            Ir a Proceso de Liquidaciones
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Tabla interactiva */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-3 text-slate-500">
            <Loader2 size={22} className="animate-spin text-emerald-600" />
            <span>Cargando nómina del período {periodo}...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-semibold">Trabajador</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Sueldo Base</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Haberes Fijos (Col/Mov)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Imponibles Mes (Bonos/Com/H.E.)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Otros No Imp.</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Dctos. Varios</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtrados.map((r) => {
                  const isExpanded = expandedId === r.trabajador_id;
                  const fijosTotal = (parseInt(r.colacion) || 0) + (parseInt(r.movilizacion) || 0);
                  const impVarTotal =
                    (parseInt(r.bono_imponible) || 0) +
                    (parseInt(r.comisiones) || 0) +
                    (parseInt(r.monto_horas_extras) || 0);
                  const noImpVarTotal =
                    (parseInt(r.asignacion_familiar) || 0) + (parseInt(r.otros_no_imponibles) || 0);
                  const dctosVarTotal =
                    (parseInt(r.prestamo_ccaf) || 0) + (parseInt(r.otros_descuentos) || 0);

                  return (
                    <React.Fragment key={r.trabajador_id}>
                      <tr
                        className={`transition-colors ${
                          isExpanded ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">
                            {r.nombres} {r.apellido_paterno} {r.apellido_materno || ''}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{r.rut}</span>
                            <span>•</span>
                            <span>{r.cargo_nombre || 'Sin cargo'}</span>
                            {r.tipo_contrato && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                                {r.tipo_contrato}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-700">
                          {r.sueldo_base ? formatoMoneda(r.sueldo_base) : <span className="text-rose-500 text-xs">Sin contrato</span>}
                        </td>

                        <td className="py-4 px-4 text-right font-mono text-slate-700">
                          {formatoMoneda(fijosTotal)}
                          {parseFloat(r.plan_isapre_uf) > 0 && (
                            <div className="text-[11px] text-blue-600 font-semibold">
                              Isapre: {Number(r.plan_isapre_uf).toFixed(2)} UF
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right font-mono">
                          <span className={impVarTotal > 0 ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                            {formatoMoneda(impVarTotal)}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-mono">
                          <span className={noImpVarTotal > 0 ? 'font-bold text-blue-600' : 'text-slate-400'}>
                            {formatoMoneda(noImpVarTotal)}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-mono">
                          <span className={dctosVarTotal > 0 ? 'font-bold text-rose-600' : 'text-slate-400'}>
                            {formatoMoneda(dctosVarTotal)}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {savedId === r.trabajador_id && (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Guardado
                              </span>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : r.trabajador_id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                isExpanded
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  Cerrar <ChevronUp size={14} />
                                </>
                              ) : (
                                <>
                                  Asignar / Editar <ChevronDown size={14} />
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Columna 1: Haberes Fijos y Previsión */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
                                  1. Haberes Fijos Permanentes
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Colación Mensual ($)</label>
                                    <input
                                      type="number"
                                      value={r.colacion}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'colacion', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Movilización Mensual ($)</label>
                                    <input
                                      type="number"
                                      value={r.movilizacion}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'movilizacion', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Plan Isapre Pactado (UF) {r.salud_nombre ? `— ${r.salud_nombre}` : ''}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.0001"
                                    value={r.plan_isapre_uf}
                                    onChange={(e) => handleFieldChange(r.trabajador_id, 'plan_isapre_uf', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                  />
                                </div>
                              </div>

                              {/* Columna 2: Haberes Variables del Mes */}
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-100 pb-2">
                                  2. Haberes Variables del Mes ({periodo})
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Comisiones Venta ($)</label>
                                    <input
                                      type="number"
                                      value={r.comisiones}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'comisiones', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Bono Imponible ($)</label>
                                    <input
                                      type="number"
                                      value={r.bono_imponible}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'bono_imponible', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Cant. Horas Extras (50%)</label>
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={r.horas_extras}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'horas_extras', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Monto Horas Extras ($)</label>
                                    <input
                                      type="number"
                                      value={r.monto_horas_extras}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'monto_horas_extras', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Asignación Familiar ($)</label>
                                    <input
                                      type="number"
                                      value={r.asignacion_familiar}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'asignacion_familiar', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Aguinaldo / Otros No Imp. ($)</label>
                                    <input
                                      type="number"
                                      value={r.otros_no_imponibles}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'otros_no_imponibles', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Columna 3: Descuentos Varios del Mes y Guardado */}
                              <div className="bg-white p-4 rounded-xl border border-rose-200 flex flex-col justify-between space-y-3">
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 border-b border-rose-100 pb-2">
                                    3. Descuentos Adicionales ({periodo})
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Préstamo CCAF ($)</label>
                                      <input
                                        type="number"
                                        value={r.prestamo_ccaf}
                                        onChange={(e) => handleFieldChange(r.trabajador_id, 'prestamo_ccaf', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Otros Descuentos ($)</label>
                                      <input
                                        type="number"
                                        value={r.otros_descuentos}
                                        onChange={(e) => handleFieldChange(r.trabajador_id, 'otros_descuentos', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Observación / Glosa</label>
                                    <input
                                      type="text"
                                      placeholder="Ej: Bono meta sucursal / Dcto farmacia..."
                                      value={r.observacion}
                                      onChange={(e) => handleFieldChange(r.trabajador_id, 'observacion', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRow(r)}
                                    disabled={savingId === r.trabajador_id}
                                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                  >
                                    {savingId === r.trabajador_id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Save size={16} />
                                    )}
                                    Guardar Haberes y Descuentos
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
