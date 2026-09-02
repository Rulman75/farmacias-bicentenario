
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ChevronRight, FileSignature } from 'lucide-react';
import FiniquitosFormClient from '@/components/rrhh/FiniquitosFormClient';
import { getTrabajadores } from '@/app/rrhh_actions';
import { getFiniquitos } from '@/app/rrhh_finiquitos_actions';

export default async function FiniquitosPage() {
  const [tRes, fRes] = await Promise.all([
    getTrabajadores('', 'ACTIVO'),
    getFiniquitos()
  ]);

  const trabajadores = tRes.success ? (tRes.data as any[]) : [];
  const finiquitos = fRes.success ? (fRes.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-red-600 transition-colors">RRHH</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Cálculo de Finiquitos</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="bg-red-600 p-3 rounded-xl text-white shadow-lg shadow-red-600/20">
          <FileSignature size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cálculo de Finiquitos</h1>
          <p className="text-slate-500">Gestión de términos de contrato e indemnizaciones</p>
        </div>
      </div>

      <FiniquitosFormClient 
        trabajadores={trabajadores} 
        finiquitos={finiquitos} 
      />
    </div>
  );
}
