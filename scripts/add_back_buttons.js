const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('page.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const pages = walk('src/app/panel/rrhh');
const rootPage = path.normalize('src/app/panel/rrhh/page.tsx');

for (const file of pages) {
  if (file === rootPage) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('>Volver<')) continue;

  if (content.includes('lucide-react')) {
    if (!content.includes('ArrowLeft')) {
      content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { ArrowLeft, $1 } from 'lucide-react';");
    }
  } else {
    content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { ArrowLeft } from 'lucide-react';");
  }

  const breadcrumbStart = '<div className="flex items-center gap-2 text-sm text-slate-500 mb-6">';
  const newBreadcrumb = `<div className="flex items-center gap-4 mb-6">
        <Link href="/panel/rrhh" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
          <ArrowLeft size={16} />
          <span className="font-medium text-sm">Volver</span>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">`;
        
  if (content.includes(breadcrumbStart)) {
    content = content.replace(breadcrumbStart, newBreadcrumb);
    content = content.replace(/<span className="font-medium text-slate-800">([^<]+)<\/span>\s*<\/div>/, '<span className="font-medium text-slate-800">$1</span>\n        </div>\n      </div>');
  } else {
    const container = '<div className="w-full mx-auto space-y-6 pb-20">';
    const backBtn = `<div className="w-full mx-auto space-y-6 pb-20">
      <div className="mb-2">
        <Link href="/panel/rrhh" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
          <ArrowLeft size={16} />
          <span className="font-medium text-sm">Volver</span>
        </Link>
      </div>`;
    content = content.replace(container, backBtn);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated', file);
}
