const fs = require('fs');

const componentPath = 'src/components/dashboard/LotesTableClient.tsx';
let componentCode = fs.readFileSync(componentPath, 'utf8');

// Replace imports
componentCode = componentCode.replace(
  /import \{ Pencil, Trash2, Check, X, Loader2 \} from 'lucide-react';/,
  `import { Pencil, Trash2, Check, X, Loader2, XCircle, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';`
);

// Replace getSemaforoInfo
const getSemaforoRegex = /const getSemaforoInfo = \(dias: number\) => \{[\s\S]*?return \{ bg: 'bg-\[#00B050\]', border: 'border-\[#00B050\]', text: 'text-white' \};\s*\};/;
const newGetSemaforo = `const getSemaforoInfo = (dias: number) => {
    if (dias < 0) return { icon: XCircle, color: 'text-[#D9D9D9]', bg: 'bg-[#D9D9D9]', border: 'border-[#D9D9D9]', text: 'text-slate-800' };
    if (dias <= 60) return { icon: AlertCircle, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]', border: 'border-[#FF0000]', text: 'text-white' };
    if (dias <= 180) return { icon: AlertCircle, color: 'text-[#E97132]', bg: 'bg-[#E97132]', border: 'border-[#E97132]', text: 'text-white' };
    if (dias <= 270) return { icon: AlertTriangle, color: 'text-[#FFC000]', bg: 'bg-[#FFC000]', border: 'border-[#FFC000]', text: 'text-white' };
    return { icon: CheckCircle, color: 'text-[#00B050]', bg: 'bg-[#00B050]', border: 'border-[#00B050]', text: 'text-white' };
  };`;
componentCode = componentCode.replace(getSemaforoRegex, newGetSemaforo);

// Replace render of the semaphore icon
const renderRegex = /<td className="px-6 py-4 text-center">\s*<div className=\{`w-6 h-6 rounded-full mx-auto \$\{semaforo\.bg\} shadow-sm border \$\{semaforo\.border\}`\}><\/div>\s*<\/td>/;
const newRender = `<td className="px-6 py-4 text-center">
                    {React.createElement(semaforo.icon, { size: 24, className: \`mx-auto \${semaforo.color}\` })}
                  </td>`;
componentCode = componentCode.replace(renderRegex, newRender);

fs.writeFileSync(componentPath, componentCode);
console.log("Semaforo icons restored.");
