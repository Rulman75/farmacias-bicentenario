'use client'
import { Download } from 'lucide-react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
    >
      <Download size={16} />
      Exportar PDF / Imprimir
    </button>
  );
}
