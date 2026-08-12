import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const getBase64ImageFromUrl = async (imageUrl: string) => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string), false);
      reader.addEventListener("error", () => reject());
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

export const applyCorporateHeader = async (doc: jsPDF, docTitle: string, docNumber: string, dateStr: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Línea superior delgada (Verde Esmeralda)
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(1.5);
  doc.line(14, 10, pageWidth - 14, 10);
  
  // Intentar cargar e insertar el logo corporativo
  const logoBase64 = await getBase64ImageFromUrl('/logo-bicentenario.png');
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 14, 45, 14); // X, Y, Ancho, Alto
  } else {
    // Fallback si no carga el logo
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FARMACIAS BICENTENARIO', 14, 22);
  }
  
  // Subtítulo / Título Principal
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(docTitle, 14, 38);
  
  // Datos del Documento (Derecha) - Etiquetas Alineadas
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Nº Documento:`, pageWidth - 65, 20, { align: 'right' });
  doc.text(`Fecha Emisión:`, pageWidth - 65, 26, { align: 'right' });
  
  // Valores
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.text(docNumber, pageWidth - 14, 20, { align: 'right' });
  doc.text(dateStr, pageWidth - 14, 26, { align: 'right' });

  // Línea separadora sutil
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 42, pageWidth - 14, 42);
};

export const applyCorporateFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.text('Sistema de Gestión Farmacias Bicentenario', 14, doc.internal.pageSize.height - 10);
  }
};

export const formatDate = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};
