import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
      <h2 className="text-xl font-medium text-slate-600 animate-pulse">Cargando información...</h2>
      <p className="text-slate-400">Consultando base de datos</p>
    </div>
  );
}
