'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface ScannerModalProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function ScannerModal({ onScan, onClose }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We create the scanner on mount
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 100 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Success
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignore error
      }
    );

    return () => {
      // Cleanup on unmount
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Camera size={20} className="text-fuchsia-600" />
            <span>Escáner de Cámara</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 relative bg-black/5">
          <div id="reader" className="w-full bg-black rounded-lg overflow-hidden border-2 border-slate-200"></div>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-500 text-center">
          Apunta la cámara al código de barras del producto. Se leerá automáticamente.
        </div>
      </div>
    </div>
  );
}
