'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTrabajador, updateTrabajador } from '@/app/rrhh_actions';
import { Loader2, Save } from 'lucide-react';

function formatDateForInput(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

export default function TrabajadorForm({ afps, salud, initialData }: { afps: any[], salud: any[], initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    rut: initialData?.rut || '',
    nombres: initialData?.nombres || '',
    apellido_paterno: initialData?.apellido_paterno || initialData?.apellidos || '',
    apellido_materno: initialData?.apellido_materno || '',
    nacionalidad: initialData?.nacionalidad || 'Chilena',
    fecha_nacimiento: initialData?.fecha_nacimiento ? formatDateForInput(initialData.fecha_nacimiento) : '',
    direccion: initialData?.direccion || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
    nivel_educacional: initialData?.nivel_educacional || '',
    estado_civil: initialData?.estado_civil || '',
    cargas_familiares: initialData?.cargas_familiares || 0,
    afp_id: initialData?.afp_id?.toString() || '',
    salud_id: initialData?.salud_id?.toString() || '',
    banco: initialData?.banco || '',
    tipo_cuenta: initialData?.tipo_cuenta || '',
    numero_cuenta: initialData?.numero_cuenta || '',
    entrega_riohs: initialData?.entrega_riohs ? true : false,
    es_representante_legal: initialData?.es_representante_legal ? true : false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatRut = (value: string) => {
    let v = value.replace(/[^0-9Kk]/g, '').toUpperCase();
    if (v.length > 1) {
      v = v.slice(0, -1) + '-' + v.slice(-1);
    }
    return v;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, rut: formatRut(e.target.value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      afp_id: formData.afp_id ? parseInt(formData.afp_id) : null,
      salud_id: formData.salud_id ? parseInt(formData.salud_id) : null,
      cargas_familiares: parseInt(formData.cargas_familiares as any) || 0
    };

    let res: any;
    if (initialData?.id) {
      res = await updateTrabajador(initialData.id, payload);
    } else {
      res = await createTrabajador(payload);
    }
    
    if (res.success) {
      router.push(`/panel/rrhh/${initialData?.id || res.data?.id}`);
    } else {
      setError(res.error || 'Ocurrió un error al guardar el trabajador.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* DATOS PERSONALES */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Datos Personales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUT *</label>
            <input type="text" name="rut" required placeholder="12345678-9" value={formData.rut} onChange={handleRutChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombres *</label>
            <input type="text" name="nombres" required value={formData.nombres} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Paterno *</label>
            <input type="text" name="apellido_paterno" required value={formData.apellido_paterno} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Materno</label>
            <input type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Nacimiento</label>
            <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nacionalidad</label>
            <input type="text" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado Civil</label>
            <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccione...</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
              <option value="Viudo/a">Viudo/a</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cargas Familiares</label>
            <input type="number" name="cargas_familiares" min="0" value={formData.cargas_familiares} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
      </div>

      {/* CONTACTO Y EDUCACION */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Contacto y Educación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input type="text" name="telefono" placeholder="+56 9 1234 5678" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nivel Educacional</label>
            <select name="nivel_educacional" value={formData.nivel_educacional} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccione...</option>
              <option value="Básica Incompleta">Básica Incompleta</option>
              <option value="Básica Completa">Básica Completa</option>
              <option value="Media Incompleta">Media Incompleta</option>
              <option value="Media Completa">Media Completa</option>
              <option value="Técnico Incompleto">Técnico Incompleto</option>
              <option value="Técnico Completo">Técnico Completo</option>
              <option value="Universitario Incompleto">Universitario Incompleto</option>
              <option value="Universitario Completo">Universitario Completo</option>
            </select>
          </div>
        </div>
      </div>

      {/* PREVISION Y SALUD */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Previsión y Salud</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">AFP</label>
            <select name="afp_id" value={formData.afp_id} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccione AFP...</option>
              {afps.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Previsión de Salud</label>
            <select name="salud_id" value={formData.salud_id} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccione Institución...</option>
              {salud.map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.tipo})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* DATOS BANCARIOS */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Datos Bancarios para Remuneración</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
            <select name="banco" value={formData.banco} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccione Banco...</option>
              <option value="BANCOESTADO">BancoEstado</option>
              <option value="BANCO DE CHILE">Banco de Chile</option>
              <option value="BCI">BCI</option>
              <option value="SANTANDER">Santander</option>
              <option value="ITAU">Itaú</option>
              <option value="SCOTIABANK">Scotiabank</option>
              <option value="FALABELLA">Banco Falabella</option>
              <option value="CONSORCIO">Banco Consorcio</option>
              <option value="SECURITY">Banco Security</option>
              <option value="BICE">Banco BICE</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cuenta</label>
            <select name="tipo_cuenta" value={formData.tipo_cuenta} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccione Tipo...</option>
              <option value="CUENTA CORRIENTE">Cuenta Corriente</option>
              <option value="CUENTA VISTA">Cuenta Vista / RUT</option>
              <option value="CUENTA DE AHORRO">Cuenta de Ahorro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">N° de Cuenta</label>
            <input type="text" name="numero_cuenta" value={formData.numero_cuenta} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
      </div>

      {/* OTROS ANTECEDENTES */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Otros Antecedentes</h3>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" name="entrega_riohs" checked={formData.entrega_riohs} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
            <span className="text-sm font-medium text-slate-700">El trabajador ha recibido el RIOHS (Reglamento Interno)</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="es_representante_legal" checked={formData.es_representante_legal} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
            <span className="text-sm font-medium text-slate-700">Es Representante Legal de la empresa</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar Trabajador
        </button>
      </div>
    </form>
  );
}
