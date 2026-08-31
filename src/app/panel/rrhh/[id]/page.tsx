import { getTrabajadorById, getCargos, getSucursalesRRHH } from '@/app/rrhh_actions';
import { User, ChevronRight, Briefcase, FileText, FileSignature, MapPin } from 'lucide-react';
import Link from 'next/link';
import ContratoFormClient from '@/components/rrhh/ContratoFormClient';

export default async function TrabajadorPerfilPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const res = await getTrabajadorById(parseInt(id));
  
  if (!res.success) {
    return (
      <div className="p-10 text-center text-slate-500">
        Trabajador no encontrado. <Link href="/panel/rrhh" className="text-blue-600 underline">Volver</Link>
      </div>
    );
  }

  const t = res.data;
  
  const [cargosRes, sucRes] = await Promise.all([
    getCargos(),
    getSucursalesRRHH()
  ]);

  const cargos = cargosRes.success ? (cargosRes.data as any[]) : [];
  const sucursales = sucRes.success ? (sucRes.data as any[]) : [];

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Ficha Empleado</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Columna Izquierda: Datos Personales */}
        <div className="md:w-1/3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <User size={48} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{t.nombres} {t.apellidos}</h2>
              <p className="text-slate-500 font-mono text-sm mt-1">{t.rut}</p>
              <div className="mt-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {t.estado}
                </span>
                <Link 
                  href={`/panel/rrhh/${t.id}/editar`}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contacto</p>
                <p className="text-sm font-medium text-slate-700">{t.email || 'Sin email'}</p>
                <p className="text-sm text-slate-600">{t.telefono || 'Sin teléfono'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección</p>
                <p className="text-sm text-slate-700">{t.direccion || 'No registrada'}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Previsión</p>
                <p className="text-sm text-slate-700 font-medium">AFP: <span className="font-normal">{t.afp_nombre || '-'}</span></p>
                <p className="text-sm text-slate-700 font-medium mt-1">Salud: <span className="font-normal">{t.salud_nombre || '-'}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Contratos y Docs */}
        <div className="md:w-2/3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Briefcase size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">Historial Contractual</h3>
              </div>
              <ContratoFormClient 
                trabajadorId={t.id} 
                cargos={cargos} 
                sucursales={sucursales} 
              />
            </div>
            <div className="p-0">
              {t.contratos && t.contratos.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {t.contratos.map((c: any) => (
                    <div key={c.id} className={`p-6 flex flex-col md:flex-row justify-between gap-4 ${c.estado === 'ACTIVO' ? 'bg-blue-50/30' : 'opacity-70'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-slate-800 text-lg">{c.cargo_nombre}</h4>
                          {c.estado === 'ACTIVO' && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">VIGENTE</span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin size={16} className="text-slate-400" />
                            {c.sucursal_nombre || 'Sin sucursal asignada'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <FileSignature size={16} className="text-slate-400" />
                            {c.tipo_contrato}
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:text-right">
                        <p className="text-sm font-medium text-slate-500">Sueldo Base</p>
                        <p className="font-bold text-slate-800 text-lg">{formatoMoneda(c.sueldo_base)}</p>
                        <div className="mt-2 text-xs text-slate-500">
                          <p>Desde: {new Date(c.fecha_inicio).toLocaleDateString()}</p>
                          {c.fecha_termino && <p>Hasta: {new Date(c.fecha_termino).toLocaleDateString()}</p>}
                        </div>
                        {c.estado === 'ACTIVO' && (
                          <div className="mt-3 flex justify-end">
                            <ContratoFormClient 
                              trabajadorId={t.id} 
                              cargos={cargos} 
                              sucursales={sucursales}
                              initialData={c}
                            >
                              <button className="text-xs font-bold text-slate-500 hover:text-blue-600 underline">
                                Editar Contrato
                              </button>
                            </ContratoFormClient>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>Este trabajador no tiene contratos registrados aún.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
