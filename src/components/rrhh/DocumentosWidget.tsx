'use client'

import React, { useState } from 'react';
import { uploadDocumento, deleteDocumento } from '@/app/rrhh_actions';
import { FileText, Plus, X, Loader2, Upload, Trash2, Download, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DocumentosWidget({ trabajadorId, documentos }: { trabajadorId: number, documentos: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Contrato');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Seleccione un archivo");
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('trabajador_id', trabajadorId.toString());
    formData.append('nombre', nombre);
    formData.append('tipo_documento', tipo);

    const res = await uploadDocumento(formData);
    
    if (res.success) {
      setIsOpen(false);
      setNombre('');
      setFile(null);
      router.refresh();
    } else {
      alert(res.error || 'Error al subir documento');
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;
    const res = await deleteDocumento(id, trabajadorId);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Error al eliminar');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-indigo-600" />
          <h3 className="font-bold text-slate-800">Gestor Documental</h3>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Subir Archivo
        </button>
      </div>

      <div className="p-0">
        {documentos && documentos.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {documentos.map((doc: any) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{doc.nombre}</h4>
                    <p className="text-xs text-slate-500">
                      {doc.tipo_documento} • Subido el {new Date(doc.fecha_subida).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    href={doc.archivo_url} 
                    target="_blank"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Descargar/Ver"
                  >
                    <Download size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p>No hay documentos adjuntos para este trabajador.</p>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Subir Documento</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Documento *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Contrato Indefinido 2023"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento *</label>
                <select 
                  required
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Contrato">Contrato</option>
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Carnet de Identidad">Carnet de Identidad</option>
                  <option value="Certificado">Certificado (AFP, Salud, Antecedentes)</option>
                  <option value="Curriculum">Curriculum Vitae</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Archivo *</label>
                <div className="relative">
                  <input 
                    type="file" 
                    required
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-slate-500"
                  >
                    <Upload size={24} />
                    <span className="font-medium">
                      {file ? file.name : 'Haz clic para seleccionar archivo'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Subir y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
