'use client'

import { useState, useEffect, useRef } from 'react';
import { getSucursales, searchProducto, registrarIngreso, checkIngresoExistente } from '@/app/actions';
import { PackagePlus, Search, CheckCircle2, AlertCircle, Camera, Maximize, X } from 'lucide-react';
import ScannerModal from '@/components/ScannerModal';

export default function IngresoVencimientos() {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isScannerMode, setIsScannerMode] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

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
      setRecentScans(prev => [{
        id: Date.now(),
        codigo: codigoIngresado,
        descripcion: productoData.descripcion,
        cantidad,
        fechaVencimiento
      }, ...prev].slice(0, 10)); // Keep last 10 items
      
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
          
  const FormContent = () => (
    <>
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
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
              <div className="flex gap-2">
                <div className="relative flex-1">
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
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-xl transition-colors border border-slate-200 flex-shrink-0 flex items-center justify-center"
                  title="Escanear con cámara del celular"
                >
                  <Camera size={24} />
                </button>
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
                inputMode="decimal"
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
          className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-fuchsia-600/30 flex items-center gap-2 w-full md:w-auto justify-center"
        >
          {loading ? 'Registrando...' : 'Registrar Ingreso'}
        </button>
      </div>
    </>
  );

  const RecentScansGrid = () => (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Últimos Ingresos</h3>
      {recentScans.length === 0 ? (
        <div className="text-sm text-slate-400 italic">No hay ingresos en esta sesión.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 rounded-l-lg">Producto</th>
                <th className="px-4 py-2">Cant.</th>
                <th className="px-4 py-2 rounded-r-lg">Venc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentScans.map(scan => (
                <tr key={scan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-slate-700">
                    <span className="block truncate max-w-[200px]" title={scan.descripcion}>{scan.descripcion}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{scan.cantidad}</td>
                  <td className="px-4 py-2 text-slate-600">{scan.fechaVencimiento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (isScannerMode) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-[60] flex flex-col overflow-y-auto">
        <div className="bg-fuchsia-600 p-4 text-white flex justify-between items-center shadow-md sticky top-0 z-10">
          <div className="flex items-center gap-2 font-bold text-lg">
            <PackagePlus size={24} />
            <span>Modo Escáner</span>
          </div>
          <button onClick={() => setIsScannerMode(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 flex-1 max-w-lg w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <FormContent />
            </form>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <RecentScansGrid />
          </div>
        </div>
        {showScanner && (
          <ScannerModal 
            onClose={() => setShowScanner(false)} 
            onScan={(code) => {
              setCodigoIngresado(code);
              setShowScanner(false);
              setTimeout(() => {
                if (scanRef.current) {
                  scanRef.current.focus();
                  scanRef.current.blur();
                }
              }, 100);
            }} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-fuchsia-600 p-3 rounded-xl text-white shadow-lg shadow-fuchsia-600/20">
            <PackagePlus size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Registrar Ingreso de Producto</h1>
            <p className="text-slate-500">Ingrese la fecha de vencimiento y unidades</p>
          </div>
        </div>
        <button 
          onClick={() => setIsScannerMode(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 font-medium shadow-lg w-full sm:w-auto justify-center"
        >
          <Maximize size={18} />
          Modo Escáner
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <FormContent />
        </form>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <RecentScansGrid />
      </div>

      {showScanner && (
        <ScannerModal 
          onClose={() => setShowScanner(false)} 
          onScan={(code) => {
            setCodigoIngresado(code);
            setShowScanner(false);
            // Wait slightly for React to update the state, then search
            setTimeout(() => {
              if (scanRef.current) {
                scanRef.current.focus();
                scanRef.current.blur(); // Trigger the onBlur search
              }
            }, 100);
          }} 
        />
      )}
    </div>
  );
}
