import { getLiquidacionCompleta } from '@/app/rrhh_liquidaciones_actions';
import { ChevronRight, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PrintButton from '@/components/rrhh/PrintButton';

export default async function LiquidacionPage({ params }: { params: { id: string, liq_id: string } }) {
  const { id, liq_id } = await params;
  
  const res = await getLiquidacionCompleta(parseInt(liq_id));
  if (!res.success) {
    notFound();
  }

  const { data: liq } = res;
  const t = liq.trabajador;

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
  };

  const haberesImponibles = liq.detalles.filter((d: any) => d.tipo === 'HABER_IMPONIBLE');
  const haberesNoImponibles = liq.detalles.filter((d: any) => d.tipo === 'HABER_NO_IMPONIBLE');
  const descuentosLegales = liq.detalles.filter((d: any) => d.tipo === 'DESCUENTO_LEGAL');

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 print:hidden">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">RRHH</Link>
        <ChevronRight size={14} />
        <Link href={`/panel/rrhh/${id}`} className="hover:text-blue-600 transition-colors">Ficha Empleado</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Liquidación {liq.periodo}</span>
      </div>

      <div className="flex justify-between items-center print:hidden mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Liquidación de Sueldo</h1>
        <div className="flex gap-2">
          <PrintButton />
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-8 shadow-sm rounded-xl print:shadow-none print:border-none print:p-0">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide">Liquidación de Sueldo</h2>
            <p className="text-slate-600 font-medium">Período: {liq.periodo}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg text-blue-800">Farmacias Bicentenario</h3>
            <p className="text-sm text-slate-500">RUT: 76.123.456-7</p>
          </div>
        </div>

        {/* DATOS TRABAJADOR */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-8">
          <div><span className="font-bold w-24 inline-block">Trabajador:</span> {t.nombres} {t.apellidos}</div>
          <div><span className="font-bold w-24 inline-block">RUT:</span> {t.rut}</div>
          <div><span className="font-bold w-24 inline-block">Cargo:</span> {t.cargo_nombre || 'No asignado'}</div>
          <div><span className="font-bold w-24 inline-block">AFP:</span> {t.afp_nombre || '-'}</div>
          <div><span className="font-bold w-24 inline-block">Días Trab:</span> {liq.dias_trabajados}</div>
          <div><span className="font-bold w-24 inline-block">Salud:</span> {t.salud_nombre || '-'}</div>
        </div>

        {/* DETALLE */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          
          {/* HABERES */}
          <div>
            <h4 className="font-bold bg-slate-100 p-2 text-center border border-slate-300 mb-2">HABERES</h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-xs uppercase text-slate-500 mb-1 border-b border-slate-200">Imponibles</h5>
                {haberesImponibles.map((h: any) => (
                  <div key={h.id} className="flex justify-between text-sm py-1">
                    <span>{h.concepto}</span>
                    <span>{formatoMoneda(h.monto)}</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h5 className="font-bold text-xs uppercase text-slate-500 mb-1 border-b border-slate-200">No Imponibles</h5>
                {haberesNoImponibles.map((h: any) => (
                  <div key={h.id} className="flex justify-between text-sm py-1">
                    <span>{h.concepto}</span>
                    <span>{formatoMoneda(h.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DESCUENTOS */}
          <div>
            <h4 className="font-bold bg-slate-100 p-2 text-center border border-slate-300 mb-2">DESCUENTOS</h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-xs uppercase text-slate-500 mb-1 border-b border-slate-200">Legales</h5>
                {descuentosLegales.map((d: any) => (
                  <div key={d.id} className="flex justify-between text-sm py-1">
                    <span>{d.concepto}</span>
                    <span>{formatoMoneda(d.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* TOTALES */}
        <div className="border-t-2 border-slate-800 pt-4 mt-8 flex flex-col items-end gap-2 text-sm">
          <div className="w-64 flex justify-between">
            <span>Total Imponible:</span>
            <span>{formatoMoneda(liq.total_imponible)}</span>
          </div>
          <div className="w-64 flex justify-between">
            <span>Total No Imponible:</span>
            <span>{formatoMoneda(liq.total_no_imponible)}</span>
          </div>
          <div className="w-64 flex justify-between">
            <span>Total Descuentos:</span>
            <span>{formatoMoneda(liq.total_descuentos)}</span>
          </div>
          <div className="w-64 flex justify-between font-bold text-lg mt-2 bg-slate-100 p-2 border border-slate-300">
            <span>LÍQUIDO A PAGAR:</span>
            <span>{formatoMoneda(liq.liquido_pagar)}</span>
          </div>
        </div>

        {/* FIRMA */}
        <div className="mt-32 flex justify-center pb-8">
          <div className="text-center w-64 border-t border-slate-400 pt-2 text-sm">
            Firma del Trabajador <br/>
            {t.rut}
          </div>
        </div>

      </div>
    </div>
  );
}
