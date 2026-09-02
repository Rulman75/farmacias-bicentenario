'use client'

import { useState } from 'react';
import { calcularSimulacionFiniquito, createFiniquito } from '@/app/rrhh_finiquitos_actions';
import { FileSignature, Calculator, Save, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function FiniquitosFormClient({ trabajadores, finiquitos }: { trabajadores: any[], finiquitos: any[] }) {
  const [trabajadorId, setTrabajadorId] = useState('');
  const [fechaTermino, setFechaTermino] = useState(new Date().toISOString().split('T')[0]);
  const [causal, setCausal] = useState('Art. 159 N°1: Mutuo Acuerdo');
  const [estado, setEstado] = useState('BORRADOR');
  const [observacion, setObservacion] = useState('');
  
  const [simulacion, setSimulacion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');

  const causales = [
    'Art. 159 N°1: Mutuo Acuerdo',
    'Art. 159 N°2: Renuncia Voluntaria',
    'Art. 159 N°4: Vencimiento Plazo Convenido',
    'Art. 159 N°5: Conclusión Trabajo o Servicio',
    'Art. 160: Despido Disciplinario (Sin Derecho a Indemnización)',
    'Art. 161: Necesidades de la Empresa'
  ];

  const handleSimular = async () => {
    if (!trabajadorId || !fechaTermino) {
      setError('Seleccione un trabajador y fecha de término.');
      return;
    }
    setError('');
    setSimulating(true);
    const res = await calcularSimulacionFiniquito(parseInt(trabajadorId), fechaTermino, causal);
    if (res.success) {
      setSimulacion(res.data);
    } else {
      setError(res.error || 'Error al calcular simulación');
    }
    setSimulating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulacion) {
      setError('Debe simular primero el finiquito.');
      return;
    }
    
    setError('');
    setLoading(true);

    const res = await createFiniquito({
      trabajador_id: parseInt(trabajadorId),
      fecha_termino: fechaTermino,
      causal_legal: causal,
      anos_servicio: simulacion.anos_servicio,
      vacaciones_pendientes_dias: parseFloat(simulacion.vacaciones_pendientes_dias),
      monto_indemnizacion_anos: simulacion.monto_indemnizacion_anos,
      monto_mes_aviso: simulacion.monto_mes_aviso,
      monto_vacaciones: simulacion.monto_vacaciones,
      total_a_pagar: simulacion.total_a_pagar,
      observacion,
      estado
    });

    if (!res.success) {
      setError(res.error || 'Error al guardar');
    } else {
      setTrabajadorId('');
      setSimulacion(null);
      setObservacion('');
      if (estado === 'FIRMADO') {
        alert('Finiquito emitido. Trabajador dado de baja (INACTIVO).');
        window.location.reload();
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileSignature size={20} className="text-red-600" />
          Emitir Nuevo Finiquito
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trabajador Activo *</label>
            <select 
              value={trabajadorId} 
              onChange={e => { setTrabajadorId(e.target.value); setSimulacion(null); }}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">Seleccione...</option>
              {trabajadores.map(t => (
                <option key={t.id} value={t.id}>{t.rut} - {t.nombres} {t.apellidos}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Causal Legal *</label>
            <select 
              value={causal} 
              onChange={e => { setCausal(e.target.value); setSimulacion(null); }}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              {causales.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Término</label>
            <input 
              type="date" 
              value={fechaTermino} 
              onChange={e => { setFechaTermino(e.target.value); setSimulacion(null); }}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="lg:col-span-4 mt-2">
            <button 
              type="button" 
              onClick={handleSimular}
              disabled={simulating || !trabajadorId} 
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {simulating ? <RefreshCw size={18} className="animate-spin" /> : <Calculator size={18} />}
              Simular Cálculos
            </button>
          </div>
        </div>

        {simulacion && (
          <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-6 animate-in fade-in">
            <h3 className="font-bold text-slate-700 mb-4">Resultado Simulación</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="block text-xs text-slate-500">Años Servicio</span>
                <span className="font-bold text-lg">{simulacion.anos_servicio}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="block text-xs text-slate-500">Vac. Pendientes (días)</span>
                <span className="font-bold text-lg">{simulacion.vacaciones_pendientes_dias}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="block text-xs text-slate-500">Monto Años ($)</span>
                <input 
                  type="number" 
                  value={simulacion.monto_indemnizacion_anos} 
                  onChange={e => setSimulacion({...simulacion, monto_indemnizacion_anos: parseInt(e.target.value) || 0})}
                  className="w-full font-bold text-lg bg-transparent border-b border-slate-300 focus:border-red-500 outline-none"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="block text-xs text-slate-500">Mes de Aviso ($)</span>
                <input 
                  type="number" 
                  value={simulacion.monto_mes_aviso} 
                  onChange={e => setSimulacion({...simulacion, monto_mes_aviso: parseInt(e.target.value) || 0})}
                  className="w-full font-bold text-lg bg-transparent border-b border-slate-300 focus:border-red-500 outline-none"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="block text-xs text-slate-500">Vacaciones ($)</span>
                <input 
                  type="number" 
                  value={simulacion.monto_vacaciones} 
                  onChange={e => setSimulacion({...simulacion, monto_vacaciones: parseInt(e.target.value) || 0})}
                  className="w-full font-bold text-lg bg-transparent border-b border-slate-300 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado de Emisión</label>
                <select 
                  value={estado} 
                  onChange={e => setEstado(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="BORRADOR">Borrador (Solo cálculo previo)</option>
                  <option value="FIRMADO">Firmado Definitivo (Da de baja al trabajador)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <input 
                  type="text" 
                  value={observacion} 
                  onChange={e => setObservacion(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                  placeholder="Opcional..."
                />
              </div>
              <div className="text-right">
                <span className="block text-sm font-bold text-red-800">Total a Pagar</span>
                <span className="text-3xl font-black text-red-600">
                  ${ (simulacion.monto_indemnizacion_anos + simulacion.monto_mes_aviso + simulacion.monto_vacaciones).toLocaleString('es-CL') }
                </span>
              </div>
              <div>
                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                  <Save size={20} />
                  {loading ? 'Guardando...' : 'Registrar Finiquito'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Historial de Finiquitos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium">Fecha Emisión</th>
                <th className="p-4 font-medium">RUT</th>
                <th className="p-4 font-medium">Trabajador</th>
                <th className="p-4 font-medium">Causal</th>
                <th className="p-4 font-medium text-right">Total Pagado</th>
                <th className="p-4 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {finiquitos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No hay finiquitos registrados.</td>
                </tr>
              ) : (
                finiquitos.map(f => (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4">{formatDate(f.fecha_emision)}</td>
                    <td className="p-4 font-medium">{f.rut}</td>
                    <td className="p-4">{f.nombres} {f.apellidos}</td>
                    <td className="p-4 text-xs">{f.causal_legal}</td>
                    <td className="p-4 text-right font-bold text-slate-700">${Number(f.total_a_pagar).toLocaleString('es-CL')}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${f.estado === 'FIRMADO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {f.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
