const fs = require('fs');
const path = require('path');

const routes = [
  'src/app/panel/rrhh/pendientes',
  'src/app/panel/rrhh/termino',
  'src/app/panel/rrhh/finiquito',
  'src/app/panel/rrhh/licencias',
  'src/app/panel/rrhh/permisos',
  'src/app/panel/rrhh/vacaciones',
  'src/app/panel/rrhh/bienestar',
  'src/app/panel/rrhh/anticipos',
  'src/app/panel/rrhh/periodo',
  'src/app/panel/rrhh/haberes-descuentos',
  'src/app/panel/rrhh/reportes/liquidaciones',
  'src/app/panel/rrhh/reportes/certificados',
  'src/app/panel/rrhh/reportes/lre',
  'src/app/panel/rrhh/reportes/previred',
  'src/app/panel/rrhh/reportes/resumen',
  'src/app/panel/rrhh/reportes/periodo'
];

const template = (title) => `
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">RRHH</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">${title}</span>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Módulo: ${title}</h1>
        <p className="text-slate-500">Esta sección está en construcción.</p>
      </div>
    </div>
  );
}
`;

routes.forEach(route => {
  const dirPath = path.join(process.cwd(), route);
  fs.mkdirSync(dirPath, { recursive: true });
  
  const title = route.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), template(title));
});

console.log('Dummy routes created successfully!');
