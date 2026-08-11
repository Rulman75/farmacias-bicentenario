const fs = require('fs');

const pagePath = 'src/app/margenes/page.tsx';
let pageCode = fs.readFileSync(pagePath, 'utf8');

// Replace table header
pageCode = pageCode.replace(
  /<th className="px-4 py-3 font-semibold">Producto<\/th>/,
  `<th className="px-4 py-3 font-semibold w-24">Fecha / Doc</th>
                    <th className="px-4 py-3 font-semibold">Producto</th>`
);

// Replace table row body
pageCode = pageCode.replace(
  /<td className="px-4 py-3">\s*<div className="font-bold text-slate-800 line-clamp-1">\{d\.descripcion\}<\/div>\s*<div className="flex gap-2 items-center text-xs text-slate-500 mt-1">\s*<span className="font-mono bg-slate-100 px-1\.5 py-0\.5 rounded">\{d\.cod_art\}<\/span>\s*<span>\{d\.fecha\}<\/span>\s*\{d\.es_nuevo === 1 && <span className="bg-emerald-100 text-emerald-700 font-bold px-1\.5 py-0\.5 rounded-sm">NUEVO<\/span>\}\s*<\/div>\s*<\/td>/,
  `<td className="px-4 py-3">
                            <div className="font-bold text-slate-700">{d.fecha}</div>
                            <div className="text-xs font-mono text-slate-400 mt-1">{d.tipo === '33' ? 'FE' : d.tipo} {d.numero}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800 line-clamp-1">{d.descripcion}</div>
                            <div className="flex gap-2 items-center text-xs text-slate-500 mt-1">
                              <span className="font-semibold text-slate-400">COD:</span>
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{d.cod_art}</span>
                              {d.es_nuevo === 1 && <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-sm">NUEVO</span>}
                            </div>
                          </td>`
);

// Replace Costo Sim input with currency format
pageCode = pageCode.replace(
  /<td className="px-4 py-3 text-right bg-slate-50">\s*<input\s*type="number"\s*value=\{d\.simCostoNuevo\}\s*onChange=\{\(e\) => handleSimulate\(originalIndex, 'costo', e\.target\.value\)\}\s*className="w-24 text-right px-2 py-1 rounded bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-bold text-slate-800 shadow-sm"\s*\/>\s*<\/td>/,
  `<td className="px-4 py-3 text-right bg-slate-50">
                            <div className="relative inline-block w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none pointer-events-none">$</span>
                              <input 
                                type="number" 
                                value={d.simCostoNuevo} 
                                onChange={(e) => handleSimulate(originalIndex, 'costo', e.target.value)}
                                className="w-full pl-6 pr-2 py-1 rounded bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-bold text-slate-800 shadow-sm text-right"
                              />
                            </div>
                          </td>`
);

// Replace Precio Venta Sim input with currency format
pageCode = pageCode.replace(
  /<td className="px-4 py-3 text-right border-l border-slate-100">\s*<input\s*type="number"\s*value=\{d\.simPrecioVenta\}\s*onChange=\{\(e\) => handleSimulate\(originalIndex, 'precio', e\.target\.value\)\}\s*className="w-24 text-right px-2 py-1 rounded bg-indigo-50 border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-indigo-700 shadow-sm"\s*\/>\s*<\/td>/,
  `<td className="px-4 py-3 text-right border-l border-slate-100">
                            <div className="relative inline-block w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 font-medium select-none pointer-events-none">$</span>
                              <input 
                                type="number" 
                                value={d.simPrecioVenta} 
                                onChange={(e) => handleSimulate(originalIndex, 'precio', e.target.value)}
                                className="w-full pl-6 pr-2 py-1 rounded bg-indigo-50 border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-indigo-700 shadow-sm text-right"
                              />
                            </div>
                          </td>`
);

fs.writeFileSync(pagePath, pageCode);
console.log("Modificaciones de UI de margenes aplicadas");
