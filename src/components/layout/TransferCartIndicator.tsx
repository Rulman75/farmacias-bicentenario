'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import { useTransferStore } from '@/store/transferStore';

export default function TransferCartIndicator() {
  const items = useTransferStore(state => state.items);
  
  if (items.length === 0) return null;

  return (
    <Link href="/panel/traspasos" className="fixed bottom-6 right-6 bg-fuchsia-600 text-white px-6 py-3 rounded-full shadow-lg shadow-fuchsia-600/30 flex items-center gap-3 hover:bg-fuchsia-700 hover:scale-105 transition-all z-50">
      <ArrowRightLeft size={20} />
      <span className="font-bold">Traspasos Pendientes ({items.length})</span>
    </Link>
  );
}