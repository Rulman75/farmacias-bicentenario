'use client';

import { useState, useMemo } from 'react';
import { saveTurnoDia } from '@/app/rrhh_planificacion_actions';
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PlanificadorTurnosClient({ 
  initialTrabajadores, 
  initialAsignaciones,
  turnosCatalog,
  sucursales
}: { 
  initialTrabajadores: any[], 
  initialAsignaciones: any[],
  turnosCatalog: any[],
  sucursales: any[]
}) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroSucursal, setFiltroSucursal] = useState<string>('');

  // Matrix: matrix[trabajador_id][dia] = turno_id
  const [matrix, setMatrix] = useState<Record<number, Record<number, number | null>>>(() => {
    const m: any = {};
    initialTrabajadores.forEach(t => { m[t.id] = {}; });
    initialAsignaciones.forEach(a => {
      if (!m[a.trabajador_id]) m[a.trabajador_id] = {};
      m[a.trabajador_id][a.dia] = a.turno_id;
    });
    return m;
  });

  const trabajadoresFiltrados = useMemo(() => {
    if (!filtroSucursal) return initialTrabajadores;
    return initialTrabajadores.filter(t => t.cod_sucursal?.toString() === filtroSucursal);
  }, [initialTrabajadores, filtroSucursal]);

  const diasEnMes = new Date(anio, mes, 0).getDate();
  const diasArray = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  const getSucursalNombre = (cod: number) => {
    return sucursales.find(s => s.cod_sucursal === cod)?.nombre || 'Sin Asignar';
  };

  const handleMesChange = async (delta: number) => {
    let newMes = mes + delta;
    let newAnio = anio;
    if (newMes > 12) { newMes = 1; newAnio++; }
    if (newMes < 1) { newMes = 12; newAnio--; }
    
    setLoading(true);
    setMes(newMes);
    setAnio(newAnio);
    
    const { getPlanificacionMes } = await import('@/app/rrhh_planificacion_actions');
    const res: any = await getPlanificacionMes(newAnio, newMes);
    if (res.success) {
      const m: any = {};
      (res.trabajadores || []).forEach((t: any) => { m[t.id] = {}; });
      (res.asignaciones || []).forEach((a: any) => {
        if (!m[a.trabajador_id]) m[a.trabajador_id] = {};
        m[a.trabajador_id][a.dia] = a.turno_id;
      });
      setMatrix(m);
    }
    setLoading(false);
  };

  const handleChange = async (tId: number, dia: number, valStr: string) => {
    const turnoId = valStr === '' ? null : parseInt(valStr);
    
    // Update local state immediately for snappy UI
    setMatrix(prev => ({
      ...prev,
      [tId]: {
        ...prev[tId],
        [dia]: turnoId
      }
    }));

    // Fire background save
    setSaving(true);
    const fechaStr = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    const res = await saveTurnoDia(tId, fechaStr, turnoId);
    if (!res.success) {
      alert("Error al guardar: " + res.error);
    }
    setSaving(false);
  };

  const calcularTotales = (tId: number) => {
    let turnosCount = 0;
    let horasTotal = 0;
    if (!matrix[tId]) return { turnosCount, horasTotal };

    for(let d=1; d<=diasEnMes; d++) {
      const tIdVal = matrix[tId][d];
      if (tIdVal) {
        const turnoDef = turnosCatalog.find(t => t.id === tIdVal);
        if (turnoDef) {
          turnosCount++;
          horasTotal += parseFloat(turnoDef.total_horas || 0);
        }
      }
    }
    return { turnosCount, horasTotal };
  };

  const exportToExcel = () => {
    const data = [];
    const header = ['Trabajador', 'Local', ...diasArray, 'Total Turnos', 'Total Horas'];
    data.push(header);

    trabajadoresFiltrados.forEach(t => {
      const row: any[] = [
        `${t.apellido_paterno} ${t.nombres.split(' ')[0]}`,
        getSucursalNombre(t.cod_sucursal)
      ];
      for(let d=1; d<=diasEnMes; d++) {
        const turnoId = matrix[t.id]?.[d];
        const turnoDef = turnoId ? turnosCatalog.find(tc => tc.id === turnoId) : null;
        row.push(turnoDef ? turnoDef.codigo : '');
      }
      const totales = calcularTotales(t.id);
      row.push(totales.turnosCount, totales.horasTotal);
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planificador');
    XLSX.writeFile(wb, `Planificador_PartTime_${MESES[mes-1]}_${anio}.xlsx`);
  };

  if (loading && initialTrabajadores.length === 0) {
    return <div className="p-12 flex justify-center text-blue-600"><Loader2 size={32} className="animate-spin" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => handleMesChange(-1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={18} className="text-slate-600"/>
          </button>
          <div className="w-40 text-center">
            <h2 className="font-bold text-slate-800 text-lg uppercase">{MESES[mes-1]} {anio}</h2>
          </div>
          <button onClick={() => handleMesChange(1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronRight size={18} className="text-slate-600"/>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={filtroSucursal} 
            onChange={e => setFiltroSucursal(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 bg-white"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map(s => (
              <option key={s.cod_sucursal} value={s.cod_sucursal}>{s.nombre}</option>
            ))}
          </select>

          <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-bold transition-colors">
            <Download size={16} />
            Planilla de Firmas
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto w-full relative" style={{ maxHeight: '65vh' }}>
        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-600"/></div>}
        
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-bold sticky left-0 bg-slate-100 z-30 shadow-[1px_0_0_0_#e2e8f0]">Trabajador</th>
              {diasArray.map(d => (
                <th key={d} className="px-1 py-3 font-bold text-center w-12 min-w-[3rem] border-l border-slate-200">{d}</th>
              ))}
              <th className="px-3 py-3 font-bold text-center border-l-2 border-slate-300 text-blue-700 bg-blue-50">Turnos</th>
              <th className="px-3 py-3 font-bold text-center border-l border-slate-200 text-emerald-700 bg-emerald-50">Hrs Mes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {trabajadoresFiltrados.length === 0 && (
              <tr><td colSpan={diasEnMes + 3} className="p-8 text-center text-slate-500">No hay trabajadores Part-Time registrados en esta sucursal.</td></tr>
            )}
            
            {trabajadoresFiltrados.map(t => {
              const totales = calcularTotales(t.id);
              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                    <div className="font-medium text-slate-800">{t.apellido_paterno} {t.nombres.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{getSucursalNombre(t.cod_sucursal)}</div>
                  </td>
                  {diasArray.map(d => {
                    const selectedVal = matrix[t.id]?.[d] || '';
                    return (
                      <td key={d} className="p-0 border-l border-slate-200">
                        <select 
                          value={selectedVal || ''}
                          onChange={(e) => handleChange(t.id, d, e.target.value)}
                          className={`w-full h-10 text-center text-xs font-bold appearance-none cursor-pointer outline-none transition-colors 
                            ${selectedVal ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-transparent text-transparent hover:bg-slate-50'}
                          `}
                        >
                          <option value=""></option>
                          {turnosCatalog.map(tc => (
                            <option key={tc.id} value={tc.id}>{tc.codigo}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-bold border-l-2 border-slate-300 text-blue-700 bg-blue-50/50">{totales.turnosCount}</td>
                  <td className="px-3 py-2 text-center font-bold border-l border-slate-200 text-emerald-700 bg-emerald-50/50">{totales.horasTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {saving && <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2 border-t border-slate-100 bg-slate-50"><Loader2 size={12} className="animate-spin" /> Guardando en vivo...</div>}
    </div>
  );
}
