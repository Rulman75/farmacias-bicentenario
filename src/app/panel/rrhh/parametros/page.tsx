import { getParametrosMensuales, getAfps } from '@/app/rrhh_actions';
import { Calculator, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ParametrosFormClient from '@/components/rrhh/ParametrosFormClient';

export default async function ParametrosPage({ searchParams }: { searchParams: { periodo?: string } }) {
  // Get current YYYY-MM
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const sp = await searchParams;
  const periodo = sp.periodo || currentPeriod;

  const [paramRes, afpRes] = await Promise.all([
    getParametrosMensuales(periodo),
    getAfps()
  ]);

  const parametros = paramRes.success ? paramRes.data : null;
  const afps = afpRes.success ? (afpRes.data as any[]) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Parámetros Mensuales</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-purple-600 p-3 rounded-xl text-white shadow-lg shadow-purple-600/20">
          <Calculator size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Indicadores Previred y SII</h1>
          <p className="text-slate-500">Configuración de variables legales para el cálculo de remuneraciones.</p>
        </div>
      </div>

      <ParametrosFormClient initialPeriodo={periodo} initialData={parametros} />

      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Tasas y Comisiones AFP (Referencial)</h3>
        <p className="text-sm text-slate-500 mb-4">Estas tasas se configuran en el mantenedor de AFPs, pero aplican para el cálculo de este mes.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {afps.map(afp => (
            <div key={afp.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="font-bold text-slate-700">{afp.nombre}</p>
              <p className="text-lg font-mono text-purple-600 mt-1">{afp.tasa_comision}%</p>
              <p className="text-xs text-slate-400 mt-1">Total a descontar: {(10 + parseFloat(afp.tasa_comision)).toFixed(2)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
