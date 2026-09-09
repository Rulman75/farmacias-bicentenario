'use client';

import { useState, useEffect } from 'react';
import { getCartolaVacaciones } from '@/app/rrhh_vacaciones_actions';
import { PlaneTakeoff, CalendarDays, Calculator, ArrowRight, Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CartolaVacacionesProps {
  trabajadorId: number;
  nombreCompleto: string;
  rut: string;
}

export default function CartolaVacacionesClient({ trabajadorId, nombreCompleto, rut }: CartolaVacacionesProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    loadData();
  }, [trabajadorId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCartolaVacaciones(trabajadorId);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Error al cargar vacaciones');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const descargarComprobante = () => {
    if (!data) return;
    setDescargando(true);
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Cartola de Vacaciones (Feriado Legal)', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Trabajador: ${nombreCompleto}`, 20, 40);
    doc.text(`RUT: ${rut}`, 20, 48);
    doc.text(`Fecha de Ingreso Base: ${data.fecha_ingreso}`, 20, 56);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}`, 20, 64);

    autoTable(doc, {
      startY: 80,
      head: [['Concepto', 'Días Hábiles']],
      body: [
        ['Días Acumulados a la fecha (1.25 / mes)', data.dias_ganados],
        ['Días Tomados', data.dias_tomados],
        ['Saldo Disponible', data.saldo]
      ],
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.setFontSize(10);
    doc.text('_____________________________', 105, 150, { align: 'center' });
    doc.text('Firma Trabajador', 105, 155, { align: 'center' });
    
    doc.save(`Cartola_Vacaciones_${rut}.pdf`);
    setDescargando(false);
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={24}/></div>;
  }
  if (error) {
    return <div className="p-4 text-sm text-amber-600 bg-amber-50 rounded-xl">No hay información de contrato para calcular vacaciones.</div>;
  }
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlaneTakeoff size={20} className="text-sky-600" />
          <h3 className="font-bold text-slate-800">Feriado Legal / Vacaciones</h3>
        </div>
        <button 
          onClick={descargarComprobante}
          disabled={descargando}
          className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
        >
          {descargando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Cartola PDF
        </button>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 shrink-0">
            <Calculator size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Días Acumulados</p>
            <p className="text-2xl font-bold text-slate-800">{data.dias_ganados}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600 shrink-0">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Días Tomados</p>
            <p className="text-2xl font-bold text-slate-800">{data.dias_tomados}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 border-l pl-6 border-slate-100">
          <div className="bg-sky-100 p-3 rounded-xl text-sky-600 shrink-0">
            <ArrowRight size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">Saldo Disponible</p>
            <p className="text-3xl font-black text-sky-600">{data.saldo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
