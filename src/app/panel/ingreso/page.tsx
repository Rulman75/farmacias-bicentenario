'use client'

import { useState, useEffect, useRef } from 'react';
import { getSucursales, searchProducto, registrarIngreso, checkIngresoExistente } from '@/app/actions';
import { PackagePlus, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function IngresoVencimientos() {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Foco para escáner
  const scanRef = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);

  // Form state
  const [codSucursal, setCodSucursal] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [productoData, setProductoData] = useState<{ cod_art: number, descripcion: string } | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  useEffect(() => {
    getSucursales().then(res => {
      if (res.success && res.data) {
        setSucursales(res.data);
        if (res.data.length > 0) setCodSucursal(res.data[0].cod_sucursal.toString());
      }
    });
    // Auto-focus on scan input on load
    setTimeout(() => scanRef.current?.focus(), 100);
  }, []);

  const handleSearchProducto = async () => {
    if (!codigoIngresado) return;
    setProductoData(null);
    setMessage(null);
    
    const res = await searchProducto(codigoIngresado);
    if (res.success && res.data) {
      setProductoData(res.data);
      setTimeout(() => cantidadRef.current?.focus(), 50);
    } else {
      setMessage({ type: 'error', text: res.error || 'Producto no encontrado' });
      // Volver a enfocar el escaner si hay error
      setTimeout(() => scanRef.current?.focus(), 50);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoData) {
      setMessage({ type: 'error', text: 'Debe seleccionar un producto válido' });
      return;
    }

    setLoading(true);

    const checkRes = await checkIngresoExistente(Number(codSucursal), productoData.cod_art);
    const isUpdate = checkRes.success && checkRes.exists;

    if (isUpdate) {
      const confirmUpdate = window.confirm('Este producto ya está ingresado en esta sucursal.\\n\\n¿Desea actualizar su cantidad y fecha de vencimiento?');
      if (!confirmUpdate) {
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('cod_sucursal', codSucursal);
    formData.append('codigo_ingresado', codigoIngresado);
    formData.append('cod_art', productoData.cod_art.toString());
    formData.append('cantidad', cantidad);
    formData.append('fecha_vencimiento', `${fechaVencimiento}-01`);
    if (isUpdate) formData.append('isUpdate', 'true');

    const res = await registrarIngreso(formData);
    setLoading(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Ingreso registrado correctamente' });
      // Reset form (except sucursal)
      setCodigoIngresado('');
      setProductoData(null);
      setCantidad('');
      setFechaVencimiento('');
      setTimeout(() => scanRef.current?.focus(), 100);
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al registrar' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-fuchsia-600 p-3 rounded-xl text-white shadow-lg shadow-fuchsia-600/20">
          <PackagePlus size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registrar Ingreso de Producto</h1>
          <p className="text-slate-500">Ingrese la fecha de vencimiento y unidades del nuevo producto</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 \${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sucursal de Destino</label>
              <select 
                value={codSucursal}
                onChange={(e) => setCodSucursal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all cursor-pointer"
                required
              >
                {sucursales.map(s => (
                  <option key={s.cod_sucursal} value={s.cod_sucursal}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Código de Barras o Interno</label>
              <div className="relative">
                <input 
                  type="text" 
                  ref={scanRef}
                  value={codigoIngresado}
                  onChange={(e) => setCodigoIngresado(e.target.value)}
                  onBlur={handleSearchProducto}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchProducto())}
                  placeholder="Escanee o escriba el código..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                  required
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          {/* Tarjeta de Producto Encontrado */}
          <div className={`p-5 rounded-xl border ${productoData ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'} transition-all`}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Producto Identificado</label>
            <div className="text-lg font-semibold text-slate-800">
              {productoData ? productoData.descripcion : <span className="text-slate-400 italic">Esperando lectura de código...</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Cantidad (Unidades)</label>
              <input 
                type="number" 
                ref={cantidadRef}
                min="0.01"
                step="0.01"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej. 50"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Fecha de Vencimiento (Mes-Año)</label>
              <input 
                type="month" 
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading || !productoData}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-fuchsia-600/30 flex items-center gap-2"
            >
              {loading ? 'Registrando...' : 'Registrar Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
