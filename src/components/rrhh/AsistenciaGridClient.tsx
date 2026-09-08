'use client'

import { useState, useEffect, useMemo, useRef } from 'react';
import { getAsistenciaMes, saveAsistenciaDia } from '@/app/rrhh_asistencia_actions';
import { Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Helper para convertir DB fecha a JS Date (evitando desfase de Timezone)
function parseDateDB(dateStr: string | Date) {
  if (typeof dateStr === 'string') return new Date(dateStr + 'T12:00:00');
  return new Date(dateStr.getTime() + Math.abs(dateStr.getTimezoneOffset() * 60000));
}

// Convert tipo ausentismo to letter
function getLetraAusentismo(tipo: string) {
  if (tipo.includes('Vacaciones')) return 'V';
  if (tipo.includes('Licencia')) return 'L';
  return 'P'; // Permiso u otro
}

export default function AsistenciaGridClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enterDirection, setEnterDirection] = useState<'horizontal' | 'vertical'>('vertical');
  
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1); // 1-12
  const [anio, setAnio] = useState(hoy.getFullYear());

  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  
  // Matrix: matrix[trabajador_id][dia] = { valor: 'T', bloqueado: false }
  const [matrix, setMatrix] = useState<Record<number, Record<number, { valor: string, bloqueado: boolean, original: string }>>>({});

  const diasEnMes = new Date(anio, mes, 0).getDate();
  const diasArray = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  const cargarDatos = async () => {
    setLoading(true);
    const res = await getAsistenciaMes(anio, mes);
    if (res.success && res.data) {
      setTrabajadores(res.data.trabajadores);
      
      const newMatrix: any = {};
      res.data.trabajadores.forEach((t: any) => {
        newMatrix[t.id] = {};
        for(let d = 1; d <= diasEnMes; d++) {
          newMatrix[t.id][d] = { valor: '', bloqueado: false, original: '' };
        }
      });

      // Rellenar manual
      res.data.asistencia.forEach((a: any) => {
        if (newMatrix[a.trabajador_id] && newMatrix[a.trabajador_id][a.dia]) {
          newMatrix[a.trabajador_id][a.dia].valor = a.estado;
          newMatrix[a.trabajador_id][a.dia].original = a.estado;
        }
      });

      // Rellenar ausentismos (bloqueantes)
      res.data.ausentismos.forEach((aus: any) => {
        if (!newMatrix[aus.trabajador_id]) return;
        const inicio = parseDateDB(aus.fecha_inicio);
        const fin = parseDateDB(aus.fecha_termino);
        const letra = getLetraAusentismo(aus.tipo);
        
        for(let d = 1; d <= diasEnMes; d++) {
          const fechaDia = new Date(anio, mes - 1, d, 12, 0, 0);
          if (fechaDia >= inicio && fechaDia <= fin) {
            newMatrix[aus.trabajador_id][d].valor = letra;
            newMatrix[aus.trabajador_id][d].bloqueado = true;
          }
        }
      });

      setMatrix(newMatrix);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [mes, anio]);

  const handleMesChange = (delta: number) => {
    let newMes = mes + delta;
    let newAnio = anio;
    if (newMes > 12) { newMes = 1; newAnio++; }
    if (newMes < 1) { newMes = 12; newAnio--; }
    setMes(newMes);
    setAnio(newAnio);
  };

  const handleChange = (tId: number, dia: number, val: string) => {
    const letra = val.toUpperCase().trim();
    // Validar permitidas: T, I, F o vacío
    if (!['T', 'I', 'F', ''].includes(letra)) return;
    
    setMatrix(prev => ({
      ...prev,
      [tId]: {
        ...prev[tId],
        [dia]: { ...prev[tId][dia], valor: letra }
      }
    }));
  };

  const handleBlur = async (tId: number, dia: number) => {
    const celda = matrix[tId][dia];
    if (celda.valor === celda.original) return; // Sin cambios

    setSaving(true);
    const fechaStr = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    const res = await saveAsistenciaDia(tId, fechaStr, celda.valor);
    if (res.success) {
      setMatrix(prev => ({
        ...prev,
        [tId]: {
          ...prev[tId],
          [dia]: { ...prev[tId][dia], original: celda.valor }
        }
      }));
    } else {
      alert("Error al guardar: " + res.error);
      // Revert
      setMatrix(prev => ({
        ...prev,
        [tId]: {
          ...prev[tId],
          [dia]: { ...prev[tId][dia], valor: celda.original }
        }
      }));
    }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, d: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let nextD = d;
      let nextRow = rowIndex;

      if (enterDirection === 'horizontal') {
        nextD += 1;
        if (nextD > diasEnMes) {
          nextD = 1;
          nextRow += 1;
        }
      } else {
        nextRow += 1;
        if (nextRow >= trabajadores.length) {
          nextRow = 0;
          nextD += 1;
        }
      }

      const nextInput = document.getElementById(`input-${nextRow}-${nextD}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        (nextInput as HTMLInputElement).select();
      }
    }
  };

  const getColor = (val: string, bloqueado: boolean) => {
    if (bloqueado) {
      if (val === 'V') return 'bg-sky-100 text-sky-700 cursor-not-allowed';
      if (val === 'L') return 'bg-rose-100 text-rose-700 cursor-not-allowed';
      if (val === 'P') return 'bg-purple-100 text-purple-700 cursor-not-allowed';
      return 'bg-slate-100 text-slate-500 cursor-not-allowed';
    }
    if (val === 'T') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (val === 'I' || val === 'F') return 'bg-red-50 text-red-700 border-red-200 font-bold';
    return 'bg-white text-slate-700 hover:bg-slate-50';
  };

  const getTotales = (tId: number) => {
    let t=0, l=0, v=0, p=0, i=0;
    if (!matrix[tId]) return {t,l,v,p,i};
    for(let d=1; d<=diasEnMes; d++) {
      const val = matrix[tId][d]?.valor;
      if (val === 'T') t++;
      else if (val === 'L') l++;
      else if (val === 'V') v++;
      else if (val === 'P') p++;
      else if (val === 'I' || val === 'F') i++;
    }
    return {t,l,v,p,i};
  };

  const exportToExcel = () => {
    const data = [];
    const header = ['Trabajador', ...diasArray, 'Trab.', 'Inasist.', 'Vac.', 'Lic.', 'Perm.'];
    data.push(header);

    trabajadores.forEach(t => {
      const row: any[] = [`${t.apellido_paterno} ${t.nombres.split(' ')[0]}`];
      for(let d=1; d<=diasEnMes; d++) {
        row.push(matrix[t.id]?.[d]?.valor || '');
      }
      const totales = getTotales(t.id);
      row.push(totales.t, totales.i, totales.v, totales.l, totales.p);
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    XLSX.writeFile(wb, `Asistencia_${MESES[mes-1]}_${anio}.xlsx`);
  };

  if (loading && trabajadores.length === 0) {
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
        
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 rounded"></span> T: Trabajado</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded"></span> I: Inasistencia</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-sky-100 rounded"></span> V: Vacaciones (Auto)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-100 rounded"></span> L: Licencia (Auto)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 rounded"></span> P: Permiso (Auto)</div>
        </div>
      </div>
      
      {/* Tools Row */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="font-medium">Salto al presionar Enter:</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
            <input type="radio" name="enterDirection" checked={enterDirection === 'horizontal'} onChange={() => setEnterDirection('horizontal')} className="accent-blue-600" />
            ➡️ Derecha
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
            <input type="radio" name="enterDirection" checked={enterDirection === 'vertical'} onChange={() => setEnterDirection('vertical')} className="accent-blue-600" />
            ⬇️ Abajo
          </label>
        </div>
        <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-bold transition-colors">
          <Download size={16} />
          Exportar a Excel
        </button>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto w-full relative" style={{ maxHeight: '65vh' }}>
        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-600"/></div>}
        
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-bold sticky left-0 bg-slate-100 z-30 shadow-[1px_0_0_0_#e2e8f0]">Trabajador</th>
              {diasArray.map(d => (
                <th key={d} className="px-1 py-3 font-bold text-center w-8 min-w-[2rem] border-l border-slate-200">{d}</th>
              ))}
              <th className="px-2 py-3 font-bold text-center border-l-2 border-slate-300 text-emerald-700">Trab.</th>
              <th className="px-2 py-3 font-bold text-center border-l border-slate-200 text-red-700">Inasist.</th>
              <th className="px-2 py-3 font-bold text-center border-l border-slate-200 text-sky-700">Vac.</th>
              <th className="px-2 py-3 font-bold text-center border-l border-slate-200 text-rose-700">Lic.</th>
              <th className="px-2 py-3 font-bold text-center border-l border-slate-200 text-purple-700">Perm.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {trabajadores.map((t, rowIndex) => {
              const totales = getTotales(t.id);
              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                    {t.apellido_paterno} {t.nombres.split(' ')[0]}
                  </td>
                  {diasArray.map(d => {
                    const celda = matrix[t.id]?.[d] || { valor: '', bloqueado: false };
                    return (
                      <td key={d} className="p-0 border-l border-slate-200">
                        {celda.bloqueado ? (
                          <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold ${getColor(celda.valor, true)}`} title="Cargado desde ausentismos">
                            {celda.valor}
                          </div>
                        ) : (
                          <input 
                            id={`input-${rowIndex}-${d}`}
                            type="text" 
                            maxLength={1}
                            value={celda.valor}
                            onChange={(e) => handleChange(t.id, d, e.target.value)}
                            onBlur={() => handleBlur(t.id, d)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, d)}
                            className={`w-8 h-8 text-center text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${getColor(celda.valor, false)}`}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-bold border-l-2 border-slate-300 text-emerald-700 bg-emerald-50/50">{totales.t}</td>
                  <td className="px-2 py-2 text-center font-bold border-l border-slate-200 text-red-700 bg-red-50/50">{totales.i}</td>
                  <td className="px-2 py-2 text-center font-medium border-l border-slate-200 text-sky-700 bg-sky-50/50">{totales.v}</td>
                  <td className="px-2 py-2 text-center font-medium border-l border-slate-200 text-rose-700 bg-rose-50/50">{totales.l}</td>
                  <td className="px-2 py-2 text-center font-medium border-l border-slate-200 text-purple-700 bg-purple-50/50">{totales.p}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {saving && <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2 border-t border-slate-100 bg-slate-50"><Loader2 size={12} className="animate-spin" /> Guardando...</div>}
    </div>
  );
}
