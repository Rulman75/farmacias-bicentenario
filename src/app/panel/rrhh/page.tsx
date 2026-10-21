'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  FileText,
  CalendarDays,
  Calculator,
  Activity,
  Clock,
  PieChart,
  FileSignature,
  DollarSign,
  Landmark,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function RrhhDashboardPage() {
  const etapas = [
    {
      numero: 'ETAPA 1',
      titulo: 'Dotación y Ciclo Contractual',
      descripcion: 'Ingreso de colaboradores, contratos, renovaciones de plazo fijo y término de relación laboral.',
      color: 'blue',
      items: [
        {
          href: '/panel/rrhh/personal',
          icon: <Users size={22} />,
          title: 'Fichas del Personal',
          desc: 'Directorio activo, carpetas digitales y cartola de vacaciones',
          badge: 'Maestro'
        },
        {
          href: '/panel/rrhh/nuevo',
          icon: <UserPlus size={22} />,
          title: 'Nuevo Empleado',
          desc: 'Enrolamiento de trabajador, AFP, Salud y cuenta bancaria'
        },
        {
          href: '/panel/rrhh/pendientes',
          icon: <FileSignature size={22} />,
          title: 'Contratos y Alertas',
          desc: 'Control de plazos fijos por vencer, sueldos base y emisión PDF',
          badge: 'Vigencias'
        },
        {
          href: '/panel/rrhh/plantillas-contratos',
          icon: <FileText size={22} />,
          title: 'Plantillas de Contratos',
          desc: 'Modelos por cargo y modalidad con etiquetas dinámicas {tags}',
          badge: 'Plantillas'
        },
        {
          href: '/panel/rrhh/finiquito',
          icon: <FileText size={22} />,
          title: 'Finiquitos',
          desc: 'Simulación y emisión de finiquitos e indemnizaciones legales'
        }
      ]
    },
    {
      numero: 'ETAPA 2',
      titulo: 'Control de Tiempo, Turnos y Ausentismos',
      descripcion: 'Registro de días trabajados, licencias médicas, vacaciones y turnos part-time que alimentan el cálculo de sueldo.',
      color: 'sky',
      items: [
        {
          href: '/panel/rrhh/asistencia',
          icon: <CalendarDays size={22} />,
          title: 'Asistencia Planta',
          desc: 'Planilla mensual de asistencia e inasistencias diarias'
        },
        {
          href: '/panel/rrhh/ausentismos',
          icon: <CalendarDays size={22} />,
          title: 'Vacaciones y Licencias',
          desc: 'Registro de licencias médicas, permisos y feriado legal'
        },
        {
          href: '/panel/rrhh/planificador',
          icon: <CalendarDays size={22} />,
          title: 'Planificador Part-Time',
          desc: 'Asignación semanal/mensual de turnos por sucursal'
        },
        {
          href: '/panel/rrhh/turnos',
          icon: <Clock size={22} />,
          title: 'Catálogo de Turnos',
          desc: 'Definición de bloques horarios y horas efectivas'
        }
      ]
    },
    {
      numero: 'ETAPA 3',
      titulo: 'Proceso Mensual de Remuneraciones (Paso a Paso)',
      descripcion: 'Sigue estos 4 pasos en orden cada mes para calcular y emitir las liquidaciones de sueldo sin errores.',
      color: 'emerald',
      items: [
        {
          href: '/panel/rrhh/parametros',
          icon: <Landmark size={22} />,
          title: 'Paso 1: Indicadores del Mes',
          desc: 'Configurar UF, UTM, Ingreso Mínimo y topes imponibles Previred',
          badge: 'Paso 1'
        },
        {
          href: '/panel/rrhh/anticipos',
          icon: <DollarSign size={22} />,
          title: 'Paso 2: Anticipos de Sueldo',
          desc: 'Nómina de quincenas y anticipos otorgados en el período',
          badge: 'Paso 2'
        },
        {
          href: '/panel/rrhh/haberes-descuentos',
          icon: <Calculator size={22} />,
          title: 'Paso 3: Haberes y Descuentos',
          desc: 'Colación, movilización, comisiones, bonos, horas extras y CCAF',
          badge: 'Paso 3'
        },
        {
          href: '/panel/rrhh/periodo',
          icon: <Activity size={22} />,
          title: 'Paso 4: Emitir Liquidaciones',
          desc: 'Cálculo masivo de nómina, colillas PDF y cuadratura del mes',
          badge: 'Paso 4'
        }
      ]
    },
    {
      numero: 'ETAPA 4',
      titulo: 'Cierre Mensual y Reportes Legales',
      descripcion: 'Exportación de archivos oficiales cuadratura contable, pago previsional y Dirección del Trabajo.',
      color: 'purple',
      items: [
        {
          href: '/panel/rrhh/reportes/previred',
          icon: <PieChart size={22} />,
          title: 'Archivo Previred',
          desc: 'Exportación para declaración y pago de cotizaciones previsionales'
        },
        {
          href: '/panel/rrhh/reportes/lre',
          icon: <FileText size={22} />,
          title: 'Libro de Remuneraciones (LRE)',
          desc: 'Formato electrónico exigido por la Dirección del Trabajo'
        },
        {
          href: '/panel/rrhh/reportes/contador',
          icon: <FileText size={22} />,
          title: 'Planilla Contador / Centralización',
          desc: 'Resumen consolidado de haberes, leyes sociales y líquidos'
        }
      ]
    }
  ];

  const colorMap: Record<
    string,
    {
      headerBg: string;
      headerBorder: string;
      badgeBg: string;
      badgeText: string;
      iconBg: string;
      iconText: string;
      cardHover: string;
    }
  > = {
    blue: {
      headerBg: 'bg-blue-50/70',
      headerBorder: 'border-blue-200',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-600',
      cardHover: 'hover:border-blue-400'
    },
    sky: {
      headerBg: 'bg-sky-50/70',
      headerBorder: 'border-sky-200',
      badgeBg: 'bg-sky-600',
      badgeText: 'text-white',
      iconBg: 'bg-sky-50',
      iconText: 'text-sky-600',
      cardHover: 'hover:border-sky-400'
    },
    emerald: {
      headerBg: 'bg-emerald-50/70',
      headerBorder: 'border-emerald-200',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      cardHover: 'hover:border-emerald-400'
    },
    purple: {
      headerBg: 'bg-purple-50/70',
      headerBorder: 'border-purple-200',
      badgeBg: 'bg-purple-600',
      badgeText: 'text-white',
      iconBg: 'bg-purple-50',
      iconText: 'text-purple-600',
      cardHover: 'hover:border-purple-400'
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
      {/* Encabezado Principal */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Gestión de Personas y Nómina
          </span>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">Módulo de Recursos Humanos</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Flujo ordenado en 4 etapas: desde la contratación y asistencia hasta el cálculo de liquidaciones y reportes legales.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/panel/rrhh/personal"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Users size={16} />
            Ver Personal Activo
          </Link>
          <Link
            href="/panel/rrhh/periodo"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Calculator size={16} />
            Ir a Nómina del Mes
          </Link>
        </div>
      </div>

      {/* Etapas del Proceso */}
      <div className="space-y-6">
        {etapas.map((etapa, idx) => {
          const st = colorMap[etapa.color];
          return (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`px-6 py-4 border-b ${st.headerBorder} ${st.headerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider ${st.badgeBg} ${st.badgeText}`}>
                    {etapa.numero}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800">{etapa.titulo}</h2>
                </div>
                <p className="text-xs text-slate-600 font-medium">{etapa.descripcion}</p>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {etapa.items.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className={`group relative flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all ${st.cardHover}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${st.iconBg} ${st.iconText} group-hover:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        {item.badge && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-slate-700">
                      <span>Ingresar</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
