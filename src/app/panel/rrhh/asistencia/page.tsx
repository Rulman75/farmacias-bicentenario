import AsistenciaGridClient from '@/components/rrhh/AsistenciaGridClient';
import { CalendarDays } from 'lucide-react';

export default function AsistenciaPage() {
  return (
    <div className="w-full mx-auto space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <CalendarDays size={32} className="text-blue-600" />
          Control de Asistencia
        </h1>
        <p className="text-slate-500 mt-1">Planilla mensual interactiva. Los cambios se guardan automáticamente al escribir.</p>
      </div>

      <div className="flex-1">
        <AsistenciaGridClient />
      </div>
    </div>
  );
}
