const fs = require('fs');
const path = require('path');

const compDir = 'src/components/agrupado';
if (!fs.existsSync(compDir)) {
  fs.mkdirSync(compDir, { recursive: true });
}

// 1. AgrupadoTable.tsx
const tableCode = `'use client'

import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import TransferModal from './TransferModal';

export default function AgrupadoTable({ productsList, sucursales }: { productsList: any[], sucursales: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  const openTransfer = (producto: any, sucursal: any, cellData: any) => {
    setSelectedData({
      cod_art: producto.cod_art,
      descripcion: producto.descripcion,
      cod_sucursal_origen: sucursal.cod_sucursal,
      sucursal_origen: sucursal.nombre,
      cantidad_disponible: cellData.cantidad,
      fecha_vencimiento: cellData.fecha_completa // Necesitamos la fecha completa para el DB
    });
    setModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-semibold whitespace-nowrap sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Producto
              </th>
              {sucursales.map(suc => (
                <th key={suc.cod_sucursal} className="px-6 py-4 font-semibold whitespace-nowrap border-r border-slate-100 last:border-0 text-center">
                  {suc.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {productsList.length === 0 ? (
              <tr>
                <td colSpan={sucursales.length + 1} className="px-6 py-12 text-center text-slate-400">
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              productsList.map((prod, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="font-bold text-slate-800">{prod.descripcion}</div>
                    <div className="text-xs font-mono text-slate-500 mt-1">{prod.cod_art}</div>
                  </td>
                  {sucursales.map(suc => {
                    const data = prod.sucursalData[suc.cod_sucursal];
                    
                    if (!data) {
                      return (
                        <td key={suc.cod_sucursal} className="px-6 py-4 text-center border-r border-slate-100 last:border-0">
                          <span className="text-slate-300">-</span>
                        </td>
                      );
                    }

                    const isVencido = data.dias_restantes < 0;
                    const isLiquidar = data.dias_restantes >= 0 && data.dias_restantes <= 60;
                    const isProximo = data.dias_restantes > 60 && data.dias_restantes <= 180;
                    const isPrecaucion = data.dias_restantes > 180 && data.dias_restantes <= 270;
                    
                    let bgClass = "bg-[#00B050]/20 text-[#00B050]";
                    if (isVencido) bgClass = "bg-[#D9D9D9] text-slate-700";
                    else if (isLiquidar) bgClass = "bg-[#FF0000]/20 text-[#FF0000]";
                    else if (isProximo) bgClass = "bg-[#E97132]/20 text-[#E97132]";
                    else if (isPrecaucion) bgClass = "bg-[#FFC000]/20 text-[#FFC000]";

                    return (
                      <td key={suc.cod_sucursal} className="px-6 py-4 text-center border-r border-slate-100 last:border-0 relative group">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={\`px-3 py-1 rounded-full font-bold \${bgClass}\`}>
                            {data.cantidad} un.
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {data.fechaStr}
                          </span>
                        </div>
                        {/* Hover Overlay Button for Transfer */}
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button 
                            onClick={() => openTransfer(prod, suc, data)}
                            className="bg-fuchsia-600 text-white p-2 rounded-lg shadow-md hover:bg-fuchsia-700 transition-colors"
                            title="Traspasar"
                          >
                            <ArrowRightLeft size={16} />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && selectedData && (
        <TransferModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          data={selectedData} 
          sucursales={sucursales}
        />
      )}
    </div>
  );
}`;
fs.writeFileSync(path.join(compDir, 'AgrupadoTable.tsx'), tableCode);

// 2. TransferModal.tsx
const modalCode = `'use client'

import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useTransferStore } from '@/store/transferStore';

export default function TransferModal({ isOpen, onClose, data, sucursales }: { isOpen: boolean, onClose: () => void, data: any, sucursales: any[] }) {
  const [destino, setDestino] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const addItem = useTransferStore(state => state.addItem);

  if (!isOpen) return null;

  const validSucursales = sucursales.filter(s => s.cod_sucursal !== data.cod_sucursal_origen);

  const handleSave = () => {
    if (!destino || cantidad <= 0 || cantidad > data.cantidad_disponible) return;
    
    const sucDestinoObj = validSucursales.find(s => s.cod_sucursal.toString() === destino);

    addItem({
      id: Date.now().toString(),
      cod_sucursal_origen: data.cod_sucursal_origen,
      sucursal_origen: data.sucursal_origen,
      cod_sucursal_destino: sucDestinoObj.cod_sucursal,
      sucursal_destino: sucDestinoObj.nombre,
      cod_art: data.cod_art,
      descripcion: data.descripcion,
      cantidad: cantidad,
      fecha_vencimiento: data.fecha_vencimiento
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <ArrowRightLeft size={20} className="text-fuchsia-600" />
            <h2 className="font-bold text-lg">Nuevo Traspaso</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="text-sm font-medium text-slate-500">Producto</div>
            <div className="font-bold text-slate-800">{data.descripcion} <span className="text-slate-400 font-mono text-sm ml-2">({data.cod_art})</span></div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
              <span className="text-sm text-slate-500">Origen: <span className="font-semibold text-slate-700">{data.sucursal_origen}</span></span>
              <span className="text-sm text-slate-500">Disponible: <span className="font-bold text-fuchsia-600">{data.cantidad_disponible} un.</span></span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Sucursal Destino</label>
            <select 
              value={destino} 
              onChange={e => setDestino(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
            >
              <option value="">Seleccione destino...</option>
              {validSucursales.map(s => (
                <option key={s.cod_sucursal} value={s.cod_sucursal}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Cantidad a Traspasar</label>
            <input 
              type="number" 
              min="1" 
              max={data.cantidad_disponible}
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!destino || cantidad <= 0 || cantidad > data.cantidad_disponible}
            className="px-6 py-2 bg-fuchsia-600 text-white font-medium rounded-lg hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar a Traspasos
          </button>
        </div>
      </div>
    </div>
  );
}`;
fs.writeFileSync(path.join(compDir, 'TransferModal.tsx'), modalCode);

// 3. Modificar agrupado/page.tsx
let pageCode = fs.readFileSync('src/app/agrupado/page.tsx', 'utf8');

// Replace standard table with AgrupadoTable
pageCode = pageCode.replace(
  /<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}/,
  `<AgrupadoTable productsList={productsList} sucursales={sucursales} />
    </div>
  );
}`
);

// We must also update getTodosLosProductos to return 'fecha_completa' (fecha_vencimiento format YYYY-MM-DD or date object stringified)
pageCode = pageCode.replace(
  /fechaStr: fechaStr,/,
  `fechaStr: fechaStr,
      fecha_completa: lote.fecha_vencimiento,`
);

pageCode = pageCode.replace(
  /import Link from 'next\/link';/,
  `import Link from 'next/link';\nimport AgrupadoTable from '@/components/agrupado/AgrupadoTable';`
);

fs.writeFileSync('src/app/agrupado/page.tsx', pageCode);

// 4. Floating Cart Component
const floatingDir = 'src/components/layout';
const floatingCode = `'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import { useTransferStore } from '@/store/transferStore';

export default function TransferCartIndicator() {
  const items = useTransferStore(state => state.items);
  
  if (items.length === 0) return null;

  return (
    <Link href="/traspasos" className="fixed bottom-6 right-6 bg-fuchsia-600 text-white px-6 py-3 rounded-full shadow-lg shadow-fuchsia-600/30 flex items-center gap-3 hover:bg-fuchsia-700 hover:scale-105 transition-all z-50">
      <ArrowRightLeft size={20} />
      <span className="font-bold">Traspasos Pendientes ({items.length})</span>
    </Link>
  );
}`;
fs.writeFileSync(path.join(floatingDir, 'TransferCartIndicator.tsx'), floatingCode);

// Add to layout.tsx
let layoutCode = fs.readFileSync('src/app/layout.tsx', 'utf8');
if (!layoutCode.includes('TransferCartIndicator')) {
  layoutCode = layoutCode.replace(
    /import Sidebar from '\@\/components\/layout\/Sidebar';/,
    `import Sidebar from '@/components/layout/Sidebar';\nimport TransferCartIndicator from '@/components/layout/TransferCartIndicator';`
  );
  layoutCode = layoutCode.replace(
    /<\/main>\s*<\/div>/,
    `</main>\n        <TransferCartIndicator />\n      </div>`
  );
  fs.writeFileSync('src/app/layout.tsx', layoutCode);
}
