'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, UserPlus, FileText, CalendarDays, Calculator, 
  Activity, Clock, PieChart, FileSignature, DollarSign,
  Landmark, X, ChevronLeft, ArrowRight
} from 'lucide-react';

export default function RrhhDashboardClient() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus = {
    personal: {
      title: 'Gestión de Personal',
      icon: <Users size={32} />,
      color: 'blue',
      items: [
        { href: '/panel/rrhh/nuevo', icon: <UserPlus size={28} />, title: 'Nuevo Empleado', color: 'blue' },
        { href: '/panel/rrhh/personal', icon: <Users size={28} />, title: 'Fichas del Personal', color: 'blue' },
        { href: '/panel/rrhh/pendientes', icon: <FileSignature size={28} />, title: 'Contratos', color: 'blue' },
        { href: '/panel/rrhh/finiquito', icon: <FileText size={28} />, title: 'Finiquitos', color: 'rose' },
        { href: '/panel/rrhh/asistencia', icon: <CalendarDays size={28} />, title: 'Asistencia Planta', color: 'sky' },
        { href: '/panel/rrhh/ausentismos', icon: <CalendarDays size={28} />, title: 'Ausentismos', color: 'sky' },
        { href: '/panel/rrhh/turnos', icon: <Clock size={28} />, title: 'Catálogo Turnos', color: 'indigo' },
        { href: '/panel/rrhh/planificador', icon: <CalendarDays size={28} />, title: 'Planificador Part-Time', color: 'indigo' },
      ]
    },
    remuneraciones: {
      title: 'Remuneraciones',
      icon: <DollarSign size={32} />,
      color: 'emerald',
      items: [
        { href: '/panel/rrhh/reportes/liquidaciones', icon: <FileText size={28} />, title: 'Liquidaciones', color: 'emerald' },
        { href: '/panel/rrhh/periodo', icon: <Activity size={28} />, title: 'Proceso Mensual', color: 'emerald' },
        { href: '/panel/rrhh/haberes-descuentos', icon: <Calculator size={28} />, title: 'Haberes y Descuentos', color: 'emerald' },
        { href: '/panel/rrhh/anticipos', icon: <DollarSign size={28} />, title: 'Anticipos de Sueldo', color: 'emerald' },
      ]
    },
    reportes: {
      title: 'Reportes Legales',
      icon: <PieChart size={32} />,
      color: 'purple',
      items: [
        { href: '/panel/rrhh/reportes/lre', icon: <FileText size={28} />, title: 'Libro de Remuneraciones (LRE)', color: 'purple' },
        { href: '/panel/rrhh/reportes/previred', icon: <PieChart size={28} />, title: 'Archivo Previred', color: 'purple' },
        { href: '/panel/rrhh/reportes/contador', icon: <FileText size={28} />, title: 'Planilla Contador', color: 'orange' },
      ]
    },
    configuracion: {
      title: 'Configuración',
      icon: <Landmark size={32} />,
      color: 'amber',
      items: [
        { href: '/panel/rrhh/parametros', icon: <Landmark size={28} />, title: 'Indicadores Previsionales', color: 'amber' },
      ]
    }
  };
  
  const colorStyles: Record<string, { bg: string, text: string, border: string, hoverBorder: string, hoverText: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-slate-200', hoverBorder: 'hover:border-blue-500', hoverText: 'group-hover:text-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-slate-200', hoverBorder: 'hover:border-emerald-500', hoverText: 'group-hover:text-emerald-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-slate-200', hoverBorder: 'hover:border-purple-500', hoverText: 'group-hover:text-purple-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-slate-200', hoverBorder: 'hover:border-amber-500', hoverText: 'group-hover:text-amber-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-slate-200', hoverBorder: 'hover:border-orange-500', hoverText: 'group-hover:text-orange-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-slate-200', hoverBorder: 'hover:border-rose-500', hoverText: 'group-hover:text-rose-500' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-slate-200', hoverBorder: 'hover:border-sky-500', hoverText: 'group-hover:text-sky-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-slate-200', hoverBorder: 'hover:border-indigo-500', hoverText: 'group-hover:text-indigo-500' }
  };

  const activeData = activeMenu ? menus[activeMenu as keyof typeof menus] : null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      
      {!activeMenu && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Recursos Humanos</h1>
            <p className="text-slate-500 mt-2">Selecciona un módulo para gestionar el personal y las remuneraciones.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(menus).map(([key, data]) => {
              const styles = colorStyles[data.color];
              return (
              <button 
                key={key}
                onClick={() => setActiveMenu(key)}
                className={`flex items-center p-8 bg-white border border-slate-200 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden ${styles.hoverBorder}`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform ${styles.bg} ${styles.text}`}>
                  {data.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">{data.title}</h2>
                  <p className="text-slate-500 text-sm">{data.items.length} opciones disponibles</p>
                </div>
                <div className={`absolute right-6 text-slate-300 transition-colors ${styles.hoverText}`}>
                  <ArrowRight size={24} />
                </div>
              </button>
            )})}
          </div>
        </>
      )}

      {activeData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => setActiveMenu(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
          >
            <ChevronLeft size={20} />
            Volver al menú principal
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorStyles[activeData.color].bg} ${colorStyles[activeData.color].text}`}>
              {activeData.icon}
            </div>
            <h1 className="text-3xl font-bold text-slate-800">{activeData.title}</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeData.items.map((item, idx) => {
              const iStyles = colorStyles[item.color];
              return (
              <Link 
                key={idx} 
                href={item.href} 
                className={`flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group ${iStyles.hoverBorder}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${iStyles.bg} ${iStyles.text}`}>
                  {item.icon}
                </div>
                <span className="font-bold text-slate-700 text-sm">{item.title}</span>
              </Link>
            )})}
          </div>
        </div>
      )}
      
    </div>
  );
}
