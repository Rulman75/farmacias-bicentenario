const fs = require('fs');

const consultorPath = 'src/app/consultor/page.tsx';
let consultorCode = fs.readFileSync(consultorPath, 'utf8');

consultorCode = consultorCode.replace(
  /import \{ Search, Loader2, Tag, Box, ArrowRight, X, Info \} from 'lucide-react';/,
  `import { Search, Loader2, Tag, Box, ArrowRight, X, Info, Calculator } from 'lucide-react';`
);

consultorCode = consultorCode.replace(
  /<div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50\/50 rounded-xl p-3">[\s\S]*?<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>/,
  `<div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                      <Box size={14} /> Unidades x Caja:
                    </span>
                    <span className="text-sm font-bold text-slate-700">{p.UnidadesCaja}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase">
                      <Calculator size={14} /> Precio Frac.:
                    </span>
                    <span className="text-sm font-black text-emerald-600">{formatoMoneda(p.PrecioFrac || p.Precio)}</span>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-200 border-dashed">
                    <span className="text-sm font-bold text-slate-600">Precio Total:</span>
                    <span className="text-xl font-black" style={{ color: '#3BB400' }}>{formatoMoneda(p.Precio)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>`
);

consultorCode = consultorCode.replace(
  /<p><span className="font-semibold text-slate-400">Laboratorio:<\/span> \{p\.Marca \|\| 'Sin marca'\}<\/p>\s*<\/div>\s*<\/div>/,
  `<p><span className="font-semibold text-slate-400">Laboratorio:</span> {p.Marca || 'Sin marca'}</p>
                    {String(p.Origen) === '2' && (
                      <div className="mt-2">
                        <img src="/bioequivalente.png" alt="Bioequivalente" className="h-6 object-contain" />
                      </div>
                    )}
                  </div>
                </div>`
);

// We should also replace the modal's price color to match
consultorCode = consultorCode.replace(
  /<span className="text-2xl font-black text-emerald-700">\{formatoMoneda\(selectedProduct\.Precio\)\}<\/span>/,
  `<span className="text-2xl font-black" style={{ color: '#3BB400' }}>{formatoMoneda(selectedProduct.Precio)}</span>`
);

consultorCode = consultorCode.replace(
  /\{selectedProduct\.UnidadesCaja > 1 && \(\s*<div className="flex justify-between items-center pt-3 border-t border-emerald-200\/50">[\s\S]*?<\/div>\s*\)\}/,
  `<div className="flex justify-between items-center pt-3 border-t border-emerald-200/50 mt-3">
                    <span className="text-emerald-600 font-medium flex items-center gap-2">
                      <Calculator size={16} /> Precio Fraccionado
                    </span>
                    <span className="text-xl font-black text-emerald-600">{formatoMoneda(selectedProduct.PrecioFrac || selectedProduct.Precio)}</span>
                  </div>`
);

fs.writeFileSync(consultorPath, consultorCode);
console.log("Aplicados cambios de color, iconos, y bioequivalente");
