'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTrabajador, updateTrabajador } from '@/app/rrhh_actions';
import { Loader2, Save } from 'lucide-react';

export default function TrabajadorForm({ 
  afps, 
  salud,
  initialData 
}: { 
  afps: any[], 
  salud: any[],
  initialData?: any 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    rut: initialData?.rut || '',
    nombres: initialData?.nombres || '',
    apellidos: initialData?.apellidos || '',
    fecha_nacimiento: initialData?.fecha_nacimiento ? formatDateForInput(initialData.fecha_nacimiento) : '',
    direccion: initialData?.direccion || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
    estado_civil: initialData?.estado_civil || '',
    afp_id: initialData?.afp_id?.toString() || '',
    salud_id: initialData?.salud_id?.toString() || '',
    cargas_familiares: initialData?.cargas_familiares || 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">RUT *</label>
          <input 
            type="text" 
            name="rut"
            required
            placeholder="12345678-9"
            value={formData.rut}
            onChange={handleRutChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Nacimiento</label>
          <input 
            type="date" 
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombres *</label>
          <input 
            type="text" 
            name="nombres"
            required
            value={formData.nombres}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos *</label>
          <input 
            type="text" 
            name="apellidos"
            required
            value={formData.apellidos}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
          <input 
            type="text" 
            name="telefono"
            placeholder="+56 9 1234 5678"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
          <input 
            type="text" 
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado Civil</label>
          <select 
            name="estado_civil"
            value={formData.estado_civil}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Seleccione...</option>
            <option value="Soltero/a">Soltero/a</option>
            <option value="Casado/a">Casado/a</option>
            <option value="Divorciado/a">Divorciado/a</option>
            <option value="Viudo/a">Viudo/a</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cargas Familiares</label>
          <input 
            type="number" 
            name="cargas_familiares"
            min="0"
            value={formData.cargas_familiares}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">AFP</label>
          <select 
            name="afp_id"
            value={formData.afp_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Seleccione AFP...</option>
            {afps.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Previsión de Salud</label>
          <select 
            name="salud_id"
            value={formData.salud_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Seleccione Institución...</option>
            {salud.map(s => (
              <option key={s.id} value={s.id}>{s.nombre} ({s.tipo})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar Trabajador
        </button>
      </div>
    </form>
  );
}
