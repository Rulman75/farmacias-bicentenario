import LREExportClient from '@/components/rrhh/LREExportClient';
import Link from 'next/link';
import { ChevronRight, FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LREPage() {
  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Libro de Remuneraciones</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-emerald-600 p-3 rounded-xl text-white shadow-lg shadow-emerald-600/20">
          <FileSpreadsheet size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Libro de Remuneraciones (LRE)</h1>
          <p className="text-slate-500">Documento obligatorio para la Dirección del Trabajo y auditoría contable.</p>
        </div>
      </div>

      <LREExportClient />
    </div>
  );
}
