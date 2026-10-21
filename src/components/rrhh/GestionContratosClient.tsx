'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileSignature, AlertTriangle, CheckCircle, Clock, Search, MapPin, User, ExternalLink } from 'lucide-react';
import ContratoFormClient from './ContratoFormClient';
import GenerarContratoModal from './GenerarContratoModal';

const formatoMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0);
};

export default function GestionContratosClient({
  registros,
  cargos,
  sucursales
}: {
  registros: any[];
  cargos: any[];
  sucursales: any[];
}) {
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const kpis = useMemo(() => {
    let indefinidos = 0;
    let plazoFijo = 0;
    let porVencer = 0;
    let sinContrato = 0;

    registros.forEach((r) => {
      if (!r.contrato_id) {
        sinContrato++;
      } else if (r.tipo_contrato === 'Indefinido') {
        indefinidos++;
      } else if (r.tipo_contrato === 'Plazo Fijo') {
        plazoFijo++;
        if (r.dias_restantes !== null && r.dias_restantes <= 30) {
          porVencer++;
        }
      }
    });

    return { indefinidos, plazoFijo, porVencer, sinContrato };
  }, [registros]);

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      const texto = `${r.nombres} ${r.apellido_paterno} ${r.apellido_materno || ''} ${r.rut} ${r.cargo_nombre || ''} ${r.sucursal_nombre || ''}`.toLowerCase();
      if (search && !texto.includes(search.toLowerCase())) return false;

      if (filtroTipo === 'SIN_CONTRATO') return !r.contrato_id;
      if (filtroTipo === 'POR_VENCER') return r.tipo_contrato === 'Plazo Fijo' && r.dias_restantes !== null && r.dias_restantes <= 30;
      if (filtroTipo !== 'TODOS') return r.tipo_contrato === filtroTipo;
      return true;
    });
  }, [registros, search, filtroTipo]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setFiltroTipo(filtroTipo === 'SIN_CONTRATO' ? 'TODOS' : 'SIN_CONTRATO')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filtroTipo === 'SIN_CONTRATO' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200' : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Sin Contrato Activo</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{kpis.sinContrato}</p>
          <p className="text-xs text-slate-500 mt-1">Pendientes de escrituración</p>
        </button>

        <button
          onClick={() => setFiltroTipo(filtroTipo === 'POR_VENCER' ? 'TODOS' : 'POR_VENCER')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filtroTipo === 'POR_VENCER' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Plazo Fijo ≤ 30 días</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{kpis.porVencer}</p>
          <p className="text-xs text-slate-500 mt-1">Requieren renovación o aviso</p>
        </button>

        <button
          onClick={() => setFiltroTipo(filtroTipo === 'Plazo Fijo' ? 'TODOS' : 'Plazo Fijo')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filtroTipo === 'Plazo Fijo' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Total Plazo Fijo</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{kpis.plazoFijo}</p>
          <p className="text-xs text-slate-500 mt-1">Contratos temporales vigentes</p>
        </button>

        <button
          onClick={() => setFiltroTipo(filtroTipo === 'Indefinido' ? 'TODOS' : 'Indefinido')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filtroTipo === 'Indefinido' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Contratos Indefinidos</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{kpis.indefinidos}</p>
          <p className="text-xs text-slate-500 mt-1">Dotación permanente</p>
        </button>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RUT, cargo o sucursal..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['TODOS', 'SIN_CONTRATO', 'POR_VENCER', 'Indefinido', 'Plazo Fijo', 'Part-Time', 'Honorarios'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltroTipo(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filtroTipo === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'TODOS' ? 'Todos' : f === 'SIN_CONTRATO' ? 'Sin Contrato' : f === 'POR_VENCER' ? 'Por Vencer' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Contratos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6 font-semibold">Trabajador</th>
                <th className="py-3.5 px-6 font-semibold">Cargo / Sucursal</th>
                <th className="py-3.5 px-6 font-semibold">Modalidad</th>
                <th className="py-3.5 px-6 font-semibold">Vigencia</th>
                <th className="py-3.5 px-6 font-semibold text-right">Sueldo Base / Valor</th>
                <th className="py-3.5 px-6 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron registros para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filtrados.map((r) => {
                  const sinContrato = !r.contrato_id;
                  const porVencer = r.tipo_contrato === 'Plazo Fijo' && r.dias_restantes !== null && r.dias_restantes <= 30;
                  const vencido = r.tipo_contrato === 'Plazo Fijo' && r.dias_restantes !== null && r.dias_restantes < 0;

                  return (
                    <tr key={r.trabajador_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <Link
                          href={`/panel/rrhh/${r.trabajador_id}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                        >
                          {r.nombres} {r.apellido_paterno} {r.apellido_materno || ''}
                          <ExternalLink size={13} className="text-slate-400" />
                        </Link>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{r.rut}</p>
                      </td>

                      <td className="py-4 px-6">
                        {sinContrato ? (
                          <span className="text-xs italic text-slate-400">No asignado</span>
                        ) : (
                          <>
                            <p className="font-semibold text-slate-700">{r.cargo_nombre || 'Sin cargo'}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={12} /> {r.sucursal_nombre || 'Casa Matriz'}
                            </p>
                          </>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {sinContrato ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            SIN CONTRATO
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              r.tipo_contrato === 'Indefinido'
                                ? 'bg-emerald-100 text-emerald-700'
                                : r.tipo_contrato === 'Plazo Fijo'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {r.tipo_contrato}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {sinContrato ? (
                          <span className="text-xs text-rose-600 font-medium">Requiere ingreso de contrato</span>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs text-slate-600">
                              Inicio: <span className="font-medium text-slate-800">{new Date(r.fecha_inicio).toLocaleDateString('es-CL')}</span>
                            </p>
                            {r.fecha_termino && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600">
                                  Término: <span className="font-medium text-slate-800">{new Date(r.fecha_termino).toLocaleDateString('es-CL')}</span>
                                </span>
                                {porVencer && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                                      vencido || r.dias_restantes <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}
                                  >
                                    <Clock size={11} />
                                    {vencido ? `Vencido (${Math.abs(r.dias_restantes)}d)` : `${r.dias_restantes} días`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                        {sinContrato ? '-' : formatoMoneda(r.sueldo_base)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!sinContrato && (
                            <GenerarContratoModal
                              trabajadorId={r.trabajador_id}
                              contratoId={r.contrato_id}
                              variant="small"
                            />
                          )}
                          <ContratoFormClient
                            trabajadorId={r.trabajador_id}
                            cargos={cargos}
                            sucursales={sucursales}
                            initialData={
                              sinContrato
                                ? undefined
                                : {
                                    id: r.contrato_id,
                                    cargo_id: r.cargo_id,
                                    cod_sucursal: r.cod_sucursal,
                                    fecha_inicio: r.fecha_inicio,
                                    fecha_termino: r.fecha_termino,
                                    tipo_contrato: r.tipo_contrato,
                                    sueldo_base: r.sueldo_base
                                  }
                            }
                          >
                            <button
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                sinContrato
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
                              }`}
                            >
                              {sinContrato ? '+ Crear Contrato' : 'Editar / Renovar'}
                            </button>
                          </ContratoFormClient>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
